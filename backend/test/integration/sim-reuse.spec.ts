import { NestExpressApplication } from '@nestjs/platform-express';
import { PrismaService } from '../../src/common/database/prisma.service';
import { createTestApp } from '../contract/setup';

jest.setTimeout(30000);

describe('SIM Reuse Lifecycle (integration)', () => {
  let app: NestExpressApplication;
  let request: any;
  let authHeader: string;
  let prisma: any;

  const meterId = '11111111-1111-4111-8111-111111111111';
  const simId = '00000000-0000-0000-0000-000000000001';
  const projectId = '33333333-3333-4333-8333-333333333333';
  const customerId = '44444444-4444-4444-8444-444444444444';
  const unitId = '55555555-5555-4555-8555-555555555555';

  const baseMeter = {
    id: meterId,
    serialNumber: 'TEST-METER-001',
    meterType: 'electricity',
    brand: 'TestBrand',
    model: 'TM-100',
    status: 'assigned',
    installationDate: new Date(),
    activationDate: new Date(),
    terminationDate: null,
    projectId,
    locationId: null,
    parentMainMeterId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'test-user-id',
    updatedBy: 'test-user-id'
  };

  const activeAssignment = {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    meterId,
    customerId,
    unitId,
    projectId,
    status: 'active',
    startAt: new Date('2026-01-01T00:00:00.000Z'),
    endAt: null,
    changeReason: 'Initial assignment',
    createdBy: 'test-user-id',
    updatedBy: 'test-user-id',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const baseSim = {
    id: simId,
    iccid: '89123456789012345678',
    msisdn: '+201234567890',
    provider: 'Vodafone',
    ipAddress: '10.0.0.1',
    ipType: 'dynamic',
    status: 'assigned',
    cooldownUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'test-user-id',
    updatedBy: 'test-user-id'
  };

  beforeAll(async () => {
    const testApp = await createTestApp();
    app = testApp.app;
    request = testApp.request;
    authHeader = testApp.authHeader;
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Scenario: SIM becomes immediately reusable (no cooldown)', () => {
    it('should return simReusable=true after termination', async () => {
      jest.spyOn(prisma.meter, 'findUnique').mockResolvedValue(baseMeter);
      jest.spyOn(prisma.meterAssignment, 'findFirst').mockResolvedValue(activeAssignment);
      jest.spyOn(prisma.meterAssignment, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.meter, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.sIMAssignment, 'findFirst').mockResolvedValue({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        simId,
        meterId,
        startAt: new Date('2026-01-01T00:00:00.000Z'),
        endAt: null,
        changeReason: 'Initial SIM assignment',
        status: 'active',
        createdBy: 'test-user-id',
        updatedBy: 'test-user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        sim: { ...baseSim, cooldownUntil: null }
      });
      jest.spyOn(prisma.sIMAssignment, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.sIMCard, 'update').mockResolvedValue({} as any);

      const res = await request
        .post(`/api/v1/meters/${meterId}/terminate`)
        .set('Authorization', authHeader)
        .send({
          reason: 'Meter upgrade',
          terminatedAt: '2026-05-29T12:00:00.000Z',
          finalReading: 5000
        });

      expect(res.status).toBe(200);
      expect(res.body.simReusable).toBe(true);
      expect(res.body.simStatus).toBe('released');
      expect(res.body.meterStatus).toBe('terminated');
    });
  });

  describe('Scenario: SIM in cooldown (not reusable)', () => {
    it('should return simReusable=false when cooldown is active', async () => {
      jest.spyOn(prisma.meter, 'findUnique').mockResolvedValue(baseMeter);
      jest.spyOn(prisma.meterAssignment, 'findFirst').mockResolvedValue(activeAssignment);
      jest.spyOn(prisma.meterAssignment, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.meter, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.sIMAssignment, 'findFirst').mockResolvedValue({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        simId,
        meterId,
        startAt: new Date('2026-01-01T00:00:00.000Z'),
        endAt: null,
        changeReason: 'Initial SIM assignment',
        status: 'active',
        createdBy: 'test-user-id',
        updatedBy: 'test-user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        sim: { ...baseSim, cooldownUntil: new Date('2099-12-31T23:59:59Z') }
      });
      jest.spyOn(prisma.sIMAssignment, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.sIMCard, 'update').mockResolvedValue({} as any);

      const res = await request
        .post(`/api/v1/meters/${meterId}/terminate`)
        .set('Authorization', authHeader)
        .send({
          reason: 'Meter upgrade',
          terminatedAt: '2026-05-29T12:00:00.000Z',
          finalReading: 5000
        });

      expect(res.status).toBe(200);
      expect(res.body.simReusable).toBe(false);
      expect(res.body.simStatus).toBe('cooldown');
    });
  });

  describe('Scenario: No SIM assigned during termination', () => {
    it('should return simStatus=none when no SIM is assigned', async () => {
      jest.spyOn(prisma.meter, 'findUnique').mockResolvedValue(baseMeter);
      jest.spyOn(prisma.meterAssignment, 'findFirst').mockResolvedValue(activeAssignment);
      jest.spyOn(prisma.meterAssignment, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.meter, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.sIMAssignment, 'findFirst').mockResolvedValue(null);

      const res = await request
        .post(`/api/v1/meters/${meterId}/terminate`)
        .set('Authorization', authHeader)
        .send({
          reason: 'Meter decommissioned',
          terminatedAt: '2026-05-29T12:00:00.000Z',
          finalReading: 1000
        });

      expect(res.status).toBe(200);
      expect(res.body.simStatus).toBe('none');
      expect(res.body.simReusable).toBe(false);
    });
  });

  describe('Scenario: SIM eligibility reflects correct state', () => {
    it('should return eligible=true when cooldown expired', async () => {
      jest.spyOn(prisma.sIMCard, 'findUnique').mockResolvedValue({
        ...baseSim,
        status: 'reusable',
        cooldownUntil: new Date('2020-01-01T00:00:00Z')
      });
      jest.spyOn(prisma.sIMAssignment, 'findFirst').mockResolvedValue(null);

      const res = await request.get(`/api/v1/sim-cards/${simId}/eligibility`);

      expect(res.status).toBe(200);
      expect(res.body.eligible).toBe(true);
      expect(res.body.reason).toBe('Cooldown period expired');
    });

    it('should return eligible=false when cooldown is active', async () => {
      const futureDate = new Date('2099-12-31T23:59:59Z');
      jest.spyOn(prisma.sIMCard, 'findUnique').mockResolvedValue({
        ...baseSim,
        status: 'old',
        cooldownUntil: futureDate
      });
      jest.spyOn(prisma.sIMAssignment, 'findFirst').mockResolvedValue(null);

      const res = await request.get(`/api/v1/sim-cards/${simId}/eligibility`);

      expect(res.status).toBe(200);
      expect(res.body.eligible).toBe(false);
      expect(res.body.cooldownUntil).toBe(futureDate.toISOString());
    });

    it('should return eligible=true when SIM is available with no cooldown', async () => {
      jest.spyOn(prisma.sIMCard, 'findUnique').mockResolvedValue({
        ...baseSim,
        status: 'available',
        cooldownUntil: null
      });
      jest.spyOn(prisma.sIMAssignment, 'findFirst').mockResolvedValue(null);

      const res = await request.get(`/api/v1/sim-cards/${simId}/eligibility`);

      expect(res.status).toBe(200);
      expect(res.body.eligible).toBe(true);
      expect(res.body.reason).toBe('SIM is available');
    });
  });
});
