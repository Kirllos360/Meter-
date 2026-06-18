import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class DownloadsService {
  async generateInvoicePdf(invoice: any, lines: any[], res: Response) {
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text('Invoice', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice #: ${invoice.invoiceNumber}`);
    doc.text(`Date: ${invoice.createdAt?.toISOString().slice(0, 10) ?? ''}`);
    doc.text(`Status: ${invoice.status}`);
    doc.moveDown();
    doc.text(`Customer: ${invoice.customerId}`);
    doc.text(`Meter: ${invoice.meterId}`);
    doc.moveDown();

    doc.fontSize(14).text('Line Items', { underline: true });
    doc.moveDown(0.5);
    for (const line of lines) {
      doc.fontSize(10).text(`${line.description}: ${line.quantity} × ${line.unitPrice} = ${line.lineAmount}`);
    }
    doc.moveDown();
    doc.fontSize(12).text(`Subtotal: ${invoice.subtotalAmount}`);
    doc.text(`Tax: ${invoice.taxAmount}`);
    doc.font('Helvetica-Bold').text(`Total: ${invoice.totalAmount}`);

    doc.end();
  }

  async generateCsv(data: any[], headers: string[], filename: string, res: Response) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
    const headerLine = headers.join(',') + '\n';
    const rows = data.map((row) => headers.map((h) => `"${String(row[h] ?? '')}"`).join(',')).join('\n');
    res.send(headerLine + rows);
  }
}
