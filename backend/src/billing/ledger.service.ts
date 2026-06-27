import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { LedgerEntryType, ReferenceType } from '@prisma/client';

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);
  constructor(private readonly prisma: PrismaService) {}

  async addEntry(params: {
    customerId: string;
    projectId: string;
    entryType: LedgerEntryType;
    referenceType: ReferenceType;
    referenceId: string;
    amountDelta: number;
    entryAt: Date;
  }) {
    const lastEntry = await this.prisma.customerLedgerEntry.findFirst({
      where: { customerId: params.customerId, projectId: params.projectId },
      orderBy: { entryAt: 'desc' },
      select: { runningBalance: true }
    });
    const prevBalance = lastEntry ? Number(lastEntry.runningBalance) : 0;
    const runningBalance = prevBalance + params.amountDelta;

    return this.prisma.customerLedgerEntry.create({
      data: {
        customerId: params.customerId,
        projectId: params.projectId,
        entryType: params.entryType,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        amountDelta: params.amountDelta,
        runningBalance,
        entryAt: params.entryAt
      }
    });
  }
}
