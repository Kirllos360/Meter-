import { Test, TestingModule } from '@nestjs/testing';
import { CustomersController } from '../../../src/customers/customers.controller';
import { CustomersService } from '../../../src/customers/customers.service';

describe('CustomersController', () => {
  let controller: CustomersController;
  let service: any;

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
    updatedAt: new Date()
  };

  beforeEach(async () => {
    service = {
      create: jest.fn().mockResolvedValue(mockCustomer),
      findAll: jest.fn().mockResolvedValue([mockCustomer]),
      findOne: jest.fn().mockResolvedValue(mockCustomer),
      update: jest.fn().mockResolvedValue(mockCustomer),
      remove: jest.fn().mockResolvedValue(undefined)
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [{ provide: CustomersService, useValue: service }]
    }).compile();

    controller = module.get<CustomersController>(CustomersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a customer', async () => {
    const dto = {
      customerCode: 'C001',
      name: 'John Doe',
      phone: '+201234567890',
      email: 'john@example.com',
      customerType: 'individual' as const,
      nationalOrCommercialId: '1234567890'
    };
    const result = await controller.create(projectId, dto, { user: { userId: 'user-1' } });
    expect(result.customerCode).toBe('C001');
  });

  it('should list all customers for a project', async () => {
    const result = await controller.findAll(projectId);
    expect(result).toHaveLength(1);
  });

  it('should get a single customer', async () => {
    const result = await controller.findOne(projectId, 'cust-1');
    expect(result.id).toBe('cust-1');
  });

  it('should update a customer', async () => {
    const result = await controller.update(
      projectId,
      'cust-1',
      { name: 'Updated' },
      { user: { userId: 'user-1' } }
    );
    expect(result.id).toBe('cust-1');
  });

  it('should remove a customer', async () => {
    await controller.remove(projectId, 'cust-1', { user: { userId: 'user-1' } });
    expect(service.remove).toHaveBeenCalledWith(projectId, 'cust-1', 'user-1');
  });
});
