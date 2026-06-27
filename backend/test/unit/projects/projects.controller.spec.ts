import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from '../../../src/projects/projects.controller';
import { ProjectsService } from '../../../src/projects/projects.service';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: any;

  const mockProject = {
    id: 'proj-1',
    code: 'P001',
    name: 'Test Project',
    status: 'active',
    taxEnabled: false,
    taxRate: null,
    readingThresholdProfileId: null,
    waterDifferenceMode: 'report_only',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(mockProject),
      findAll: jest.fn().mockResolvedValue([mockProject]),
      findOne: jest.fn().mockResolvedValue(mockProject),
      update: jest.fn().mockResolvedValue(mockProject),
      remove: jest.fn().mockResolvedValue(undefined)
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [{ provide: ProjectsService, useValue: service }]
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a project', async () => {
    const dto = { code: 'P001', name: 'Test Project' };
    const result = await controller.create(dto, { user: { userId: 'user-1' } });
    expect(result.code).toBe('P001');
  });

  it('should list all projects', async () => {
    const result = await controller.findAll();
    expect(result).toHaveLength(1);
  });

  it('should get a single project', async () => {
    const result = await controller.findOne('proj-1');
    expect(result.id).toBe('proj-1');
  });

  it('should update a project', async () => {
    const result = await controller.update(
      'proj-1',
      { name: 'Updated' },
      { user: { userId: 'user-1' } }
    );
    expect(result.id).toBe('proj-1');
  });

  it('should remove a project', async () => {
    await controller.remove('proj-1', { user: { userId: 'user-1' } });
    expect(service.remove).toHaveBeenCalledWith('proj-1', 'user-1');
  });
});
