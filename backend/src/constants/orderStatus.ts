export const ORDER_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  READY: 'ready',
  DELIVERED: 'delivered',
  PAID: 'paid',
  WASTED: 'wasted',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export function isOrderStatus(value: any): value is OrderStatus {
  return Object.values(ORDER_STATUS).includes(value);
}

export const ORDER_ITEM_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  READY: 'ready',
  SERVED: 'served',
  WASTED: 'wasted',
} as const;

export type OrderItemStatus = typeof ORDER_ITEM_STATUS[keyof typeof ORDER_ITEM_STATUS];

export function isOrderItemStatus(value: any): value is OrderItemStatus {
  return Object.values(ORDER_ITEM_STATUS).includes(value);
}

export const ORDER_EVENT_TYPE = {
  ORDER_SENT: 'ORDER_SENT',
  ITEM_READY: 'ITEM_READY',
  ITEM_SERVED: 'ITEM_SERVED',
  ORDER_PAID: 'ORDER_PAID',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  ORDER_WASTED: 'ORDER_WASTED',
} as const;

export type OrderEventType = typeof ORDER_EVENT_TYPE[keyof typeof ORDER_EVENT_TYPE];

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [ORDER_STATUS.DRAFT]: [ORDER_STATUS.SENT, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SENT]: [ORDER_STATUS.READY, ORDER_STATUS.WASTED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.READY]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.WASTED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.PAID, ORDER_STATUS.WASTED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PAID]: [],
  [ORDER_STATUS.WASTED]: [],
  [ORDER_STATUS.CANCELLED]: [],
};

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  ORDER_STATUS.DRAFT,
  ORDER_STATUS.SENT,
  ORDER_STATUS.READY,
  ORDER_STATUS.DELIVERED,
];

export const BILLABLE_ORDER_STATUSES: OrderStatus[] = [
  ORDER_STATUS.READY,
  ORDER_STATUS.DELIVERED,
];

export const KITCHEN_VISIBLE_STATUSES: OrderStatus[] = [
  ORDER_STATUS.SENT,
  ORDER_STATUS.READY,
];

export const TERMINAL_ORDER_STATUSES: OrderStatus[] = [
  ORDER_STATUS.PAID,
  ORDER_STATUS.WASTED,
  ORDER_STATUS.CANCELLED,
];
