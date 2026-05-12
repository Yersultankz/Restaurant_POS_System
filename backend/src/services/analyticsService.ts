import { PrismaClient } from '@prisma/client';
import { ORDER_STATUS } from '../constants/orderStatus';

export class AnalyticsService {
  constructor(private prisma: PrismaClient) {}

  async getDashboardMetrics() {
    const today = this.startOfToday();
    const todayOrders = await this.getPaidOrdersSince(today, true);

    const totalRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = todayOrders.length;
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const kaspiOrders = todayOrders.filter((order) =>
      order.payments.some((payment: { method: string }) => payment.method.toLowerCase() === 'kaspi'),
    ).length;
    const kaspiRate = totalOrders > 0 ? (kaspiOrders / totalOrders) * 100 : 0;

    const tableTurnover: Record<number, number> = {};
    todayOrders.forEach((order) => {
      if (order.tableId) {
        tableTurnover[order.tableId] = (tableTurnover[order.tableId] || 0) + 1;
      }
    });

    const uniqueTables = Object.keys(tableTurnover).length;
    const avgTurnover = uniqueTables > 0 ? totalOrders / uniqueTables : 0;

    const productSales: Record<string, { count: number; revenue: number }> = {};
    todayOrders.forEach((order) => {
      order.items.forEach((item: { name: string; quantity: number; price: number }) => {
        if (!productSales[item.name]) {
          productSales[item.name] = { count: 0, revenue: 0 };
        }
        productSales[item.name].count += item.quantity;
        productSales[item.name].revenue += item.price * item.quantity;
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([name, data]) => ({
        name,
        soldCount: data.count,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.soldCount - a.soldCount)
      .slice(0, 5);

    const hourStats: Record<number, number> = {};
    todayOrders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      hourStats[hour] = (hourStats[hour] || 0) + order.total;
    });

    const peakHour = Object.entries(hourStats)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 12;

    return {
      todayRevenue: totalRevenue,
      todayOrders: totalOrders,
      avgTicket: Math.round(avgTicket),
      kaspiRate: Math.round(kaspiRate * 10) / 10,
      avgTableTurnover: Math.round(avgTurnover * 10) / 10,
      peakHour: `${peakHour}:00-${Number(peakHour) + 1}:00`,
      topProducts,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getRevenueTrend() {
    const today = this.startOfToday();
    const orders = await this.getPaidOrdersSince(today, false);
    const hourlyData: Array<{ hour: number; revenue: number; orders: number }> = [];

    for (let hour = 0; hour < 24; hour += 1) {
      const hourOrders = orders.filter((order) => {
        const orderHour = new Date(order.createdAt).getHours();
        return orderHour === hour;
      });

      hourlyData.push({
        hour,
        revenue: hourOrders.reduce((sum, order) => sum + order.total, 0),
        orders: hourOrders.length,
      });
    }

    const filteredData = hourlyData.filter((row) => row.orders > 0 || row.revenue > 0);

    return {
      period: 'hourly',
      data: filteredData.map((row) => ({
        timestamp: new Date(today.getTime() + row.hour * 60 * 60 * 1000).toISOString(),
        revenue: row.revenue,
        orderCount: row.orders,
        avgTicket: row.orders > 0 ? row.revenue / row.orders : 0,
      })),
    };
  }

  private startOfToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private getPaidOrdersSince(date: Date, includeRelations: true): Promise<Array<any>>;
  private getPaidOrdersSince(date: Date, includeRelations: false): Promise<Array<any>>;
  private getPaidOrdersSince(date: Date, includeRelations: boolean) {
    return this.prisma.order.findMany({
      where: {
        createdAt: { gte: date },
        status: ORDER_STATUS.PAID,
      },
      include: includeRelations ? { items: true, payments: true } : undefined,
    });
  }
}
