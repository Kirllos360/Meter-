'use client';
import { useEffect } from 'react';
import { usePageStore } from '@/lib/router-store';
import { useCustomerDetail } from '@/hooks/use-customers';
import { useInvoicesList } from '@/hooks/use-invoices';
import { usePaymentsList } from '@/hooks/use-payments';
import { useMetersList } from '@/hooks/use-meters';
import { useNotifications } from '@/hooks/use-notifications';
import { useTicketsList } from '@/hooks/use-tickets';
import { BackButton, StatCard, formatCurrency, formatDate } from '@/components/shared/PageHelpers';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import SmartTable from '@/components/smart-table/SmartTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Users, Gauge, FileText, CreditCard, Bell, Ticket, TrendingUp, DollarSign, Activity, Download, Plus } from 'lucide-react';

export default function Customer360Page() {
  const { pageParams } = usePageStore();
  const cid = pageParams.id ?? '';
  const { data: customer } = useCustomerDetail(cid);
  const { data: invoicesData } = useInvoicesList();
  const { data: paymentsData } = usePaymentsList();
  const { data: metersData } = useMetersList();
  const { data: notifData } = useNotifications();
  const { data: ticketsData } = useTicketsList();
  const c = customer;
  const invoices = (invoicesData ?? []).filter((i: any) => i.customerId === cid);
  const payments = (paymentsData ?? []).filter((p: any) => p.customerId === cid);
  const meters = (metersData ?? []).filter((m: any) => m.customerId === cid);
  const notifs = (notifData?.items ?? []).filter((n: any) => n.referenceId === cid);
  const tickets = (ticketsData ?? []).filter((t: any) => t.customerId === cid);

  const totalOutstanding = invoices.reduce((s: number, i: any) => s + (i.remainingAmount ?? 0), 0);
  const collectionRate = invoices.length > 0 ? Math.round((1 - totalOutstanding / invoices.reduce((s: number, i: any) => s + Number(i.total ?? i.totalAmount ?? 0), 0)) * 100) : 0;

  // Build hooks data
  const { data: hooksData } = { data: null };

  if (!c) return <div className="p-6"><BackButton fallback="customers" /><p className="text-muted-foreground mt-4">Customer not found.</p></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div><BackButton fallback="customers" /></div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.info('Record payment')}><CreditCard className="h-3.5 w-3.5" /> Record Payment</Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.info('Create invoice')}><FileText className="h-3.5 w-3.5" /> Create Invoice</Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.info('Download statement')}><Download className="h-3.5 w-3.5" /> Statement</Button>
        </div>
      </div>

      {/* Header */}
      <div className="glass-card rounded-xl p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-3"><h1 className="text-xl font-bold">{c.name}</h1><StatusBadge status={c.status ?? 'active'} /></div>
            <p className="text-sm text-muted-foreground">{c.code ?? c.id} · {c.customerType ?? '-'}</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><span className="text-muted-foreground">Balance</span><p className="font-bold text-lg">{formatCurrency(totalOutstanding)}</p></div>
            <div><span className="text-muted-foreground">Collection</span><p className="font-bold text-lg">{collectionRate}%</p></div>
            <div><span className="text-muted-foreground">Meters</span><p className="font-bold text-lg">{meters.length}</p></div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <StatCard label="Invoices" value={invoices.length} icon={<FileText className="h-4 w-4" />} />
        <StatCard label="Payments" value={payments.length} icon={<DollarSign className="h-4 w-4" />} />
        <StatCard label="Meters" value={meters.length} icon={<Gauge className="h-4 w-4" />} />
        <StatCard label="Notifications" value={notifs.length} icon={<Bell className="h-4 w-4" />} />
        <StatCard label="Tickets" value={tickets.length} icon={<Ticket className="h-4 w-4" />} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="financials">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="meters">Meters</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="financials">
          <Card className="glass-card border-border/50">
            <CardHeader><CardTitle className="text-sm">Invoices</CardTitle></CardHeader>
            <CardContent>
              <SmartTable data={invoices} columns={[
                { key: 'invoiceNumber', label: 'Number', sortable: true },
                { key: 'total', label: 'Total', render: (v: number) => formatCurrency(v) },
                { key: 'remainingAmount', label: 'Remaining', render: (v: number) => <span className="text-red-500">{formatCurrency(v)}</span> },
                { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v} /> },
                { key: 'invoiceDate', label: 'Date', render: (v: string) => formatDate(v) },
              ]} searchKeys={['invoiceNumber']} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meters">
          <Card className="glass-card border-border/50">
            <CardHeader><CardTitle className="text-sm">Meters</CardTitle></CardHeader>
            <CardContent>
              <SmartTable data={meters} columns={[
                { key: 'serialNumber', label: 'Serial', sortable: true },
                { key: 'meterType', label: 'Type', render: (v: string) => <StatusBadge status={v} /> },
                { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v} /> },
              ]} searchKeys={['serialNumber']} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="glass-card border-border/50">
            <CardHeader><CardTitle className="text-sm">Payments</CardTitle></CardHeader>
            <CardContent>
              <SmartTable data={payments} columns={[
                { key: 'paymentNumber', label: 'Payment #', sortable: true },
                { key: 'amount', label: 'Amount', render: (v: number) => formatCurrency(v) },
                { key: 'method', label: 'Method' },
                { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v} /> },
                { key: 'paymentDate', label: 'Date', render: (v: string) => formatDate(v) },
              ]} searchKeys={['paymentNumber']} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets">
          <Card className="glass-card border-border/50">
            <CardHeader><CardTitle className="text-sm">Tickets</CardTitle></CardHeader>
            <CardContent>
              <SmartTable data={tickets} columns={[
                { key: 'title', label: 'Title', sortable: true },
                { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v} /> },
                { key: 'priority', label: 'Priority', render: (v: string) => <StatusBadge status={v} /> },
              ]} searchKeys={['title']} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="glass-card border-border/50">
            <CardHeader><CardTitle className="text-sm">Notifications</CardTitle></CardHeader>
            <CardContent>
              <SmartTable data={notifs} columns={[
                { key: 'title', label: 'Title', sortable: true },
                { key: 'body', label: 'Body', width: '300px' },
                { key: 'isRead', label: 'Status', render: (v: boolean) => v ? 'Read' : 'Unread' },
                { key: 'createdAt', label: 'Date', render: (v: string) => formatDate(v) },
              ]} searchKeys={['title']} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
