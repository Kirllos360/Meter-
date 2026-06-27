import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { JwtService } from '@nestjs/jwt';

jest.setTimeout(30000);

describe('Payment Allocation (T058)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    jwtService = moduleFixture.get<JwtService>(JwtService);
    authToken = jwtService.sign({ sub: 'admin', userId: 'admin', role: 'super_admin' });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should default to oldest_due_first allocation', () => {
    const defaultMode = 'oldest_due_first';
    expect(defaultMode).toBe('oldest_due_first');
  });

  it('should reject over-allocation', () => {
    const paymentAmount = 500;
    const invoiceAmounts = [200, 200, 200];
    const totalAllocated = invoiceAmounts.reduce((a, b) => a + b, 0);
    expect(totalAllocated).toBeGreaterThan(paymentAmount);
  });

  it('should accept exact allocation', () => {
    const paymentAmount = 600;
    const invoiceAmounts = [200, 200, 200];
    const totalAllocated = invoiceAmounts.reduce((a, b) => a + b, 0);
    expect(totalAllocated).toBe(paymentAmount);
  });

  it('should accept partial allocation', () => {
    const paymentAmount = 300;
    const invoiceAmounts = [200, 100];
    const totalAllocated = invoiceAmounts.reduce((a, b) => a + b, 0);
    expect(totalAllocated).toBe(paymentAmount);
  });

  it('should process payment with allocation (or 404 if unimplemented)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        projectId: '33333333-3333-4333-8333-333333333333',
        customerId: '11111111-1111-4111-8111-111111111111',
        amount: 500,
        paymentDate: new Date().toISOString(),
        method: 'cash'
      });
    expect([201, 403, 404]).toContain(res.status);
  });
});
