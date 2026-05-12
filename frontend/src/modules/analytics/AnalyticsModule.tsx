import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { DashboardMetrics } from './types';
import { KPICards } from './components/KPICards';
import { RevenueChart } from './components/RevenueChart';
import { TopProductsTable } from './components/TopProductsTable';
import { useSocket } from '../../hooks/useSocket';
import { useOrders } from '../../context/OrderContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { CONFIG } from '../../config';
import { 
  ORDER_STATUS, 
  ORDER_EVENT_TYPE 
} from '../../constants/orderStatus';


export const AnalyticsModule: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { on } = useSocket();
  const { events } = useOrders();
  const { token } = useAuth();
  const [roleFilter, setRoleFilter] = useState<'all' | 'waiter' | 'chef' | 'cashier'>('all');

  const fetchMetrics = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${CONFIG.API_BASE}/analytics/dashboard-metrics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Unauthorized');
      const data = await response.json();
      setMetrics(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMetrics();

    // 订阅 WebSocket 更新
    const unsubscribe = on('analytics:update', () => {
      console.log('[Socket] Analytics update received');
      fetchMetrics();
    });

    return unsubscribe;
  }, [on, fetchMetrics]);

  const handleExportCSV = async () => {
    if (!token) return;
    try {
      // 获取更多订单用于报表分析 (例如前1000条)
      const response = await fetch(`${CONFIG.API_BASE}/orders?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Unauthorized export');
      const allOrders = await response.json();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayPaidOrders = allOrders.filter((o: any) => 
        o.status === ORDER_STATUS.PAID && new Date(o.createdAt) >= today
      );

      const headers = ['Order ID', 'Time', 'Table', 'Type', 'Total (₸)', 'Payment Method'];
      const rows = todayPaidOrders.map((o: any) => [
        o.displayId || o.id,
        new Date(o.createdAt).toLocaleTimeString('ru-RU'),
        o.tableId ? `Table #${o.tableId}` : 'Takeaway',
        o.type,
        o.total,
        o.payments?.[0]?.method || 'N/A'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((r: any[]) => r.join(',')),
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Mubin_Sales_Report_${new Date().toLocaleDateString()}.csv`;
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const filteredEvents = useMemo(() => {
    if (roleFilter === 'all') return events;
    return events.filter((e: any) => {
      if (roleFilter === 'waiter') return e.type === ORDER_EVENT_TYPE.ORDER_SENT || e.type === ORDER_EVENT_TYPE.ITEM_SERVED;
      if (roleFilter === 'chef') return e.type === ORDER_EVENT_TYPE.ITEM_READY;
      if (roleFilter === 'cashier') return e.type === ORDER_EVENT_TYPE.ORDER_PAID;
      return true;
    });
  }, [events, roleFilter]);

  if (loading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-64 animate-fade">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
        <p className="text-slate-500 font-bold">加载数据中 (Loading Analytics)...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 pb-10 animate-fade"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800">📊 老板仪表盘 (Boss Dashboard)</h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">
            实时数据统计 • 最后更新: {metrics ? new Date(metrics.lastUpdated).toLocaleTimeString('ru-RU') : '-'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95 flex items-center gap-2"
          >
            <span>📤</span> 导出报表 (EXPORT)
          </button>
          <button
            onClick={fetchMetrics}
            className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-black text-xs hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95"
          >
            🔄 刷新数据 (REFRESH)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {metrics && <KPICards metrics={metrics} />}

      {/* Charts & Top Products */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <RevenueChart />
        {metrics && <TopProductsTable products={metrics.topProducts} />}
      </div>

      {/* Real-time Timeline Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-10 mt-12 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 relative z-10">
          <div>
            <h3 className="text-2xl font-black text-slate-800">🚀 实时运营动态 (Operational Timeline)</h3>
            <p className="text-sm text-slate-400 font-medium">前台与后厨实时动态追踪</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl shadow-inner">
            {(['all', 'waiter', 'chef', 'cashier'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ${
                  roleFilter === role 
                    ? 'bg-white text-slate-800 shadow-md' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span>
                  {role === 'all' ? '📊' : role === 'waiter' ? '🏃' : role === 'chef' ? '👨‍🍳' : '💰'}
                </span>
                {role.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="relative space-y-8 max-h-[600px] overflow-y-auto sidebar-scroll pr-4">
          {/* Vertical Timeline Line */}
          <div className="absolute left-6 top-2 bottom-2 w-0.5 border-l-2 border-dashed border-slate-100" />

          {filteredEvents.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24 text-slate-300 italic flex flex-col items-center gap-4"
            >
               <span className="text-6xl opacity-20">📡</span>
               <p className="font-bold tracking-widest uppercase">暂无动态数据 (No activities)</p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredEvents.map((e: any) => (
                <motion.div 
                  key={e.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative pl-14 animate-fade"
                >
                {/* Timeline Icon Node */}
                <div className={`absolute left-0 top-0 w-12 h-12 rounded-2xl flex-center shadow-lg border-2 border-white z-10 transition-transform hover:scale-110 ${
                  e.type === ORDER_EVENT_TYPE.ORDER_SENT ? 'bg-amber-500 text-white shadow-amber-100' :
                  e.type === ORDER_EVENT_TYPE.ITEM_READY ? 'bg-emerald-500 text-white shadow-emerald-100' :
                  e.type === ORDER_EVENT_TYPE.ITEM_SERVED ? 'bg-blue-500 text-white shadow-blue-100' : 
                  e.type === ORDER_EVENT_TYPE.ORDER_CANCELLED ? 'bg-red-600 text-white shadow-red-100' :
                  'bg-purple-600 text-white shadow-purple-100'
                }`}>
                  <span className="text-lg">
                    {e.type === ORDER_EVENT_TYPE.ORDER_SENT ? '📝' :
                     e.type === ORDER_EVENT_TYPE.ITEM_READY ? '👩‍🍳' :
                     e.type === ORDER_EVENT_TYPE.ITEM_SERVED ? '🥗' : 
                     e.type === ORDER_EVENT_TYPE.ORDER_CANCELLED ? '🚫' : '💰'}
                  </span>
                </div>

                <div className="bg-slate-50/50 hover:bg-white hover:shadow-2xl hover:shadow-slate-100 p-6 rounded-3xl border border-transparent hover:border-slate-100 transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        e.type === ORDER_EVENT_TYPE.ORDER_SENT ? 'bg-amber-100 text-amber-700' :
                        e.type === ORDER_EVENT_TYPE.ITEM_READY ? 'bg-emerald-100 text-emerald-700' :
                        e.type === ORDER_EVENT_TYPE.ITEM_SERVED ? 'bg-blue-100 text-blue-700' : 
                        e.type === ORDER_EVENT_TYPE.ORDER_CANCELLED ? 'bg-red-100 text-red-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {e.type.replace('_', ' ')}
                      </span>
                      <span className="text-base font-black text-slate-800">
                        {e.tableId ? `Table #${e.tableId}` : 'Takeaway'}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-400 bg-white px-2.5 py-1 rounded-lg shadow-sm">
                      {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {e.details}
                  </p>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
};
