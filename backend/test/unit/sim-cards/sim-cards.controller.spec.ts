import { Test, TestingModule } from '@nestjs/testing';
import { SimCardsController } from '../../../src/sim-cards/sim-cards.controller';
import { SimCardsService } from '../../../src/sim-cards/sim-cards.service';

describe('SimCardsController', () => {
  let controller: SimCardsController;
  let service: any;

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
    updatedAt: new Date()
  };

  const mockEligibility = {
    simId: 'sim-1',
    eligible: true,
    reason: 'SIM is available',
    cooldownUntil: null
  };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(mockSim),
      findAll: jest.fn().mockResolvedValue([mockSim]),
      findOne: jest.fn().mockResolvedValue(mockSim),
      update: jest.fn().mockResolvedValue(mockSim),
      remove: jest.fn().mockResolvedValue(undefined),
      getEligibility: jest.fn().mockResolvedValue(mockEligibility)
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SimCardsController],
      providers: [{ provide: SimCardsService, useValue: service }]
    }).compile();

    controller = module.get<SimCardsController>(SimCardsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a SIM card', async () => {
      const dto = {
        iccid: '89123456789012345678',
        msisdn: '+201234567890',
        provider: 'Vodafone',
        ipAddress: '10.0.0.1',
        ipType: 'dynamic'
      };
      const result = await controller.create(dto as any, { user: { userId: 'user-1' } } as any);
      expect(result).toEqual(mockSim);
      expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
    });
  });

  describe('findAll', () => {
    it('should return all SIM cards', async () => {
      const result = await controller.findAll({} as any);
      expect(result).toHaveLength(1);
      expect(service.findAll).toHaveBeenCalledWith({});
    });
  });

  describe('findOne', () => {
    it('should return a SIM card by id', async () => {
      const result = await controller.findOne('sim-1');
      expect(result).toEqual(mockSim);
      expect(service.findOne).toHaveBeenCalledWith('sim-1');
    });
  });

  describe('update', () => {
    it('should update a SIM card', async () => {
      const dto = { provider: 'Orange' };
      const result = await controller.update(
        'sim-1',
        dto as any,
        { user: { userId: 'user-1' } } as any
      );
      expect(result).toEqual(mockSim);
      expect(service.update).toHaveBeenCalledWith('sim-1', dto, 'user-1');
    });
  });

  describe('remove', () => {
    it('should soft-delete a SIM card', async () => {
      await controller.remove('sim-1', { user: { userId: 'user-1' } } as any);
      expect(service.remove).toHaveBeenCalledWith('sim-1', 'user-1');
    });
  });

  describe('getEligibility', () => {
    it('should return eligibility', async () => {
      const result = await controller.getEligibility('sim-1');
      expect(result).toEqual(mockEligibility);
      expect(service.getEligibility).toHaveBeenCalledWith('sim-1');
    });
  });
});
