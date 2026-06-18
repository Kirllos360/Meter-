'use client';

import { useState } from 'react';
import { Plus, MoreHorizontal, Eye, Pencil, Trash2, Zap, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { usePageStore } from '@/lib/router-store';
import { useMetersList, useDeleteMeter } from '@/hooks/use-meters';
import { useProjectsList } from '@/hooks/use-projects';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import SmartTable from '@/components/smart-table/SmartTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader, formatDate } from '@/components/shared/PageHelpers';
import { useT } from '@/lib/i18n/context';

export default function MetersPage() {
  const { navigate } = usePageStore();
  const t = useT();
  const metersQuery = useMetersList();
  const meters = metersQuery.data ?? [];
  const { data: apiProjects } = useProjectsList();
  const deleteMutation = useDeleteMeter();
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const columns = [
    {
      key: 'serialNumber', label: t('meters.serialNumber'), sortable: true,
      render: (v: string, row: { meterType: string }) => (
        <div className="flex items-center gap-2">
          {row.meterType === 'electricity' ? <Zap className="h-3.5 w-3.5 text-amber-500" /> : <Droplets className="h-3.5 w-3.5 text-blue-500" />}
          <span className="font-mono text-xs">{v}</span>
        </div>
      ),
    },
    {
      key: 'meterType', label: t('meters.type'), sortable: true, width: '120px',
      render: (v: string) => <StatusBadge status={v} />,
    },
    { key: 'brand', label: 'Brand', sortable: true },
    { key: 'projectName', label: 'Project', sortable: true, render: (v: string) => v || '-' },
    { key: 'unitNumber', label: 'Building/Unit', width: '110px', render: (_v: unknown, row: { buildingName?: string; unitNumber?: string }) => row.buildingName && row.unitNumber ? `${row.buildingName} / ${row.unitNumber}` : '-' },
    { key: 'customerName', label: t('meters.customer'), render: (v: string) => v || '-' },
    { key: 'simCardId', label: 'SIM', width: '80px', render: (v: string) => v || '-' },
    { key: 'ipAddress', label: 'IP', width: '110px', render: (v: string) => v || '-' },
    { key: 'lastReading', label: t('meters.lastReading'), width: '110px', render: (v: number) => v ? v.toLocaleString() : '-' },
    {
      key: 'status', label: t('meters.status'), sortable: true, width: '110px',
      render: (v: string) => <StatusBadge status={v} />,
    },
    {
      key: 'actions', label: 'Actions', width: '60px',
      render: (_val: unknown, row: { id: string; serialNumber: string }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate('meter-detail', { id: row.id }); }}>
              <Eye className="h-4 w-4 mr-2" /> {t('meters.actions.view')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate('meter-detail', { id: row.id }); }}>
              <Pencil className="h-4 w-4 mr-2" /> {t('meters.actions.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }} className="text-red-500">
              <Trash2 className="h-4 w-4 mr-2" /> {t('meters.actions.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('meters.title')}
        subtitle="Manage water and electricity meters"
        action={
          <Button className="gap-2" onClick={() => navigate('meter-detail', { id: 'new' })}>
            <Plus className="h-4 w-4" /> {t('meters.add')}
          </Button>
        }
      />
      <QueryBoundary query={metersQuery}>
      <SmartTable
        data={meters}
        columns={columns}
        filters={[
          {
            key: 'meterType', label: 'Meter Type', type: 'select',
            options: [
              { label: 'Electricity', value: 'electricity' },
              { label: 'Main Water', value: 'main_water' },
              { label: 'Child Water', value: 'child_water' },
            ],
          },
          {
            key: 'projectId', label: 'Project', type: 'select',
            options: (apiProjects ?? []).map((p: { name: string; id: string }) => ({ label: p.name, value: p.id })),
          },
          {
            key: 'status', label: 'Status', type: 'select',
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Offline', value: 'offline' },
              { label: 'Available', value: 'available' },
              { label: 'Faulty', value: 'faulty' },
              { label: 'Replaced', value: 'replaced' },
              { label: 'Terminated', value: 'terminated' },
              { label: 'Retired', value: 'retired' },
              { label: 'Assigned', value: 'assigned' },
            ],
          },
        ]}
        searchKeys={['serialNumber', 'brand', 'model', 'customerName', 'projectName']}
        searchPlaceholder={t('meters.search')}
        onRowClick={(row) => navigate('meter-detail', { id: row.id })}
      />
      </QueryBoundary>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meter</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete meter <strong>{deleteTarget?.serialNumber}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => { if (deleteTarget) { deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); } }}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
