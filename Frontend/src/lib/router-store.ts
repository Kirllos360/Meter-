'use client';

import { create } from 'zustand';

export type PageKey =
  | 'login'
  | 'dashboard'
  | 'executive-dashboard'
  | 'projects'
  | 'project-detail'
  | 'locations'
  | 'customers'
  | 'customer-detail'
  | 'customer-360'
  | 'meters'
  | 'meter-detail'
  | 'meter-assign'
  | 'meter-replace'
  | 'meter-terminate'
  | 'sim-cards'
  | 'readings'
  | 'reading-new'
  | 'consumption'
  | 'water-balance'
  | 'invoices'
  | 'invoice-detail'
  | 'payments'
  | 'balances'
  | 'reports'
  | 'alerts'
  | 'tickets'
  | 'support'
  | 'settings';

interface RouterState {
  currentPage: PageKey;
  pageParams: Record<string, string>;
  navigate: (page: PageKey, params?: Record<string, string>) => void;
  goBack: () => void;
}

const history: PageKey[] = [];

export const usePageStore = create<RouterState>((set, get) => ({
  currentPage: 'login',
  pageParams: {},

  navigate: (page: PageKey, params = {}) => {
    const { currentPage } = get();
    history.push(currentPage);
    set({ currentPage: page, pageParams: params });
    window.scrollTo(0, 0);
  },

  goBack: () => {
    const prev = history.pop();
    if (prev) {
      set({ currentPage: prev, pageParams: {} });
    }
  },
}));
