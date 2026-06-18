'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHelpers';
import { toast } from 'sonner';
import { FileText, Download, Eye, Filter } from 'lucide-react';
import { useT } from '@/lib/i18n/context';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';

export default function ReportsPage() {
  const t = useT();
  const [activeCategory, setActiveCategory] = useState('all');
  const { data: reportsData } = useQuery({ queryKey: ['reports'], queryFn: () => apiGet<any[]>('/reports') });
  const reports = reportsData ?? [];
  const categories = ['all', ...new Set(reports.map((r: any) => r.category))];
  const filtered = activeCategory === 'all' ? reports : reports.filter((r: any) => r.category === activeCategory);

  return (
    <div>
      <PageHeader title={t('reports.title')} subtitle={t('reports.subtitle')} />
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <Button key={cat} variant={activeCategory === cat ? 'default' : 'outline'} size="sm" onClick={() => setActiveCategory(cat)} className="capitalize">{cat}</Button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((report: any) => (
          <Card key={report.id} className="glass-card border-border/50 hover:border-primary/30 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-sm">{report.name}</CardTitle>
                </div>
              </div>
              {report.description && <CardDescription className="text-xs">{report.description}</CardDescription>}
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => toast.info('Preview report')}><Eye className="h-3 w-3" /> Preview</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => toast.info('Export CSV placeholder')}><Download className="h-3 w-3" /> CSV</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => toast.info('Export XLSX placeholder')}><Download className="h-3 w-3" /> XLSX</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
