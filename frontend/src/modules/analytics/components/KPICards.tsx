import React from 'react';
import { DashboardMetrics } from '../types';
import { motion } from 'framer-motion';

interface KPICardProps {
  label: string;
  value: string;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
  delay?: number;
}

const KPICard = ({ label, value, subtext, trend = 'neutral', icon, delay = 0 }: KPICardProps) => {
  const trendColors = {
    up: 'text-emerald-600',
    down: 'text-red-600',
    neutral: 'text-slate-600',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</span>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <div className="text-3xl font-black text-slate-800 mb-1">{value}</div>
      {subtext && (
        <div className={`text-sm font-bold ${trendColors[trend]}`}>
          {subtext}
        </div>
      )}
    </motion.div>
  );
};

export const KPICards = ({ metrics }: { metrics: DashboardMetrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      <KPICard
        label="今日营收 (Today Revenue)"
        value={`₸ ${metrics.todayRevenue.toLocaleString()}`}
        subtext={`${metrics.todayOrders} 笔订单`}
        trend="up"
        icon="💰"
        delay={0.1}
      />
      <KPICard
        label="平均客单价 (Avg Ticket)"
        value={`₸ ${metrics.avgTicket.toLocaleString()}`}
        subtext="每单平均金额"
        trend="neutral"
        icon="📝"
        delay={0.2}
      />
      <KPICard
        label="桌台周转率 (Table Turnover)"
        value={`${metrics.avgTableTurnover} 次/天`}
        subtext={`高峰时段: ${metrics.peakHour}`}
        trend="up"
        icon="🪑"
        delay={0.3}
      />
      <KPICard
        label="Kaspi 支付占比"
        value={`${metrics.kaspiRate}%`}
        subtext="主流支付方式"
        trend="up"
        icon="📱"
        delay={0.4}
      />
      <KPICard
        label="订单总数 (Total Orders)"
        value={metrics.todayOrders.toString()}
        subtext="今日完成订单"
        trend="neutral"
        icon="🛒"
        delay={0.5}
      />
      <KPICard
        label="热销菜品 (Top Seller)"
        value={metrics.topProducts[0]?.name || '-'}
        subtext={`${metrics.topProducts[0]?.soldCount || 0} 份`}
        trend="up"
        icon="🔥"
        delay={0.6}
      />
    </div>
  );
};
