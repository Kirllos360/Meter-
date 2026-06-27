import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from '../../../src/customers/customers.service';
import { PrismaService } from '../../../src/common/database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CustomersService', () => {
  let service: CustomersService;
  let prisma: any;

  const projectId = 'proj-1';
  const mockCustomer = {
    id: 'cust-1',
    projectId,
    customerCode: 'C001',
    name: 'John Doe',
    phone: '+201234567890',
    email: 'john@example.com',
    customerType: 'individual',
    nationalOrCommercialId: '1234567890',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
    updatedBy: 'user-1'
  };

  beforeEach(async () => {
    prisma = {
      project: { findUnique: jest.fn().mockResolvedValue({ id: projectId }) },
      customer: {
        create: jest.fn().mockResolvedValue(mockCustomer),
        findMany: jest.fn().mockResolvedValue([mockCustomer]),
        findUnique: jest.fn().mockResolvedValue(mockCustomer),
        update: jest.fn().mockResolvedValue(mockCustomer)
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomersService, { provide: PrismaService, useValue: prisma }]
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a customer', async () => {
      const dto = {
        customerCode: 'C001',
        name: 'John Doe',
        phone: '+201234567890',
        email: 'john@example.com',
        customerType: 'individual' as const,
        nationalOrCommercialId: '1234567890'
      };
      const result = await service.create(projectId, dto, 'user-1');
      expect(result.customerCode).toBe('C001');
    });

    it('should throw NotFoundException when project does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      const dto = {
        customerCode: 'C001',
        name: 'John Doe',
        phone: '+201234567890',
        email: 'john@example.com',
        customerType: 'individual' as const,
        nationalOrCommercialId: '1234567890'
      };
      await expect(service.create('nonexistent', dto, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all customers for a project', async () => {
      const result = await service.findAll(projectId);
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a customer by id', async () => {
      const result = await service.findOne(projectId, 'cust-1');
      expect(result.id).toBe('cust-1');
    });

    it('should throw NotFoundException when customer not found', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);
      await expect(service.findOne(projectId, 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a customer', async () => {
      const dto = { name: 'Jane Doe' };
      const result = await service.update(projectId, 'cust-1', dto, 'user-1');
      expect(result.name).toBe('John Doe');
    });

    it('should throw NotFoundException when updating nonexistent customer', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);
      await expect(service.update(projectId, 'nonexistent', {}, 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('remove', () => {
    it('should soft-delete a customer', async () => {
      await service.remove(projectId, 'cust-1', 'user-1');
      expect(prisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cust-1' },
          data: expect.objectContaining({ status: 'inactive' })
        })
      );
    });

    it('should throw NotFoundException when removing nonexistent customer', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);
      await expect(service.remove(projectId, 'nonexistent', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
