import { Controller, Get, Param, ParseUUIDPipe, Res, Req, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/types/role.enum';
import { PrismaService } from '../common/database/prisma.service';
import { DownloadsService } from './downloads.service';

@ApiTags('Downloads')
@Controller('downloads')
export class DownloadsController {
  constructor(
    private readonly downloadsService: DownloadsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('invoices/:id/pdf')
  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN, Role.FINANCE)
  @ApiOperation({ summary: 'Download invoice as PDF' })
  async downloadInvoicePdf(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new HttpException('Invoice not found', 404);
    const lines = await this.prisma.invoiceLine.findMany({ where: { invoiceId: id } });
    await this.downloadsService.generateInvoicePdf(invoice, lines, res);
  }

  @Get('invoices/:id/csv')
  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN, Role.FINANCE)
  @ApiOperation({ summary: 'Download invoice as CSV' })
  async downloadInvoiceCsv(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new HttpException('Invoice not found', 404);
    const lines = await this.prisma.invoiceLine.findMany({ where: { invoiceId: id } });
    const headers = ['description', 'quantity', 'unitPrice', 'lineAmount'];
    const filename = `invoice-${invoice.invoiceNumber}`;
    await this.downloadsService.generateCsv(lines, headers, filename, res);
  }
}
