export interface DashboardMetrics {
  todayRevenue: number;
  todayOrders: number;
  avgTicket: number;
  kaspiRate: number;
  avgTableTurnover: number;
  peakHour: string;
  topProducts: Array<{
    name: string;
    soldCount: number;
    revenue: number;
  }>;
  lastUpdated: string;
}

export interface RevenueTrend {
  period: 'hourly' | 'daily';
  data: Array<{
    timestamp: string;
    revenue: number;
    orderCount: number;
    avgTicket: number;
  }>;
}
