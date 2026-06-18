'use client';

import { Plus, MoreHorizontal, Eye, Pencil, CreditCard, Download, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { usePageStore } from '@/lib/router-store';
import { useInvoicesList, useIssueInvoice } from '@/hooks/use-invoices';
import { useProjectsList } from '@/hooks/use-projects';
import SmartTable from '@/components/smart-table/SmartTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader, formatCurrency, formatDate } from '@/components/shared/PageHelpers';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/context';
import { ProtectedAction } from '@/components/shared/ProtectedAction';

export default function InvoicesPage() {
  const t = useT();
  const { navigate } = usePageStore();
  const { data: apiInvoices } = useInvoicesList();
  const invoices = apiInvoices ?? [];
  const { data: apiProjects } = useProjectsList();
  const issueMutation = useIssueInvoice();

  const columns = [
    { key: 'invoiceNumber', label: t('billing.invoices.invoiceNumber'), sortable: true },
    { key: 'customerName', label: t('billing.invoices.customer'), sortable: true },
    { key: 'projectName', label: 'Project' },
    { key: 'unitNumber', label: 'Unit', width: '80px', render: (v: string) => v || '-' },
    {
      key: 'meterSerial', label: 'Meter', width: '140px',
      render: (v: string) => <span className="font-mono text-xs">{v}</span>,
    },
    {
      key: 'meterType', label: 'Type', width: '110px',
      render: (v: string) => <StatusBadge status={v} />,
    },
    {
      key: 'billingPeriodStart', label: t('billing.invoices.period'), width: '170px',
      render: (v: string, row: { billingPeriodEnd: string }) => <span className="text-xs">{formatDate(v)} - {formatDate(row.billingPeriodEnd)}</span>,
    },
    { key: 'consumption', label: 'Usage', width: '70px' },
    { key: 'tariff', label: 'Tariff', width: '70px', render: (v: number) => v.toFixed(2) },
    { key: 'subtotal', label: 'Subtotal', width: '90px', render: (v: number) => formatCurrency(v) },
    { key: 'tax', label: 'Tax', width: '80px', render: (v: number) => formatCurrency(v) },
    {
      key: 'total', label: t('billing.invoices.total'), width: '100px',
      render: (v: number) => <span className="font-medium">{formatCurrency(v)}</span>,
    },
    { key: 'paidAmount', label: t('billing.invoices.paid'), width: '100px', render: (v: number) => formatCurrency(v) },
    {
      key: 'remainingAmount', label: 'Remaining', width: '100px',
      render: (v: number) => <span className={cn(v > 0 ? 'text-red-500' : 'text-emerald-500')}>{formatCurrency(v)}</span>,
    },
    { key: 'invoiceDate', label: t('billing.invoices.issueDate'), width: '90px', sortable: true, render: (v: string) => formatDate(v) },
    { key: 'dueDate', label: t('billing.invoices.dueDate'), width: '90px', render: (v: string) => formatDate(v) },
    {
      key: 'status', label: t('billing.invoices.status'), sortable: true, width: '120px',
      render: (v: string) => <StatusBadge status={v} />,
    },
    {
      key: 'actions', label: '', width: '50px',
      render: (_val: unknown, row: { id: string; invoiceNumber: string; status: string }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate('invoice-detail', { id: row.id }); }}><Eye className="h-4 w-4 mr-2" /> View</DropdownMenuItem>
            <ProtectedAction action="invoice:edit">
              {row.status === 'draft' && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.info('Edit invoice'); }}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>}
            </ProtectedAction>
            <ProtectedAction action="invoice:issue">
              {row.status === 'draft' && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); issueMutation.mutate(row.id, { onSuccess: () => toast.success('Invoice issued'), onError: () => toast.error('Failed to issue invoice') }); }}><CreditCard className="h-4 w-4 mr-2" /> Issue</DropdownMenuItem>}
            </ProtectedAction>
            <ProtectedAction action="payment:record">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.info('Record payment'); }}><CreditCard className="h-4 w-4 mr-2" /> Record Payment</DropdownMenuItem>
            </ProtectedAction>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(`/api/v1/downloads/invoices/${row.id}/pdf`, '_blank'); }}><Download className="h-4 w-4 mr-2" /> {t('billing.invoices.download')}</DropdownMenuItem>
            <ProtectedAction action="invoice:cancel">
              {row.status === 'draft' && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.info('Invoice cancelled'); }} className="text-red-500"><XCircle className="h-4 w-4 mr-2" /> Cancel</DropdownMenuItem>}
            </ProtectedAction>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('billing.invoices.title')}
        subtitle="Manage billing invoices and payments"
        action={
          <Button className="gap-2" onClick={() => toast.info('Create Invoice dialog would open')}>
            <Plus className="h-4 w-4" /> {t('billing.invoices.generate')}
          </Button>
        }
      />
      <SmartTable
        data={invoices}
        columns={columns}
        filters={[
          {
            key: 'status', label: t('billing.invoices.status'), type: 'select',
            options: [
              { label: t('billing.invoices.draft'), value: 'draft' },
              { label: t('billing.invoices.issued'), value: 'issued' },
              { label: t('billing.invoices.partial'), value: 'partially_paid' },
              { label: t('billing.invoices.paidStatus'), value: 'paid' },
              { label: t('billing.invoices.overdue'), value: 'overdue' },
              { label: t('billing.invoices.cancelled'), value: 'cancelled' },
            ],
          },
          {
            key: 'projectId', label: 'Project', type: 'select',
            options: (apiProjects ?? []).map((p: { name: string; id: string }) => ({ label: p.name, value: p.id })),
          },
          {
            key: 'meterType', label: 'Meter Type', type: 'select',
            options: [
              { label: 'Electricity', value: 'electricity' },
              { label: 'Main Water', value: 'main_water' },
              { label: 'Child Water', value: 'child_water' },
            ],
          },
          {
            key: 'overdue', label: 'Overdue Only', type: 'select',
            options: [
              { label: 'Yes', value: 'overdue' },
            ],
          },
        ]}
        searchKeys={['invoiceNumber', 'customerName', 'projectName', 'meterSerial']}
        searchPlaceholder={t('billing.invoices.search')}
        onRowClick={(row) => navigate('invoice-detail', { id: row.id })}
      />
    </div>
  );
}
