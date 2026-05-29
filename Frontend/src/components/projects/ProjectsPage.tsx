'use client';

import { Plus, MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { usePageStore } from '@/lib/router-store';
import { mockProjects } from '@/lib/mock-data';
import SmartTable from '@/components/smart-table/SmartTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHelpers';
import { formatDate } from '@/components/shared/PageHelpers';
import { QueryBoundary } from '@/components/shared/QueryBoundary';
import { useProjectsList } from '@/hooks/use-projects';

export default function ProjectsPage() {
  const { navigate } = usePageStore();
  const { data: apiProjects, isLoading, isError, error } = useProjectsList();
  const projects = apiProjects ?? mockProjects;
  const areas = [...new Set(projects.map((p) => p.area))];

  const columns = [
    { key: 'code', label: 'Code', sortable: true, width: '100px' },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'location', label: 'Location', sortable: true },
    { key: 'area', label: 'Area', sortable: true },
    { key: 'buildings', label: 'Buildings', sortable: true, width: '90px' },
    { key: 'units', label: 'Units', sortable: true, width: '80px' },
    { key: 'customers', label: 'Customers', sortable: true, width: '100px' },
    { key: 'activeMeters', label: 'Active Meters', sortable: true, width: '110px' },
    {
      key: 'status', label: 'Status', sortable: true, width: '110px',
      render: (val: string) => <StatusBadge status={val} />,
    },
    {
      key: 'createdAt', label: 'Created', sortable: true, width: '110px',
      render: (val: string) => formatDate(val),
    },
    {
      key: 'actions', label: 'Actions', width: '60px',
      render: (_val: unknown, row: { id: string; name: string }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate('project-detail', { id: row.id }); }}>
              <Eye className="h-4 w-4 mr-2" /> View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.info('Edit project: ' + row.name); }}>
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.info('Delete project: ' + row.name); }} className="text-red-500">
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Manage your projects and properties"
        action={
          <Button className="gap-2" onClick={() => toast.info('Add Project dialog would open')}>
            <Plus className="h-4 w-4" /> Add Project
          </Button>
        }
      />
      <QueryBoundary isLoading={isLoading} isError={isError} error={error} isEmpty={!isLoading && projects.length === 0} emptyMessage="No projects found">
      <SmartTable
        data={projects}
        columns={columns}
        filters={[
          {
            key: 'status', label: 'Status', type: 'select',
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
              { label: 'Completed', value: 'completed' },
              { label: 'Archived', value: 'archived' },
            ],
          },
          {
            key: 'area', label: 'Area', type: 'select',
            options: areas.map((a) => ({ label: a, value: a })),
          },
        ]}
        onRowClick={(row) => navigate('project-detail', { id: row.id })}
        searchKeys={['name', 'code', 'location', 'area']}
        searchPlaceholder="Search projects..."
      />
      </QueryBoundary>
    </div>
  );
}
