import { Test, TestingModule } from '@nestjs/testing';
import { LocationsService } from '../../../../src/projects/locations/locations.service';
import { PrismaService } from '../../../../src/common/database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('LocationsService', () => {
  let service: LocationsService;
  let prisma: any;

  const projectId = 'proj-1';
  const mockNode = {
    id: 'loc-1',
    projectId,
    parentId: null,
    nodeType: 'building',
    code: 'B01',
    name: 'Building 1',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
    updatedBy: 'user-1'
  };

  beforeEach(async () => {
    prisma = {
      project: { findUnique: jest.fn().mockResolvedValue({ id: projectId }) },
      locationNode: {
        create: jest.fn().mockResolvedValue(mockNode),
        findMany: jest.fn().mockResolvedValue([mockNode]),
        findUnique: jest.fn().mockResolvedValue(mockNode),
        update: jest.fn().mockResolvedValue(mockNode)
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [LocationsService, { provide: PrismaService, useValue: prisma }]
    }).compile();

    service = module.get<LocationsService>(LocationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a location node', async () => {
      const dto = { nodeType: 'building' as const, code: 'B01', name: 'Building 1' };
      const result = await service.create(projectId, dto, 'user-1');
      expect(result.code).toBe('B01');
    });

    it('should throw NotFoundException when project does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      const dto = { nodeType: 'building' as const, code: 'B01', name: 'Building 1' };
      await expect(service.create('nonexistent', dto, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all locations for a project', async () => {
      const result = await service.findAll(projectId);
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a location by id', async () => {
      const result = await service.findOne(projectId, 'loc-1');
      expect(result.id).toBe('loc-1');
    });

    it('should throw NotFoundException when location not found', async () => {
      prisma.locationNode.findUnique.mockResolvedValue(null);
      await expect(service.findOne(projectId, 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when location belongs to different project', async () => {
      prisma.locationNode.findUnique.mockResolvedValue({ ...mockNode, projectId: 'other-proj' });
      await expect(service.findOne(projectId, 'loc-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a location', async () => {
      const dto = { name: 'Updated Building' };
      const result = await service.update(projectId, 'loc-1', dto, 'user-1');
      expect(result.name).toBe('Building 1');
    });

    it('should throw NotFoundException when updating nonexistent location', async () => {
      prisma.locationNode.findUnique.mockResolvedValue(null);
      await expect(service.update(projectId, 'nonexistent', {}, 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('remove', () => {
    it('should soft-delete a location', async () => {
      await service.remove(projectId, 'loc-1', 'user-1');
      expect(prisma.locationNode.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'loc-1' },
          data: expect.objectContaining({ status: 'inactive' })
        })
      );
    });

    it('should throw NotFoundException when removing nonexistent location', async () => {
      prisma.locationNode.findUnique.mockResolvedValue(null);
      await expect(service.remove(projectId, 'nonexistent', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
