'use client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { PageHeader, formatCurrency } from '@/components/shared/PageHelpers';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { usePageStore } from '@/lib/router-store';
import { useT } from '@/lib/i18n/context';
import { Phone, Mail, MapPin, Gauge, CreditCard, Search, Plus, Building2, Users } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function CustomersPage() {
  const t = useT();
  const { navigate } = usePageStore();
  const [search, setSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  const projectId = typeof window !== 'undefined' ? localStorage.getItem('selected-project') || '' : '';
  const { data: customers } = useQuery({ queryKey: ['customers', projectId], queryFn: () => {
    if (!projectId) return Promise.resolve([]);
    return apiGet<any[]>(`/projects/${projectId}/customers`).catch(() => []);
  }, enabled: !!projectId });
  const { data: areas } = useQuery({ queryKey: ['areas'], queryFn: () => apiGet<any[]>('/areas').catch(() => []) });
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: () => apiGet<any[]>('/projects').catch(() => []) });

  const areaList = Array.isArray(areas) ? areas : [];
  const projectList = Array.isArray(projects) ? projects : [];
  const customerList = Array.isArray(customers) ? customers : [];

  // Filter projects by selected area
  const filteredProjects = selectedArea
    ? projectList.filter((p: any) => p.areaId === selectedArea || p.area === selectedArea)
    : projectList;

  // Filter customers by area + project + search
  const filteredCustomers = customerList.filter((c: any) => {
    if (selectedArea && c.areaId !== selectedArea && c.area !== selectedArea) return false;
    if (selectedProject && c.projectId !== selectedProject) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = (c.name || '').toLowerCase();
      const code = (c.customerCode || '').toLowerCase();
      const phone = (c.phone || '');
      if (!name.includes(q) && !code.includes(q) && !phone.includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      <PageHeader title={t('customers.title')} subtitle={t('customers.subtitle')} />

      {/* Area Tabs */}
      <div className="mb-3">
        <Tabs value={selectedArea} onValueChange={v => { setSelectedArea(v); setSelectedProject(''); }}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="">All Areas</TabsTrigger>
            {areaList.map((a: any) => (
              <TabsTrigger key={a.id || a.areaCode} value={a.areaCode || a.id}>
                <Building2 className="h-3 w-3 mr-1" />{a.areaName || a.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Project Sub Tabs */}
      {selectedArea && (
        <div className="mb-3">
          <Tabs value={selectedProject} onValueChange={setSelectedProject}>
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="">All Projects</TabsTrigger>
              {filteredProjects.map((p: any) => (
                <TabsTrigger key={p.id} value={p.id}>{p.name}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Search + Add */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search customers..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button size="sm" className="gap-1" onClick={() => navigate('customer-detail', { id: 'new' })}>
          <Plus className="h-3.5 w-3.5" />Add Customer
        </Button>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer: any) => {
          const meterCount = customer.meters?.length ?? customer.activeMeters ?? 0;
          const invoiceCount = customer.invoices?.length ?? 0;
          return (
            <Card key={customer.id} className="hover:border-primary/40 transition-colors cursor-pointer" onClick={() => navigate('customer-detail', { id: customer.id })}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{customer.name}</h3>
                        <p className="text-[11px] text-muted-foreground">{customer.customerCode || customer.code}</p>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={customer.status} />
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    <span>{customer.area || customer.projectName || '-'}</span>
                  </div>
                  {customer.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/50">
                  <div className="text-center">
                    <Gauge className="h-3.5 w-3.5 mx-auto mb-0.5 text-muted-foreground" />
                    <p className="text-xs font-medium">{meterCount}</p>
                    <p className="text-[10px] text-muted-foreground">Meters</p>
                  </div>
                  <div className="text-center">
                    <CreditCard className="h-3.5 w-3.5 mx-auto mb-0.5 text-muted-foreground" />
                    <p className="text-xs font-medium">{invoiceCount}</p>
                    <p className="text-[10px] text-muted-foreground">Invoices</p>
                  </div>
                  <div className="text-center">
                    <CreditCard className="h-3.5 w-3.5 mx-auto mb-0.5 text-emerald-500" />
                    <p className={`text-xs font-medium ${customer.currentBalance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {formatCurrency(customer.currentBalance || 0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Balance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filteredCustomers.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">No customers found</div>
        )}
      </div>
    </div>
  );
}
