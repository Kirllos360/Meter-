import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
  InternalServerErrorException
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/types/role.enum';
import { PrismaService } from '../common/database/prisma.service';
import { TariffService } from './tariffs/tariff.service';
import { PeriodService } from './periods/period.service';
import { LedgerService } from './ledger.service';
import { WaterBalanceService } from '../readings/water-balance/water-balance.service';
import { WaterDifferencePolicy } from './water-difference.policy';

@ApiTags('Billing')
@Controller()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BillingController {
  private readonly logger = new Logger(BillingController.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly tariffService: TariffService,
    private readonly periodService: PeriodService,
    private readonly ledgerService: LedgerService,
    private readonly waterBalanceService: WaterBalanceService,
    private readonly waterDifferencePolicy: WaterDifferencePolicy
  ) {}

  @Post('invoices/generate')
  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN, Role.FINANCE)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Generate invoices for billing period' })
  async generateInvoices(
    @Body() dto: { projectId: string; billingPeriodId: string; customerIds?: string[] }
  ) {
    try {
    let period = await this.prisma.billingPeriod.findUnique({
      where: { id: dto.billingPeriodId }
    }).catch(() => null);
    if (!period) {
      period = await this.prisma.billingPeriod.findFirst({
        where: { projectId: dto.projectId, periodCode: dto.billingPeriodId }
      }).catch(() => null);
    }
    const project = await this.prisma.project.findUnique({ where: { id: dto.projectId } });
    if (!period) return { batchId: 'no-period', generatedCount: 0 };
    if (!project) return { batchId: 'no-project', generatedCount: 0 };

    const taxRate = project.taxEnabled ? Number(project.taxRate ?? 0) / 100 : 0;
    const waterDiffMode = project.waterDifferenceMode;
    let count = 0;

    const meters = await this.prisma.meter.findMany({
      where: { projectId: dto.projectId, status: { not: 'retired' } }
    });
    const readings = await this.prisma.reading.findMany({
      where: {
        projectId: dto.projectId,
        readingAt: { gte: period.startDate, lte: period.endDate },
        status: 'valid'
      },
      orderBy: { readingAt: 'asc' }
    });

    const existingInvoices = await this.prisma.invoice.findMany({
      where: { projectId: dto.projectId, billingPeriodId: dto.billingPeriodId },
      select: { meterId: true }
    });
    const metersWithInvoices = new Set(existingInvoices.map((i) => i.meterId));

    for (const meter of meters) {
      if (metersWithInvoices.has(meter.id)) continue;

      const tariff = await this.tariffService.getEffectiveTariff(
        dto.projectId,
        meter.meterType,
        period.startDate
      );
      if (!tariff) continue;

      const meterReadings = readings.filter((r) => r.meterId === meter.id);
      const consumption = meterReadings.reduce((s, r) => s + Number(r.consumptionValue ?? 0), 0);
      if (consumption <= 0) continue;

      const utilityType = meter.meterType === 'electricity' ? 'electricity' : 'water';
      const subtotal = Number(tariff.ratePerUnit) * consumption;
      const tax = subtotal * taxRate;
      const seq = Date.now().toString(36).slice(-4);

      const invoice = await this.prisma.invoice.create({
        data: {
          invoiceNumber: `INV-${period.periodCode}-${meter.id.substring(0, 8)}-${seq}`,
          projectId: dto.projectId,
          customerId: dto.customerIds?.[0] ?? 'system',
          unitId: 'system',
          meterId: meter.id,
          utilityType,
          billingPeriodId: dto.billingPeriodId,
          status: 'draft',
          subtotalAmount: subtotal,
          taxAmount: tax,
          totalAmount: subtotal + tax,
          remainingAmount: subtotal + tax,
          paidAmount: 0
        }
      });

      for (const r of meterReadings) {
        await this.prisma.invoiceLine.create({
          data: {
            invoiceId: invoice.id,
            readingId: r.id,
            description: `Consumption ${r.readingAt.toISOString().slice(0, 10)}`,
            quantity: Number(r.consumptionValue ?? 0),
            unitPrice: Number(tariff.ratePerUnit),
            lineAmount: Number(r.consumptionValue ?? 0) * Number(tariff.ratePerUnit)
          }
        });
      }

      if (utilityType === 'water' && (meter.meterType as string) === 'water_main') {
        await this.waterDifferencePolicy.apply(
          invoice.id,
          dto.projectId,
          period.startDate,
          period.endDate,
          waterDiffMode,
          taxRate
        );
      }

      count++;
    }
    return { batchId: `batch-${Date.now()}`, generatedCount: count };
    } catch (err: any) {
      this.logger.error(`Invoice generation failed: ${err.message}`, err.stack);
      throw new InternalServerErrorException(`Invoice generation failed: ${err.message}`);
    }
  }

  @Post('invoices/:id/issue')
  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN, Role.FINANCE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Issue an invoice' })
  async issueInvoice(@Param('id', ParseUUIDPipe) id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return { status: 'not_found' };
    if (invoice.status !== 'draft') return { status: 'already_issued' };

    const total = Number(invoice.totalAmount);
    if (total > 10000) return { status: 'approval_required' };

    const now = new Date();
    await this.prisma.invoice.update({
      where: { id },
      data: { status: 'issued', issuedAt: now, immutableAt: now }
    });

    await this.ledgerService.addEntry({
      customerId: invoice.customerId,
      projectId: invoice.projectId,
      entryType: 'invoice_charge',
      referenceType: 'invoice',
      referenceId: invoice.id,
      amountDelta: total,
      entryAt: now
    });

    return { status: 'issued', immutableAt: now.toISOString() };
  }

  @Patch('invoices/:id')
  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update invoice metadata' })
  async updateInvoice(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { dueAt?: string; notes?: string }
  ) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return { status: 'not_found' };
    const data: any = {};
    if (dto.dueAt) data.dueAt = new Date(dto.dueAt);
    if (dto.notes !== undefined) data.notes = dto.notes;
    await this.prisma.invoice.update({ where: { id }, data });
    return { status: 'updated' };
  }

  @Post('invoices/:id/cancel')
  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an invoice' })
  async cancelInvoice(@Param('id', ParseUUIDPipe) id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return { status: 'not_found' };
    if (invoice.status === 'cancelled') return { status: 'already_cancelled' };
    if (invoice.status === 'paid') return { status: 'cannot_cancel_paid' };

    await this.prisma.invoice.update({
      where: { id },
      data: { status: 'cancelled', immutableAt: new Date() }
    });

    return { status: 'cancelled' };
  }

  @Post('invoices/:id/adjustments')
  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN, Role.FINANCE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add adjustment to invoice' })
  async addAdjustment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { adjustmentType: 'credit' | 'debit'; amount: number; reason: string }
  ) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return { status: 'not_found' };

    const signedAmount = Number(dto.amount) * (dto.adjustmentType === 'credit' ? -1 : 1);

    const [adjustment] = await this.prisma.$transaction([
      this.prisma.invoiceAdjustment.create({
        data: {
          invoiceId: id,
          adjustmentType: dto.adjustmentType,
          amount: dto.amount,
          reason: dto.reason,
          createdBy: 'system'
        }
      }),
      this.prisma.invoice.update({
        where: { id },
        data: {
          totalAmount: { increment: signedAmount },
          remainingAmount: { increment: signedAmount }
        }
      })
    ]);

    await this.ledgerService.addEntry({
      customerId: invoice.customerId,
      projectId: invoice.projectId,
      entryType: dto.adjustmentType === 'credit' ? 'payment_credit' : 'invoice_charge',
      referenceType: 'adjustment',
      referenceId: adjustment.id,
      amountDelta: signedAmount,
      entryAt: new Date()
    });

    return { status: 'adjusted', adjustmentId: adjustment.id };
  }

  @Post('payments')
  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN, Role.FINANCE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record payment with oldest-due-first allocation' })
  async createPayment(
    @Body()
    dto: {
      projectId: string;
      customerId: string;
      amount: number;
      paymentDate: string;
      method: string;
      notes?: string;
      allocationMode?: 'oldest_due_first' | 'explicit';
      allocations?: Array<{ invoiceId: string; amount: number }>;
    }
  ) {
    const allocMode = dto.allocationMode ?? 'oldest_due_first';
    const amount = Number(dto.amount);

    if (allocMode === 'explicit' && dto.allocations) {
      const totalAllocated = dto.allocations.reduce((s, a) => s + Number(a.amount), 0);
      if (Math.abs(totalAllocated - amount) > 0.001) {
        return {
          status: 'allocation_mismatch',
          message: 'Allocation total must equal payment amount'
        };
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          paymentNumber: `PAY-${Date.now()}`,
          projectId: dto.projectId,
          customerId: dto.customerId,
          amount,
          paymentDate: new Date(dto.paymentDate),
          method: dto.method as any,
          status: 'confirmed',
          collectedBy: 'system',
          notes: dto.notes
        }
      });

      let remaining = amount;

      if (allocMode === 'oldest_due_first') {
        const dueInvoices = await tx.invoice.findMany({
          where: {
            customerId: dto.customerId,
            projectId: dto.projectId,
            status: 'issued',
            remainingAmount: { gt: 0 }
          },
          orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }]
        });

        let order = 1;
        for (const inv of dueInvoices) {
          if (remaining <= 0) break;
          const invRemaining = Number(inv.remainingAmount);
          const allocAmount = Math.min(remaining, invRemaining);

          await tx.paymentAllocation.create({
            data: {
              paymentId: payment.id,
              invoiceId: inv.id,
              allocatedAmount: allocAmount,
              allocationOrder: order++
            }
          });

          await tx.invoice.update({
            where: { id: inv.id },
            data: {
              paidAmount: { increment: allocAmount },
              remainingAmount: { increment: -allocAmount }
            }
          });

          remaining -= allocAmount;
        }
      } else if (dto.allocations) {
        let order = 1;
        for (const alloc of dto.allocations) {
          await tx.paymentAllocation.create({
            data: {
              paymentId: payment.id,
              invoiceId: alloc.invoiceId,
              allocatedAmount: alloc.amount,
              allocationOrder: order++
            }
          });

          await tx.invoice.update({
            where: { id: alloc.invoiceId },
            data: {
              paidAmount: { increment: alloc.amount },
              remainingAmount: { increment: -alloc.amount }
            }
          });

          remaining -= Number(alloc.amount);
        }
      }

      if (amount - remaining > 0) {
        await this.ledgerService.addEntry({
          customerId: dto.customerId,
          projectId: dto.projectId,
          entryType: 'payment_credit',
          referenceType: 'payment',
          referenceId: payment.id,
          amountDelta: -(amount - remaining),
          entryAt: new Date(dto.paymentDate)
        });
      }

      return payment;
    });
  }

  @Post('tariffs')
  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create tariff plan' })
  async createTariff(
    @Body() dto: {
      projectId: string;
      meterType: string;
      ratePerUnit: number;
      currency: string;
      effectiveFrom: string;
      effectiveTo?: string;
      status?: string;
    },
    @Req() req: { user: { userId: string } }
  ) {
    const userId = req.user.userId;
    return this.prisma.tariffPlan.create({
      data: {
        projectId: dto.projectId,
        meterType: dto.meterType as any,
        ratePerUnit: dto.ratePerUnit,
        currency: dto.currency,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
        status: (dto.status as any) ?? 'active',
        createdBy: userId,
        updatedBy: userId
      }
    });
  }

  @Get('tariffs')
  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN, Role.FINANCE, Role.SUPPORT)
  @ApiOperation({ summary: 'List tariffs' })
  async listTariffs(@Query('projectId') projectId?: string) {
    const where: any = {};
    if (projectId) where.projectId = projectId;
    return this.prisma.tariffPlan.findMany({ where, orderBy: { effectiveFrom: 'desc' } });
  }

  @Post('periods')
  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create billing period' })
  async createPeriod(
    @Body() dto: { projectId: string; periodCode: string; startDate: string; endDate: string },
    @Req() req: any
  ) {
    return this.periodService.createPeriod({
      projectId: dto.projectId,
      periodCode: dto.periodCode,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      createdBy: req.user?.userId ?? 'system'
    });
  }

  @Get('periods')
  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN, Role.FINANCE, Role.SUPPORT)
  @ApiOperation({ summary: 'List billing periods' })
  async listPeriods(@Query('projectId') projectId?: string) {
    const where: any = {};
    if (projectId) where.projectId = projectId;
    return this.prisma.billingPeriod.findMany({ where, orderBy: { startDate: 'desc' } });
  }

  @Get('invoices')
  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN, Role.FINANCE, Role.SUPPORT)
  @ApiOperation({ summary: 'List invoices' })
  async listInvoices(
    @Query('projectId') projectId?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string
  ) {
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;
    const invoices = await this.prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    const lines = await this.prisma.invoiceLine.findMany({
      where: { invoiceId: { in: invoices.map((i) => i.id) } }
    });
    return invoices.map((inv) => ({
      ...inv,
      subtotalAmount: Number(inv.subtotalAmount),
      taxAmount: Number(inv.taxAmount),
      totalAmount: Number(inv.totalAmount),
      paidAmount: Number(inv.paidAmount),
      remainingAmount: Number(inv.remainingAmount),
      lines: lines.filter((l) => l.invoiceId === inv.id).map((l) => ({
        ...l,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        lineAmount: Number(l.lineAmount)
      }))
    }));
  }

  @Get('invoices/:id')
  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN, Role.FINANCE, Role.SUPPORT)
  @ApiOperation({ summary: 'Get invoice by ID' })
  async getInvoice(@Param('id', ParseUUIDPipe) id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return { status: 'not_found' };
    const lines = await this.prisma.invoiceLine.findMany({
      where: { invoiceId: id }
    });
    return {
      ...invoice,
      subtotalAmount: Number(invoice.subtotalAmount),
      taxAmount: Number(invoice.taxAmount),
      totalAmount: Number(invoice.totalAmount),
      paidAmount: Number(invoice.paidAmount),
      remainingAmount: Number(invoice.remainingAmount),
      lines: lines.map((l) => ({
        ...l,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        lineAmount: Number(l.lineAmount)
      }))
    };
  }
}
