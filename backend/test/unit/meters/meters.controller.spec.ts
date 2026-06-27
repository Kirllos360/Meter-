import { Test, TestingModule } from '@nestjs/testing';
import { MetersController } from '../../../src/meters/meters.controller';
import { MetersService } from '../../../src/meters/meters.service';

describe('MetersController', () => {
  let controller: MetersController;
  let service: any;

  const mockMeter = {
    id: 'meter-1',
    serialNumber: 'MTR-001',
    meterType: 'electricity',
    brand: 'TestBrand',
    model: 'TM-100',
    status: 'available',
    installationDate: new Date('2026-01-01'),
    activationDate: new Date('2026-01-15'),
    terminationDate: null,
    projectId: 'proj-1',
    locationId: null,
    parentMainMeterId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockAssignment = {
    id: 'assign-1',
    meterId: 'meter-1',
    customerId: 'cust-1',
    unitId: 'unit-1',
    status: 'active',
    startAt: new Date(),
    endAt: null
  };

  const mockTerminateResult = {
    meterStatus: 'terminated',
    simStatus: 'none',
    simReusable: false
  };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(mockMeter),
      findAll: jest.fn().mockResolvedValue([mockMeter]),
      findOne: jest.fn().mockResolvedValue(mockMeter),
      update: jest.fn().mockResolvedValue(mockMeter),
      remove: jest.fn().mockResolvedValue(undefined),
      assignMeter: jest.fn().mockResolvedValue(mockAssignment),
      terminateMeter: jest.fn().mockResolvedValue(mockTerminateResult)
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetersController],
      providers: [{ provide: MetersService, useValue: service }]
    }).compile();

    controller = module.get<MetersController>(MetersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a meter', async () => {
      const dto = {
        serialNumber: 'MTR-001',
        meterType: 'electricity',
        brand: 'TestBrand',
        model: 'TM-100',
        installationDate: '2026-01-01T00:00:00Z',
        activationDate: '2026-01-15T00:00:00Z',
        projectId: 'proj-1'
      };
      const result = await controller.create(dto as any, { user: { userId: 'user-1' } } as any);
      expect(result).toEqual(mockMeter);
      expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
    });
  });

  describe('findAll', () => {
    it('should return all meters', async () => {
      const result = await controller.findAll({} as any);
      expect(result).toHaveLength(1);
      expect(service.findAll).toHaveBeenCalledWith({});
    });
  });

  describe('findOne', () => {
    it('should return a meter by id', async () => {
      const result = await controller.findOne('meter-1');
      expect(result).toEqual(mockMeter);
      expect(service.findOne).toHaveBeenCalledWith('meter-1');
    });
  });

  describe('update', () => {
    it('should update a meter', async () => {
      const dto = { brand: 'UpdatedBrand' };
      const result = await controller.update(
        'meter-1',
        dto as any,
        { user: { userId: 'user-1' } } as any
      );
      expect(result).toEqual(mockMeter);
      expect(service.update).toHaveBeenCalledWith('meter-1', dto, 'user-1');
    });
  });

  describe('remove', () => {
    it('should soft-delete a meter', async () => {
      await controller.remove('meter-1', { user: { userId: 'user-1' } } as any);
      expect(service.remove).toHaveBeenCalledWith('meter-1', 'user-1');
    });
  });

  describe('assignMeter', () => {
    it('should assign a meter', async () => {
      const dto = {
        customerId: 'cust-1',
        unitId: 'unit-1',
        projectId: 'proj-1',
        startAt: '2026-01-01T00:00:00Z'
      };
      const result = await controller.assignMeter(
        'meter-1',
        dto as any,
        { user: { userId: 'user-1' } } as any
      );
      expect(result).toEqual(mockAssignment);
      expect(service.assignMeter).toHaveBeenCalledWith('meter-1', dto, 'user-1');
    });
  });

  describe('terminateMeter', () => {
    it('should terminate a meter', async () => {
      const dto = {
        reason: 'Decommission',
        terminatedAt: '2026-05-29T12:00:00Z',
        finalReading: 5000
      };
      const result = await controller.terminateMeter(
        'meter-1',
        dto as any,
        { user: { userId: 'user-1' } } as any
      );
      expect(result).toEqual(mockTerminateResult);
      expect(service.terminateMeter).toHaveBeenCalledWith('meter-1', dto, 'user-1');
    });
  });
});
