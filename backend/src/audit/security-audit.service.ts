import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

export interface SecurityAuditEntry {
  eventType: string;
  actorId?: string;
  actorRole?: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  details?: Record<string, unknown>;
  outcome: 'SUCCESS' | 'FAILURE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

@Injectable()
export class SecurityAuditService {
  private readonly logger = new Logger(SecurityAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: SecurityAuditEntry): Promise<void> {
    try {
      const content = `${entry.actorId ?? 'SYSTEM'}|SECURITY_${entry.eventType}|${entry.resourceType ?? 'security'}|${entry.resourceId ?? 'N/A'}|${entry.correlationId ?? ''}|`;
      const hash = crypto.createHash('sha256').update(content).digest('hex');

      await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId ?? 'SYSTEM',
          actorRole: entry.actorRole ?? 'system',
          action: `SECURITY_${entry.eventType}`,
          resourceType: entry.resourceType ?? 'security',
          resourceId: entry.resourceId ?? 'N/A',
          hash,
          beforeState: null as unknown as Prisma.InputJsonValue | undefined,
          afterState: {
            outcome: entry.outcome,
            severity: entry.severity,
            ipAddress: entry.ipAddress,
            userAgent: entry.userAgent,
            correlationId: entry.correlationId,
            details: entry.details ?? {}
          } as unknown as Prisma.InputJsonValue | undefined,
          reason: `Security event: ${entry.eventType} (${entry.outcome})`,
          correlationId: entry.correlationId ?? null
        }
      });
    } catch (error) {
      this.logger.error(`Failed to write security audit log: ${error}`);
    }
  }
}
