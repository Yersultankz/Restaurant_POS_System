import { PrismaClient } from '@prisma/client';
import { 
  ORDER_STATUS, 
  OrderStatus, 
  ORDER_STATUS_TRANSITIONS,
  TERMINAL_ORDER_STATUSES,
  ORDER_ITEM_STATUS,
  ORDER_EVENT_TYPE
} from '../constants/orderStatus';

export type { OrderStatus };

const VALID_TRANSITIONS = ORDER_STATUS_TRANSITIONS;

type CreateOrderItemInput = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  emoji?: string;
};

type CreateOrderInput = {
  displayId?: string;
  type?: string;
  tableId?: number | null;
  customerName?: string | null;
  items?: CreateOrderItemInput[];
};

type RecordPaymentInput = {
  method: string;
  amount: number;
  tableId?: number | null;
};

export class BusinessError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export class OrderService {
  constructor(private prisma: PrismaClient) {}

  getOrders(limit = 50, offset = 0) {
    return this.prisma.order.findMany({
      include: { items: true, payments: true, events: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async createOrder(input: CreateOrderInput) {
    const { displayId, type, tableId, customerName, items } = input;

    if (!items || items.length === 0) {
      throw new BusinessError('EMPTY_ORDER', 'Order items are required');
    }

    if (displayId) {
      const existingOrder = await this.prisma.order.findUnique({
        where: { displayId },
        include: { items: true, payments: true, events: true },
      });

      if (existingOrder) return existingOrder;
    }

    const total = this.calculateTotal(items);

    return this.prisma.order.create({
      data: {
        displayId: displayId || `ORD-${Date.now()}`,
        type: type || 'dine-in',
        tableId: tableId ?? null,
        customerName: customerName ?? null,
        status: ORDER_STATUS.SENT,
        total,
        items: {
          create: items.map((item) => ({
            productId: String(item.productId),
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            category: item.category || 'Hot',
            emoji: item.emoji || 'plate',
            status: ORDER_ITEM_STATUS.SENT,
          })),
        },
        events: {
          create: [{
            tableId: tableId ?? null,
            type: ORDER_EVENT_TYPE.ORDER_SENT,
            details: 'Order sent to kitchen',
          }],
        },
      },
      include: { items: true, payments: true, events: true },
    });
  }

  private deriveOrderStatus(items: { status: string }[]): OrderStatus {
    if (items.length === 0) return ORDER_STATUS.DRAFT;
    const hasSent = items.some((item) => item.status === ORDER_ITEM_STATUS.SENT);
    const hasReady = items.some((item) => item.status === ORDER_ITEM_STATUS.READY);
    const hasServed = items.some((item) => item.status === ORDER_ITEM_STATUS.SERVED);

    if (hasSent) return ORDER_STATUS.SENT;
    if (hasReady || hasServed) return ORDER_STATUS.READY;
    return ORDER_STATUS.SENT;
  }

  async addOrderItems(orderId: string, items: CreateOrderItemInput[]) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new BusinessError('NOT_FOUND', 'Order not found', 404);
    }

    if (TERMINAL_ORDER_STATUSES.includes(order.status as OrderStatus)) {
      throw new BusinessError('ORDER_CLOSED', 'Cannot add items to a closed order');
    }

    const createdItems = items.map((item) => ({
      orderId,
      productId: String(item.productId),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      category: item.category || 'Hot',
      emoji: item.emoji || 'plate',
      status: ORDER_ITEM_STATUS.SENT,
    }));

    await this.prisma.orderItem.createMany({ data: createdItems });

    const total = order.total + this.calculateTotal(items);
    const status = order.status === ORDER_STATUS.READY ? ORDER_STATUS.SENT : order.status as OrderStatus;

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        total,
        status,
        version: { increment: 1 },
      },
      include: { items: true, payments: true, events: true },
    });
  }

  async deleteOrderItem(orderId: string, itemId: string) {
    const item = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.orderId !== orderId) {
      throw new BusinessError('NOT_FOUND', 'Order item not found', 404);
    }

    const remainingItems = await this.prisma.orderItem.findMany({
      where: { orderId, id: { not: itemId } },
    });

    const status = remainingItems.length === 0
      ? ORDER_STATUS.DRAFT
      : this.deriveOrderStatus(remainingItems);

    const total = remainingItems.reduce((sum, remaining) => sum + remaining.price * remaining.quantity, 0);

    await this.prisma.$transaction([
      this.prisma.orderItem.delete({ where: { id: itemId } }),
      this.prisma.order.update({
        where: { id: orderId },
        data: {
          total,
          status,
          version: { increment: 1 },
        },
      }),
    ]);

    return item;
  }

  async updateStatus(id: string, status: OrderStatus, version?: number) {
    const currentOrder = await this.prisma.order.findUnique({ where: { id } });
    if (!currentOrder) {
      throw new BusinessError('NOT_FOUND', 'Order not found', 404);
    }

    if (version !== undefined && version !== currentOrder.version) {
      throw new BusinessError('CONFLICT', 'Order version mismatch. Please refresh.', 409);
    }

    this.assertValidTransition(currentOrder.status as OrderStatus, status);

    if (status === ORDER_STATUS.READY) {
      await this.prisma.orderItem.updateMany({
        where: { orderId: id, status: ORDER_ITEM_STATUS.SENT },
        data: { status: ORDER_ITEM_STATUS.READY },
      });
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        status,
        version: { increment: 1 },
      },
      include: { items: true, payments: true, events: true },
    });
  }

  async recordPayment(orderId: string, input: RecordPaymentInput) {
    const { method, amount, tableId } = input;

    const [payment, order] = await this.prisma.$transaction([
      this.prisma.payment.create({
        data: { orderId, method, amount, tableId: tableId ?? null },
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: ORDER_STATUS.PAID },
        include: { items: true, payments: true, events: true },
      }),
    ]);

    return { payment, order };
  }

  async updateItemStatus(orderId: string, itemId: string, status: string) {
    const orderItem = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: { status },
    });

    const allItems = await this.prisma.orderItem.findMany({
      where: { orderId },
    });

    const allReady = allItems.every((item) => item.status === ORDER_ITEM_STATUS.READY || item.status === ORDER_ITEM_STATUS.SERVED);
    const currentOrder = await this.prisma.order.findUnique({ where: { id: orderId } });
    const orderUpdateData: any = { version: { increment: 1 } };

    if (allReady && currentOrder?.status === ORDER_STATUS.SENT) {
      orderUpdateData.status = ORDER_STATUS.READY;
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: orderUpdateData,
    });

    return orderItem;
  }

  private calculateTotal(items: CreateOrderItemInput[]) {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  private assertValidTransition(current: OrderStatus, next: OrderStatus) {
    if (!VALID_TRANSITIONS[current]?.includes(next)) {
      throw new BusinessError('INVALID_TRANSITION', `Cannot move to ${next}`);
    }
  }
}
