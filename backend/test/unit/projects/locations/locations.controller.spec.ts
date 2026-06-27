import { Test, TestingModule } from '@nestjs/testing';
import { LocationsController } from '../../../../src/projects/locations/locations.controller';
import { LocationsService } from '../../../../src/projects/locations/locations.service';

describe('LocationsController', () => {
  let controller: LocationsController;
  let service: any;

  const projectId = 'proj-1';
  const mockLocation = {
    id: 'loc-1',
    projectId,
    parentId: null,
    nodeType: 'building',
    code: 'B01',
    name: 'Building 1',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(mockLocation),
      findAll: jest.fn().mockResolvedValue([mockLocation]),
      findOne: jest.fn().mockResolvedValue(mockLocation),
      update: jest.fn().mockResolvedValue(mockLocation),
      remove: jest.fn().mockResolvedValue(undefined)
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationsController],
      providers: [{ provide: LocationsService, useValue: service }]
    }).compile();

    controller = module.get<LocationsController>(LocationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a location', async () => {
    const dto = { nodeType: 'building' as const, code: 'B01', name: 'Building 1' };
    const result = await controller.create(projectId, dto, { user: { userId: 'user-1' } });
    expect(result.code).toBe('B01');
  });

  it('should list all locations for a project', async () => {
    const result = await controller.findAll(projectId);
    expect(result).toHaveLength(1);
  });

  it('should get a single location', async () => {
    const result = await controller.findOne(projectId, 'loc-1');
    expect(result.id).toBe('loc-1');
  });

  it('should update a location', async () => {
    const result = await controller.update(
      projectId,
      'loc-1',
      { name: 'Updated' },
      { user: { userId: 'user-1' } }
    );
    expect(result.id).toBe('loc-1');
  });

  it('should remove a location', async () => {
    await controller.remove(projectId, 'loc-1', { user: { userId: 'user-1' } });
    expect(service.remove).toHaveBeenCalledWith(projectId, 'loc-1', 'user-1');
  });
});
