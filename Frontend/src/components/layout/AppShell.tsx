'use client';

import React, { useState, useEffect } from 'react';
import { usePageStore, type PageKey } from '@/lib/router-store';
import { useAuthStore } from '@/lib/mock-auth';
import { TopNav } from './TopNav';
import { AppSidebar } from './AppSidebar';
import { LoginPage } from './LoginPage';

// Dashboard
import DashboardPage from '@/components/dashboard/DashboardPage';
import ExecutiveDashboard from '@/components/dashboard/ExecutiveDashboard';

// Projects
import ProjectsPage from '@/components/projects/ProjectsPage';
import ProjectDetailPage from '@/components/projects/ProjectDetailPage';
import LocationsPage from '@/components/projects/LocationsPage';

// Customers
import CustomersPage from '@/components/customers/CustomersPage';
import CustomerDetailPage from '@/components/customers/CustomerDetailPage';
import Customer360Page from '@/components/customers/Customer360Page';

// Meters
import MetersPage from '@/components/meters/MetersPage';
import MeterDetailPage from '@/components/meters/MeterDetailPage';
import MeterAssignPage from '@/components/meters/MeterAssignPage';
import MeterReplacePage from '@/components/meters/MeterReplacePage';
import MeterTerminatePage from '@/components/meters/MeterTerminatePage';

// SIM Cards
import SimCardsPage from '@/components/sim-cards/SimCardsPage';

// Readings
import ReadingsPage from '@/components/readings/ReadingsPage';
import ReadingNewPage from '@/components/readings/ReadingNewPage';

// Billing
import ConsumptionPage from '@/components/billing/ConsumptionPage';
import WaterBalancePage from '@/components/billing/WaterBalancePage';
import InvoicesPage from '@/components/billing/InvoicesPage';
import InvoiceDetailPage from '@/components/billing/InvoiceDetailPage';
import PaymentsPage from '@/components/billing/PaymentsPage';
import BalancesPage from '@/components/billing/BalancesPage';

// Reports & Settings
import ReportsPage from '@/components/reports/ReportsPage';
import SettingsPage from '@/components/reports/SettingsPage';

// Alerts
import AlertsPage from '@/components/alerts/AlertsPage';

// Tickets & Support
import TicketsPage from '@/components/tickets/TicketsPage';
import SupportPage from '@/components/tickets/SupportPage';

import { useT } from '@/lib/i18n/context';
import { useIsMobile } from '@/hooks/use-mobile';
import GlobalSearchDialog from '@/components/shared/GlobalSearchDialog';

export function AppShell() {
  const currentPage = usePageStore((s) => s.currentPage);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close mobile sidebar on page change
  const [prevPage, setPrevPage] = useState(currentPage);
  if (currentPage !== prevPage) {
    setPrevPage(currentPage);
    if (isMobile) {
      setSidebarOpen(false);
    }
  }

  // Reset collapsed state when switching to mobile
  const [prevIsMobile, setPrevIsMobile] = useState(isMobile);
  if (isMobile !== prevIsMobile) {
    setPrevIsMobile(isMobile);
    if (isMobile) {
      setSidebarCollapsed(false);
    }
  }

  // Not authenticated → show login page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Compute main content margin based on sidebar state
  const contentMarginStart = isMobile ? 0 : sidebarCollapsed ? 64 : 256;

  // Map currentPage to the correct component
  const pageComponent = renderPage(currentPage);

  return (
    <div className="min-h-screen bg-background">
      <GlobalSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <TopNav onMenuClick={() => setSidebarOpen(true)} />
      <AppSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main
        className="pt-16 min-h-screen transition-all duration-300 ease-in-out"
        style={{ marginInlineStart: contentMarginStart }}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {pageComponent}
        </div>
      </main>
    </div>
  );
}

// ---- Page Router ----
function renderPage(page: PageKey): React.ReactNode {
  switch (page) {
    case 'login':
      return <LoginPage />;

    case 'dashboard':
      return <DashboardPage />;
    case 'executive-dashboard':
      return <ExecutiveDashboard />;

    case 'projects':
      return <ProjectsPage />;

    case 'project-detail':
      return <ProjectDetailPage />;

    case 'locations':
      return <LocationsPage />;

    case 'customers':
      return <CustomersPage />;

    case 'customer-detail':
      return <CustomerDetailPage />;
    case 'customer-360':
      return <Customer360Page />;

    case 'meters':
      return <MetersPage />;

    case 'meter-detail':
      return <MeterDetailPage />;

    case 'meter-assign':
      return <MeterAssignPage />;

    case 'meter-replace':
      return <MeterReplacePage />;

    case 'meter-terminate':
      return <MeterTerminatePage />;

    case 'sim-cards':
      return <SimCardsPage />;

    case 'readings':
      return <ReadingsPage />;

    case 'reading-new':
      return <ReadingNewPage />;

    case 'consumption':
      return <ConsumptionPage />;

    case 'water-balance':
      return <WaterBalancePage />;

    case 'invoices':
      return <InvoicesPage />;

    case 'invoice-detail':
      return <InvoiceDetailPage />;

    case 'payments':
      return <PaymentsPage />;

    case 'balances':
      return <BalancesPage />;

    case 'reports':
      return <ReportsPage />;

    case 'alerts':
      return <AlertsPage />;

    case 'tickets':
      return <TicketsPage />;

    case 'support':
      return <SupportPage />;

    case 'settings':
      return <SettingsPage />;

    default:
      return <DefaultNotFound />;
  }
}

function DefaultNotFound() {
  const t = useT();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h1 className="text-4xl font-bold text-muted-foreground">404</h1>
      <p className="text-muted-foreground">{t('nav.pageNotFound')}</p>
    </div>
  );
}
