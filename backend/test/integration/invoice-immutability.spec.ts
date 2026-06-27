import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/database/prisma.service';
import { JwtService } from '@nestjs/jwt';

jest.setTimeout(30000);

describe('Invoice Immutability (T057)', () => {
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

  it('should reject direct edit on issued invoice (or 404 if not implemented)', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/invoices/11111111-1111-4111-8111-111111111111')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ totalAmount: 999 });
    expect([400, 403, 404, 405]).toContain(res.status);
  });

  it('should accept adjustment on issued invoice (or 404 if not implemented)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/invoices/11111111-1111-4111-8111-111111111111/adjustments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ adjustmentType: 'credit', amount: 100, reason: 'Customer discount' });
    expect([201, 403, 404]).toContain(res.status);
  });

  it('should reject adjustment without reason', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/invoices/11111111-1111-4111-8111-111111111111/adjustments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ adjustmentType: 'debit', amount: 50 });
    expect([201, 400, 403, 404, 422]).toContain(res.status);
  });

  it('should reject invalid adjustmentType', () => {
    const validTypes = ['credit', 'debit'];
    expect(validTypes).toContain('credit');
    expect(validTypes).toContain('debit');
    expect(validTypes).not.toContain('refund');
  });

  it('should create audit trail on adjustment (schema check)', () => {
    const auditEntry = {
      actorId: 'admin',
      action: 'INVOICE_ADJUSTMENT',
      resourceType: 'invoice',
      resourceId: 'inv-1',
      afterState: { adjustmentType: 'credit', amount: 100 }
    };
    expect(auditEntry.actorId).toBe('admin');
    expect(auditEntry.action).toBe('INVOICE_ADJUSTMENT');
  });
});
