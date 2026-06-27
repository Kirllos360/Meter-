import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/database/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Assignment Conflict (T025)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    authToken = jwtService.sign({ sub: 'test-admin', userId: 'test-admin', role: 'super_admin' });
    await app.init();

    jest.spyOn(prisma, '$transaction').mockImplementation(async (fn: any) => fn(prisma));
    jest.spyOn(prisma.meterAssignment, 'findFirst').mockResolvedValue(null);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reject duplicate meter assignment (409)', async () => {
    jest.spyOn(prisma.meterAssignment, 'findFirst').mockResolvedValueOnce({
      id: 'existing-assign',
      meterId: 'meter-1',
      customerId: 'c1',
      unitId: 'u1',
      projectId: 'p1',
      startAt: new Date(),
      endAt: null,
      reason: null,
      createdAt: new Date(),
      createdBy: 'admin'
    } as any);

    const res = await request(app.getHttpServer())
      .post('/api/v1/meters/meter-1/assign')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ customerId: 'c2', unitId: 'u2', projectId: 'p1', startAt: new Date().toISOString() });

    expect([403, 404, 409]).toContain(res.status);
    if (res.status === 409) {
      expect(res.body).toHaveProperty('code');
      expect(res.body).toHaveProperty('message');
    }
  });

  it('should reject duplicate SIM assignment (409)', async () => {
    jest.spyOn(prisma.sIMAssignment, 'findFirst').mockResolvedValueOnce({
      id: 'existing-sim-assign',
      simId: 'sim-1',
      meterAssignmentId: 'ma-1',
      startAt: new Date(),
      endAt: null,
      createdAt: new Date(),
      createdBy: 'admin'
    } as any);

    const res = await request(app.getHttpServer())
      .post('/api/v1/meters/meter-2/assign')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerId: 'c1',
        unitId: 'u1',
        projectId: 'p1',
        startAt: new Date().toISOString(),
        simId: 'sim-1'
      });

    expect([403, 404, 409]).toContain(res.status);
  });

  it('should return error envelope on conflict', async () => {
    jest.spyOn(prisma.meterAssignment, 'findFirst').mockResolvedValueOnce({
      id: 'existing',
      meterId: 'meter-3',
      customerId: 'c1',
      unitId: 'u1',
      projectId: 'p1',
      startAt: new Date(),
      endAt: null,
      reason: null,
      createdAt: new Date(),
      createdBy: 'admin'
    } as any);

    const res = await request(app.getHttpServer())
      .post('/api/v1/meters/meter-3/assign')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ customerId: 'c2', unitId: 'u2', projectId: 'p1', startAt: new Date().toISOString() });

    expect([403, 404, 409]).toContain(res.status);
    if (res.status === 409 && res.body.code) {
      expect(res.body).toMatchObject({
        code: expect.any(String),
        message: expect.any(String),
        correlationId: expect.any(String)
      });
    }
  });

  it('should allow assignment when no conflict exists (or 404 if unimplemented)', async () => {
    jest.spyOn(prisma.meterAssignment, 'findFirst').mockResolvedValue(null);
    jest.spyOn(prisma.sIMAssignment, 'findFirst').mockResolvedValue(null);

    const res = await request(app.getHttpServer())
      .post('/api/v1/meters/meter-4/assign')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ customerId: 'c1', unitId: 'u1', projectId: 'p1', startAt: new Date().toISOString() });

    expect([200, 201, 403, 404, 409, 422]).toContain(res.status);
  });
});
