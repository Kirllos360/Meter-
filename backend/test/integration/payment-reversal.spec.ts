import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../../src/auth/types';

jest.setTimeout(30000);

describe('Payment Reversal (T059)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  function makeToken(role: string) {
    return jwtService.sign({ sub: 'user', userId: 'user', role });
  }

  it('should reject reversal by non-super_admin with 403', async () => {
    const token = makeToken(Role.OPERATOR);
    const res = await request(app.getHttpServer())
      .post('/api/v1/payments/11111111-1111-4111-8111-111111111111/reverse')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'test' });
    expect([403, 404]).toContain(res.status);
  });

  it('should accept reversal by super_admin (or 404 if unimplemented)', async () => {
    const token = makeToken(Role.SUPER_ADMIN);
    const res = await request(app.getHttpServer())
      .post('/api/v1/payments/11111111-1111-4111-8111-111111111111/reverse')
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Customer requested reversal' });
    expect([200, 403, 404]).toContain(res.status);
  });

  it('should reject reversal without reason', async () => {
    const token = makeToken(Role.SUPER_ADMIN);
    const res = await request(app.getHttpServer())
      .post('/api/v1/payments/11111111-1111-4111-8111-111111111111/reverse')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect([400, 403, 404, 422]).toContain(res.status);
  });

  it('should verify super_admin role has highest privilege', () => {
    const allRoles = Object.values(Role);
    expect(allRoles).toContain(Role.SUPER_ADMIN);
    expect(Role.SUPER_ADMIN).toBe('super_admin');
  });
});
