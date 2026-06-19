'use client';
import { usePageStore } from '@/lib/router-store';
import { useCustomerDetail } from '@/hooks/use-customers';
import { useInvoicesList } from '@/hooks/use-invoices';
import { usePaymentsList } from '@/hooks/use-payments';
import { useMetersList } from '@/hooks/use-meters';
import { useNotifications } from '@/hooks/use-notifications';
import { useTicketsList } from '@/hooks/use-tickets';
import { useReadingsList } from '@/hooks/use-readings';
import { useIssueInvoice, useCreatePayment } from '@/hooks/use-invoices';
import { BackButton, StatCard, formatCurrency, formatDate } from '@/components/shared/PageHelpers';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import SmartTable from '@/components/smart-table/SmartTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Gauge, FileText, CreditCard, Bell, Ticket, DollarSign, Download, Activity, TrendingUp, BarChart3 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Customer360Page() {
  const { pageParams } = usePageStore();
  const cid = pageParams.id ?? '';
  const { data: customer } = useCustomerDetail(cid);
  const { data: invoicesData } = useInvoicesList();
  const { data: paymentsData } = usePaymentsList();
  const { data: metersData } = useMetersList();
  const { data: notifData } = useNotifications();
  const { data: ticketsData } = useTicketsList();
  const { data: readingsData } = useReadingsList();
  const issueMutation = useIssueInvoice();

  const c = customer;
  const invoices = (invoicesData ?? []).filter((i: any) => i.customerId === cid);
  const payments = (paymentsData ?? []).filter((p: any) => p.customerId === cid);
  const meters = (metersData ?? []).filter((m: any) => m.customerId === cid);
  const notifs = (notifData?.items ?? []).filter((n: any) => n.referenceId === cid);
  const tickets = (ticketsData ?? []).filter((t: any) => t.customerId === cid);
  const readings = (readingsData ?? []).filter((r: any) => r.customerId === cid);

  const totalOutstanding = invoices.reduce((s: number, i: any) => s + (i.remainingAmount ?? 0), 0);
  const totalInvoiced = invoices.reduce((s: number, i: any) => s + Number(i.total ?? i.totalAmount ?? 0), 0);
  const totalPaid = payments.reduce((s: number, p: any) => s + p.amount, 0);
  const collectionRate = totalInvoiced > 0 ? Math.round(totalPaid / totalInvoiced * 100) : 0;
  const activeMeters = meters.filter((m: any) => m.status === 'active').length;

  const agingBuckets = { current: 0, days1to30: 0, days31to60: 0, days61to90: 0, days120plus: 0 };
  const now = new Date();
  invoices.filter((i: any) => i.remainingAmount > 0).forEach((inv: any) => {
    const due = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.invoiceDate);
    const days = Math.floor((now.getTime() - due.getTime()) / (1000 * 86400));
    const amt = inv.remainingAmount ?? 0;
    if (days <= 0) agingBuckets.current += amt;
    else if (days <= 30) agingBuckets.days1to30 += amt;
    else if (days <= 60) agingBuckets.days31to60 += amt;
    else if (days <= 90) agingBuckets.days61to90 += amt;
    else agingBuckets.days120plus += amt;
  });

  const consumptionData = readings.slice(-12).map((r: any) => ({
    date: new Date(r.readingDate ?? r.readingAt).toLocaleDateString('en', { month: 'short' }),
    value: r.consumption ?? 0,
  }));

  if (!c) return <div className="p-6"><BackButton fallback="customers" /><p className="text-muted-foreground mt-4">Customer not found.</p></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <BackButton fallback="customers" />
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => toast.info('Record payment')}><CreditCard className="h-3.5 w-3.5 mr-1" />Pay</Button>
          <Button variant="outline" size="sm" onClick={() => toast.info('Open create invoice')}><FileText className="h-3.5 w-3.5 mr-1" />Invoice</Button>
          <Button variant="outline" size="sm" onClick={() => window.open(`/api/v1/customers/${cid}/statement/csv`, '_blank')}><Download className="h-3.5 w-3.5 mr-1" />Statement</Button>
        </div>
      </div>

      {/* Header */}
      <div className="glass-card rounded-xl p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold">{c.name}</h1>
              <StatusBadge status={c.status ?? 'active'} />
              <span className="text-xs text-muted-foreground">{c.code ?? c.id}</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 text-sm">
            <div><span className="text-xs text-muted-foreground">Outstanding</span><p className="font-bold">{formatCurrency(totalOutstanding)}</p></div>
            <div><span className="text-xs text-muted-foreground">Collection</span><p className="font-bold">{collectionRate}%</p></div>
            <div><span className="text-xs text-muted-foreground">Invoices</span><p className="font-bold">{invoices.length}</p></div>
            <div><span className="text-xs text-muted-foreground">Meters</span><p className="font-bold">{activeMeters}/{meters.length}</p></div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="meters">Meters</TabsTrigger>
          <TabsTrigger value="readings">Readings</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatCard label="Balance" value={formatCurrency(totalOutstanding)} icon={<DollarSign className="h-4 w-4" />} />
            <StatCard label="Invoices" value={invoices.length} icon={<FileText className="h-4 w-4" />} />
            <StatCard label="Paid" value={formatCurrency(totalPaid)} icon={<TrendingUp className="h-4 w-4" />} />
            <StatCard label="Collection Rate" value={`${collectionRate}%`} icon={<Activity className="h-4 w-4" />} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="glass-card border-border/50">
              <CardHeader><CardTitle className="text-sm">Aging</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>Current</span><span>{formatCurrency(agingBuckets.current)}</span></div>
                  <div className="flex justify-between"><span>1-30 Days</span><span>{formatCurrency(agingBuckets.days1to30)}</span></div>
                  <div className="flex justify-between"><span>31-60 Days</span><span>{formatCurrency(agingBuckets.days31to60)}</span></div>
                  <div className="flex justify-between"><span>61-90 Days</span><span>{formatCurrency(agingBuckets.days61to90)}</span></div>
                  <div className="flex justify-between text-red-500"><span>120+ Days</span><span>{formatCurrency(agingBuckets.days120plus)}</span></div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-border/50">
              <CardHeader><CardTitle className="text-sm">Consumption Trend</CardTitle></CardHeader>
              <CardContent>
                {consumptionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={consumptionData}><Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} /><Tooltip /></LineChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground text-center py-8">No reading data</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Financials */}
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
                { key: 'actions', label: '', render: (_v: any, row: any) => (
                  <div className="flex gap-1">
                    {row.status === 'draft' && <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => issueMutation.mutate(row.id)}>Issue</Button>}
                    <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => window.open(`/api/v1/downloads/invoices/${row.id}/pdf`, '_blank')}>PDF</Button>
                  </div>
                )},
              ]} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Meters */}
        <TabsContent value="meters">
          <Card className="glass-card border-border/50">
            <CardHeader><CardTitle className="text-sm">Meters ({meters.length})</CardTitle></CardHeader>
            <CardContent>
              <SmartTable data={meters} columns={[
                { key: 'serialNumber', label: 'Serial', sortable: true },
                { key: 'meterType', label: 'Type', render: (v: string) => <StatusBadge status={v} /> },
                { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v} /> },
                { key: 'lastReading', label: 'Last Reading' },
                { key: 'brand', label: 'Brand' },
              ]} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Readings */}
        <TabsContent value="readings">
          <Card className="glass-card border-border/50">
            <CardHeader><CardTitle className="text-sm">Reading History ({readings.length})</CardTitle></CardHeader>
            <CardContent>
              <SmartTable data={readings} columns={[
                { key: 'readingDate', label: 'Date', sortable: true, render: (v: string) => formatDate(v) },
                { key: 'meterSerial', label: 'Meter' },
                { key: 'consumption', label: 'Consumption' },
                { key: 'source', label: 'Source' },
                { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v} /> },
              ]} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Collections */}
        <TabsContent value="collections">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="glass-card border-border/50">
              <CardHeader><CardTitle className="text-sm">Aging Analysis</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 rounded bg-muted/30"><span>Current (0-30)</span><span className="font-mono">{formatCurrency(agingBuckets.current + agingBuckets.days1to30)}</span></div>
                  <div className="flex justify-between p-2 rounded bg-muted/30"><span>31-60 Days</span><span className="font-mono">{formatCurrency(agingBuckets.days31to60)}</span></div>
                  <div className="flex justify-between p-2 rounded bg-muted/30"><span>61-90 Days</span><span className="font-mono">{formatCurrency(agingBuckets.days61to90)}</span></div>
                  <div className="flex justify-between p-2 rounded bg-red-50 dark:bg-red-950/20"><span>120+ Days</span><span className="font-mono text-red-500">{formatCurrency(agingBuckets.days120plus)}</span></div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-border/50">
              <CardHeader><CardTitle className="text-sm">Collection Summary</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Total Invoiced</span><span>{formatCurrency(totalInvoiced)}</span></div>
                <div className="flex justify-between"><span>Total Collected</span><span className="text-emerald-500">{formatCurrency(totalPaid)}</span></div>
                <div className="flex justify-between"><span>Outstanding</span><span className="text-red-500">{formatCurrency(totalOutstanding)}</span></div>
                <div className="flex justify-between font-bold pt-2 border-t"><span>Collection Rate</span><span>{collectionRate}%</span></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 6: Documents */}
        <TabsContent value="documents">
          <div className="grid md:grid-cols-3 gap-4">
            {invoices.slice(-10).map((inv: any) => (
              <Card key={inv.id} className="glass-card border-border/50 cursor-pointer hover:border-primary/30" onClick={() => window.open(`/api/v1/downloads/invoices/${inv.id}/pdf`, '_blank')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2"><FileText className="h-4 w-4 text-primary" /><span className="font-mono text-xs">{inv.invoiceNumber}</span></div>
                  <div className="text-xs text-muted-foreground">{formatCurrency(inv.total)} · <StatusBadge status={inv.status} /></div>
                  <div className="text-xs text-muted-foreground">{formatDate(inv.invoiceDate)}</div>
                </CardContent>
              </Card>
            ))}
            {invoices.length === 0 && <p className="text-sm text-muted-foreground col-span-3 text-center py-8">No documents available</p>}
          </div>
        </TabsContent>

        {/* Tab 7: Tickets */}
        <TabsContent value="tickets">
          <Card className="glass-card border-border/50">
            <CardHeader><CardTitle className="text-sm">Tickets ({tickets.length})</CardTitle></CardHeader>
            <CardContent>
              <SmartTable data={tickets} columns={[
                { key: 'title', label: 'Title', sortable: true },
                { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v} /> },
                { key: 'priority', label: 'Priority', render: (v: string) => <StatusBadge status={v} /> },
                { key: 'createdAt', label: 'Created', render: (v: string) => formatDate(v) },
              ]} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 8: Notifications */}
        <TabsContent value="notifications">
          <Card className="glass-card border-border/50">
            <CardHeader><CardTitle className="text-sm">Notifications ({notifs.length})</CardTitle></CardHeader>
            <CardContent>
              <SmartTable data={notifs} columns={[
                { key: 'title', label: 'Title' },
                { key: 'body', label: 'Body' },
                { key: 'isRead', label: 'Status', render: (v: boolean) => v ? 'Read' : 'Unread' },
                { key: 'createdAt', label: 'Date', render: (v: string) => formatDate(v) },
              ]} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 9: Analytics */}
        <TabsContent value="analytics">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="glass-card border-border/50">
              <CardHeader><CardTitle className="text-sm">Consumption Trend</CardTitle></CardHeader>
              <CardContent>
                {consumptionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={consumptionData}><Line type="monotone" dataKey="value" stroke="#8884d8" /><Tooltip /></LineChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground text-center py-8">No data</p>}
              </CardContent>
            </Card>
            <Card className="glass-card border-border/50">
              <CardHeader><CardTitle className="text-sm">Invoice vs Payment</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[{ name: 'Invoiced', amount: totalInvoiced }, { name: 'Paid', amount: totalPaid }, { name: 'Outstanding', amount: totalOutstanding }]}>
                    <Bar dataKey="amount" fill="#8884d8" /><Tooltip />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
