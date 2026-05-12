import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { RevenueTrend } from '../types';
import { motion } from 'framer-motion';

const chartColors = {
  primary: '#D32F2F',    // 品牌红
  secondary: '#F97316',  // 橙色
  grid: '#F1F5F9',
  text: '#94A3B8',
};

const SERVER_URL = `http://${window.location.hostname}:4000/api`;

export const RevenueChart = () => {
  const [data, setData] = useState<RevenueTrend['data']>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('pos_token');
      if (!token || token === 'undefined' || token === 'null') return;
      try {
        const response = await fetch(`${SERVER_URL}/analytics/revenue-trend`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result: RevenueTrend = await response.json();
        setData(result.data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch revenue trend:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-80 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-black text-slate-800">📈 营收趋势 (Revenue Trend)</h3>
        <span className="text-[10px] font-black bg-slate-100 text-slate-400 px-2 py-1 rounded uppercase tracking-widest">Hourly</span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.1} />
                <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(ts) => new Date(ts).getHours() + ':00'}
              stroke={chartColors.text}
              fontSize={10}
              fontWeight="bold"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(val) => `₸${val / 1000}k`}
              stroke={chartColors.text}
              fontSize={10}
              fontWeight="bold"
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: `1px solid #f1f5f9`,
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
              labelFormatter={(ts) => new Date(ts).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              formatter={(value: number) => [`₸ ${value.toLocaleString()}`, '营收']}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={chartColors.primary}
              fill="url(#revenueGradient)"
              strokeWidth={3}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
