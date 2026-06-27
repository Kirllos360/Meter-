import { Test, TestingModule } from '@nestjs/testing';
import { PasswordPolicyService } from '../../src/auth/password-policy.service';
import { PrismaService } from '../../src/common/database/prisma.service';

describe('PasswordPolicyService', () => {
  let service: PasswordPolicyService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordPolicyService,
        {
          provide: PrismaService,
          useValue: {
            loginAttempt: {
              count: jest.fn().mockResolvedValue(0),
              create: jest.fn().mockResolvedValue({})
            }
          }
        }
      ]
    }).compile();

    service = module.get<PasswordPolicyService>(PasswordPolicyService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('validate', () => {
    it('should accept valid password', () => {
      const result = service.validate('Abcdef1!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short password', () => {
      const result = service.validate('Ab1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('should reject password without uppercase', () => {
      const result = service.validate('abcdef1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain an uppercase letter');
    });

    it('should reject password without digit', () => {
      const result = service.validate('Abcdefg!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain a digit');
    });

    it('should reject password without special char', () => {
      const result = service.validate('Abcdef12');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain a special character');
    });

    it('should report multiple errors', () => {
      const result = service.validate('short');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('lockout', () => {
    it('should not be locked out initially', async () => {
      jest.spyOn(prisma.loginAttempt, 'count').mockResolvedValue(0);
      const locked = await service.isLockedOut('user-1');
      expect(locked).toBe(false);
    });

    it('should be locked out after 5 failures', async () => {
      jest.spyOn(prisma.loginAttempt, 'count').mockResolvedValue(5);
      const locked = await service.isLockedOut('user-1');
      expect(locked).toBe(true);
    });

    it('should record login attempt', async () => {
      await service.recordAttempt('user-1', '127.0.0.1', true);
      expect(prisma.loginAttempt.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', ipAddress: '127.0.0.1', success: true }
      });
    });

    it('should return configured limits', () => {
      expect(service.getMaxAttempts()).toBe(5);
      expect(service.getLockoutDurationMs()).toBe(15 * 60 * 1000);
    });
  });
});
