'use client';

import { usePageStore } from '@/lib/router-store';
import { mockProjects, mockBuildings, mockUnits, mockCustomers, mockMeters, mockAlerts, mockReadings } from '@/lib/mock-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BackButton, StatCard } from '@/components/shared/PageHelpers';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import SmartTable from '@/components/smart-table/SmartTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2, Users, Gauge, FileText, Zap } from 'lucide-react';
import { formatDate } from '@/components/shared/PageHelpers';
import { useProjectDetail } from '@/hooks/use-projects';

export default function ProjectDetailPage() {
  const { pageParams } = usePageStore();
  const { data: apiProject, isLoading, isError, error } = useProjectDetail(pageParams.id ?? '');
  const project = apiProject ?? mockProjects.find((p) => p.id === pageParams.id);

  if (!project && !isLoading) {
    return (
      <div>
        <BackButton fallback="projects" />
        <QueryBoundary isLoading={isLoading} isError={isError} error={error}>
          <p className="text-muted-foreground">Project not found.</p>
        </QueryBoundary>
      </div>
    );
  }

  const buildings = mockBuildings.filter((b) => b.projectId === project.id);
  const units = mockUnits.filter((u) => u.projectId === project.id);
  const customers = mockCustomers.filter((c) => c.projectId === project.id);
  const meters = mockMeters.filter((m) => m.projectId === project.id);
  const alerts = mockAlerts.filter((a) => a.entityId && meters.some((m) => m.id === a.entityId));
  const readings = mockReadings.filter((r) => r.projectId === project.id);

  const chartData = readings.slice(-6).map((r) => ({
    date: new Date(r.readingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    consumption: r.consumption,
  }));

  return (
    <div>
      <BackButton fallback="projects" />
      <QueryBoundary isLoading={isLoading} isError={isError} error={error}>

      {/* Header */}
      <div className="glass-card rounded-xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-muted-foreground text-sm mt-1">{project.description}</p>
            <p className="text-xs text-muted-foreground mt-1">{project.code} · {project.location}, {project.area}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="Buildings" value={project.buildings} icon={<Building2 className="h-5 w-5" />} />
        <StatCard label="Units" value={project.units} icon={<FileText className="h-5 w-5" />} />
        <StatCard label="Customers" value={project.customers} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Active Meters" value={project.activeMeters} icon={<Gauge className="h-5 w-5" />} />
        <StatCard label="Tariff" value={project.tariff} icon={<Zap className="h-5 w-5" />} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="meters">Meters</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Project Info</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{project.location}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Area</span><span>{project.area}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{formatDate(project.createdAt)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tariff</span><span>{project.tariff}</span></div>
              </CardContent>
            </Card>
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Consumption Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={chartData}>
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                      <Line type="monotone" dataKey="consumption" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground py-8 text-center">No data</p>}
              </CardContent>
            </Card>
            <Card className="glass-card border-border/50 md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {alerts.length > 0 ? (
                  <div className="space-y-2">
                    {alerts.slice(0, 5).map((a) => (
                      <div key={a.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                        <div>
                          <p className="text-sm font-medium">{a.title}</p>
                          <p className="text-xs text-muted-foreground">{a.description}</p>
                        </div>
                        <StatusBadge status={a.severity} />
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground text-center py-4">No alerts for this project</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="locations">
          <SmartTable
            data={buildings}
            columns={[
              { key: 'name', label: 'Building', sortable: true },
              { key: 'floors', label: 'Floors', sortable: true, width: '80px' },
              { key: 'units', label: 'Units', sortable: true, width: '80px' },
              { key: 'createdAt', label: 'Created', sortable: true, width: '110px', render: (v: string) => formatDate(v) },
            ]}
            searchPlaceholder="Search buildings..."
            searchKeys={['name']}
          />
        </TabsContent>

        <TabsContent value="customers">
          <SmartTable
            data={customers}
            columns={[
              { key: 'code', label: 'Code', sortable: true, width: '120px' },
              { key: 'name', label: 'Name', sortable: true },
              { key: 'customerType', label: 'Type', sortable: true, width: '120px', render: (v: string) => <StatusBadge status={v} /> },
              { key: 'activeMeters', label: 'Meters', width: '80px' },
              { key: 'currentBalance', label: 'Balance', sortable: true, width: '110px', render: (v: number) => <span className={v > 0 ? 'text-red-500' : v < 0 ? 'text-blue-500' : 'text-emerald-500'}>{v.toLocaleString()}</span> },
              { key: 'status', label: 'Status', width: '90px', render: (v: string) => <StatusBadge status={v} /> },
            ]}
            searchPlaceholder="Search customers..."
            searchKeys={['name', 'code']}
          />
        </TabsContent>

        <TabsContent value="meters">
          <SmartTable
            data={meters}
            columns={[
              { key: 'serialNumber', label: 'Serial', sortable: true },
              { key: 'meterType', label: 'Type', width: '120px', render: (v: string) => <StatusBadge status={v} /> },
              { key: 'brand', label: 'Brand', sortable: true },
              { key: 'unitNumber', label: 'Unit', width: '90px', render: (v: string) => v || '-' },
              { key: 'customerName', label: 'Customer', render: (v: string) => v || '-' },
              { key: 'lastReading', label: 'Last Reading', width: '110px', render: (v: number) => v ? v.toLocaleString() : '-' },
              { key: 'status', label: 'Status', width: '100px', render: (v: string) => <StatusBadge status={v} /> },
            ]}
            searchPlaceholder="Search meters..."
            searchKeys={['serialNumber', 'brand', 'customerName']}
            filters={[
              { key: 'status', label: 'Status', type: 'select', options: [
                { label: 'Active', value: 'active' }, { label: 'Offline', value: 'offline' }, { label: 'Available', value: 'available' }, { label: 'Faulty', value: 'faulty' },
              ]},
              { key: 'meterType', label: 'Type', type: 'select', options: [
                { label: 'Electricity', value: 'electricity' }, { label: 'Main Water', value: 'main_water' }, { label: 'Child Water', value: 'child_water' },
              ]},
            ]}
          />
        </TabsContent>

        <TabsContent value="invoices">
          <SmartTable
            data={[]}
            columns={[
              { key: 'invoiceNumber', label: 'Invoice #', sortable: true },
              { key: 'customerName', label: 'Customer' },
              { key: 'total', label: 'Total', width: '100px' },
              { key: 'status', label: 'Status', width: '110px', render: (v: string) => <StatusBadge status={v} /> },
            ]}
            searchPlaceholder="Search invoices..."
            emptyMessage="No invoices for this project"
          />
        </TabsContent>
      </Tabs>
      </QueryBoundary>
    </div>
  );
}
