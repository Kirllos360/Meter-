import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from '../../../src/projects/projects.service';
import { PrismaService } from '../../../src/common/database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: any;

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
    updatedAt: new Date(),
    createdBy: 'user-1',
    updatedBy: 'user-1'
  };

  beforeEach(async () => {
    prisma = {
      project: {
        create: jest.fn().mockResolvedValue(mockProject),
        findMany: jest.fn().mockResolvedValue([mockProject]),
        findUnique: jest.fn().mockResolvedValue(mockProject),
        update: jest.fn().mockResolvedValue(mockProject)
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectsService, { provide: PrismaService, useValue: prisma }]
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a project', async () => {
      const dto = { code: 'P001', name: 'Test Project' };
      const result = await service.create(dto, 'user-1');
      expect(result.code).toBe('P001');
      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ code: 'P001' }) })
      );
    });
  });

  describe('findAll', () => {
    it('should return all projects', async () => {
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('P001');
    });
  });

  describe('findOne', () => {
    it('should return a project by id', async () => {
      const result = await service.findOne('proj-1');
      expect(result.id).toBe('proj-1');
    });

    it('should throw NotFoundException when project not found', async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const dto = { name: 'Updated Name' };
      const result = await service.update('proj-1', dto, 'user-1');
      expect(result.name).toBe('Test Project');
    });

    it('should throw NotFoundException when updating nonexistent project', async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      await expect(service.update('nonexistent', {}, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete a project', async () => {
      await service.remove('proj-1', 'user-1');
      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'proj-1' },
          data: expect.objectContaining({ status: 'inactive' })
        })
      );
    });

    it('should throw NotFoundException when removing nonexistent project', async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      await expect(service.remove('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
