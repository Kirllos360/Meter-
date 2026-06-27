import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

export interface AuditEntry {
  actorId: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  reason?: string;
  correlationId?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private lastHash: string | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async create(entry: AuditEntry): Promise<void> {
    try {
      const previousHash = await this.getLastHash();
      const content = `${entry.actorId}|${entry.action}|${entry.resourceType}|${entry.resourceId}|${entry.correlationId ?? ''}|${previousHash}`;
      const hash = crypto.createHash('sha256').update(content).digest('hex');

      await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId,
          actorRole: entry.actorRole,
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          beforeState: (entry.beforeState ?? undefined) as Prisma.InputJsonValue | undefined,
          afterState: (entry.afterState ?? undefined) as Prisma.InputJsonValue | undefined,
          reason: entry.reason ?? null,
          correlationId: entry.correlationId ?? null,
          hash
        }
      });
    } catch (error) {
      this.logger.error(`Failed to write audit log: ${error}`);
    }
  }

  async verifyIntegrity(): Promise<{ valid: boolean; tamperedCount: number }> {
    const logs = await this.prisma.auditLog.findMany({ orderBy: { createdAt: 'asc' } });
    let tamperedCount = 0;
    let prevHash = '';

    for (const log of logs) {
      const content = `${log.actorId}|${log.action}|${log.resourceType}|${log.resourceId}|${log.correlationId ?? ''}|${prevHash}`;
      const expectedHash = crypto.createHash('sha256').update(content).digest('hex');
      if (log.hash !== expectedHash) tamperedCount++;
      prevHash = expectedHash;
    }

    return { valid: tamperedCount === 0, tamperedCount };
  }

  private async getLastHash(): Promise<string> {
    if (this.lastHash) return this.lastHash;
    const last = await this.prisma.auditLog.findFirst({ orderBy: { createdAt: 'desc' } });
    this.lastHash = last?.hash ?? '';
    return this.lastHash;
  }
}
