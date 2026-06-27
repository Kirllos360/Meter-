import { Test, TestingModule } from '@nestjs/testing';
import { SecurityAuditService } from '../../src/audit/security-audit.service';
import { PrismaService } from '../../src/common/database/prisma.service';

describe('SecurityAuditService', () => {
  let service: SecurityAuditService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityAuditService,
        {
          provide: PrismaService,
          useValue: {
            auditLog: {
              create: jest.fn().mockResolvedValue({})
            }
          }
        }
      ]
    }).compile();

    service = module.get<SecurityAuditService>(SecurityAuditService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should log auth success event', async () => {
    await service.log({
      eventType: 'AUTH_LOGIN_SUCCESS',
      actorId: 'user-1',
      actorRole: 'operator',
      ipAddress: '127.0.0.1',
      correlationId: 'corr-1',
      outcome: 'SUCCESS',
      severity: 'LOW'
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: 'user-1',
        actorRole: 'operator',
        action: 'SECURITY_AUTH_LOGIN_SUCCESS'
      })
    });
  });

  it('should log auth failure event', async () => {
    await service.log({
      eventType: 'AUTH_LOGIN_FAILURE',
      ipAddress: '192.168.1.1',
      outcome: 'FAILURE',
      severity: 'MEDIUM',
      details: { reason: 'Invalid password' }
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorId: 'SYSTEM',
        actorRole: 'system',
        action: 'SECURITY_AUTH_LOGIN_FAILURE'
      })
    });
  });

  it('should log rate limit event', async () => {
    await service.log({
      eventType: 'RATE_LIMIT_EXCEEDED',
      actorId: 'user-2',
      resourceType: 'endpoint',
      resourceId: 'GET /api/v1/health',
      ipAddress: '10.0.0.1',
      outcome: 'FAILURE',
      severity: 'HIGH',
      details: { requestCount: 101, windowMs: 60000 }
    });

    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it('should log forbidden access', async () => {
    await service.log({
      eventType: 'AUTH_FORBIDDEN',
      actorId: 'user-3',
      actorRole: 'customer',
      resourceType: 'endpoint',
      resourceId: 'POST /api/v1/payments/reverse',
      outcome: 'FAILURE',
      severity: 'HIGH'
    });

    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it('should not throw when prisma fails', async () => {
    jest.spyOn(prisma.auditLog, 'create').mockRejectedValueOnce(new Error('DB error'));

    await expect(
      service.log({ eventType: 'AUTH_LOGIN_SUCCESS', outcome: 'SUCCESS', severity: 'LOW' })
    ).resolves.toBeUndefined();
  });

  it('should log high severity event with critical level', async () => {
    await service.log({
      eventType: 'SECURITY_BREACH_ATTEMPT',
      outcome: 'FAILURE',
      severity: 'CRITICAL',
      details: { attackVector: 'SQL injection attempt', blockedBy: 'WAF' }
    });

    expect(prisma.auditLog.create).toHaveBeenCalled();
  });
});
