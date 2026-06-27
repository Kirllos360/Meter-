import { Test, TestingModule } from '@nestjs/testing';
import { SimCardsService } from '../../../src/sim-cards/sim-cards.service';
import { PrismaService } from '../../../src/common/database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('SimCardsService', () => {
  let service: SimCardsService;
  let prisma: any;

  const mockSim = {
    id: 'sim-1',
    iccid: '89123456789012345678',
    msisdn: '+201234567890',
    provider: 'Vodafone',
    ipAddress: '10.0.0.1',
    ipType: 'dynamic',
    status: 'available',
    cooldownUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
    updatedBy: 'user-1'
  };

  beforeEach(async () => {
    prisma = {
      sIMCard: {
        create: jest.fn().mockResolvedValue(mockSim),
        findMany: jest.fn().mockResolvedValue([mockSim]),
        findUnique: jest.fn().mockResolvedValue(mockSim),
        update: jest.fn().mockResolvedValue({ ...mockSim, status: 'retired' })
      },
      sIMAssignment: {
        findFirst: jest.fn().mockResolvedValue(null)
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SimCardsService, { provide: PrismaService, useValue: prisma }]
    }).compile();

    service = module.get<SimCardsService>(SimCardsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a SIM card with status available', async () => {
      const dto = {
        iccid: '89123456789012345678',
        msisdn: '+201234567890',
        provider: 'Vodafone',
        ipAddress: '10.0.0.1',
        ipType: 'dynamic' as const
      };
      const result = await service.create(dto, 'user-1');
      expect(result.iccid).toBe('89123456789012345678');
      expect(prisma.sIMCard.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ iccid: '89123456789012345678', status: 'available' })
        })
      );
    });

    it('should create with static IP type', async () => {
      const dto = {
        iccid: '89123456789012345679',
        msisdn: '+201234567891',
        provider: 'Orange',
        ipAddress: '10.0.0.2',
        ipType: 'static' as const
      };
      await service.create(dto, 'user-1');
      expect(prisma.sIMCard.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ipType: 'static' })
        })
      );
    });
  });

  describe('findAll', () => {
    it('should return all SIM cards', async () => {
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].iccid).toBe('89123456789012345678');
    });

    it('should filter by status', async () => {
      await service.findAll({ status: 'available' });
      expect(prisma.sIMCard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'available' })
        })
      );
    });

    it('should filter by provider', async () => {
      await service.findAll({ provider: 'Vodafone' });
      expect(prisma.sIMCard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            provider: expect.objectContaining({ contains: 'Vodafone' })
          })
        })
      );
    });

    it('should search by iccid or msisdn', async () => {
      await service.findAll({ search: '891234' });
      expect(prisma.sIMCard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) })
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a SIM card by id', async () => {
      const result = await service.findOne('sim-1');
      expect(result.id).toBe('sim-1');
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.sIMCard.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a SIM card', async () => {
      const dto = { provider: 'Orange' };
      const result = await service.update('sim-1', dto, 'user-1');
      expect(result.provider).toBe('Vodafone');
    });

    it('should update cooldownUntil to a date', async () => {
      const dto = { cooldownUntil: '2026-06-28T12:00:00.000Z' };
      await service.update('sim-1', dto, 'user-1');
      expect(prisma.sIMCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ cooldownUntil: new Date('2026-06-28T12:00:00.000Z') })
        })
      );
    });

    it('should update cooldownUntil to null', async () => {
      const dto = { cooldownUntil: null };
      await service.update('sim-1', dto, 'user-1');
      expect(prisma.sIMCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ cooldownUntil: null })
        })
      );
    });

    it('should throw NotFoundException when updating nonexistent SIM', async () => {
      prisma.sIMCard.findUnique.mockResolvedValue(null);
      await expect(service.update('nonexistent', {}, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete a SIM card (status = retired)', async () => {
      await service.remove('sim-1', 'user-1');
      expect(prisma.sIMCard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sim-1' },
          data: expect.objectContaining({ status: 'retired' })
        })
      );
    });

    it('should throw NotFoundException when removing nonexistent SIM', async () => {
      prisma.sIMCard.findUnique.mockResolvedValue(null);
      await expect(service.remove('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getEligibility', () => {
    it('should return eligible when SIM is available', async () => {
      const result = await service.getEligibility('sim-1');
      expect(result.eligible).toBe(true);
      expect(result.reason).toBe('SIM is available');
    });

    it('should return not eligible when SIM has active assignment', async () => {
      prisma.sIMAssignment.findFirst.mockResolvedValue({ id: 'assign-1' });
      const result = await service.getEligibility('sim-1');
      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('SIM is currently assigned to an active meter');
    });

    it('should return not eligible when SIM is in cooldown', async () => {
      prisma.sIMCard.findUnique.mockResolvedValue({
        ...mockSim,
        cooldownUntil: new Date('2099-12-31T23:59:59Z')
      });
      const result = await service.getEligibility('sim-1');
      expect(result.eligible).toBe(false);
      expect(result.reason).toBe('SIM is in cooldown period');
      expect(result.cooldownUntil).toBeDefined();
    });

    it('should return eligible when cooldown expired', async () => {
      prisma.sIMCard.findUnique.mockResolvedValue({
        ...mockSim,
        cooldownUntil: new Date('2020-01-01T00:00:00Z')
      });
      const result = await service.getEligibility('sim-1');
      expect(result.eligible).toBe(true);
      expect(result.reason).toBe('Cooldown period expired');
    });

    it('should throw NotFoundException when SIM not found', async () => {
      prisma.sIMCard.findUnique.mockResolvedValue(null);
      await expect(service.getEligibility('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
