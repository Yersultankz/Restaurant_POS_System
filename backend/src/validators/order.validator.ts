import { ValidationSchema } from '../middleware/validate.middleware';
import { 
  ORDER_STATUS, 
  ORDER_ITEM_STATUS, 
  OrderStatus, 
  OrderItemStatus,
  isOrderStatus,
  isOrderItemStatus
} from '../constants/orderStatus';

const orderTypes = ['dine-in', 'takeaway'] as string[];
const paymentMethods = ['Cash', 'Kaspi'] as string[];

type CreateOrderItemInput = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  emoji?: string;
};

function assertObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    throw new Error('Expected an object');
  }
  return value as Record<string, unknown>;
}

function optionalString(value: unknown, field: string) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw new Error(`${field} must be a string`);
  return value.trim();
}

function optionalNumberOrNull(value: unknown, field: string) {
  if (value === undefined || value === null || value === '') return null;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof num !== 'number' || !Number.isFinite(num)) {
    throw new Error(`${field} must be a valid number, got ${typeof value}`);
  }
  return num;
}

function assertPositiveNumber(value: unknown, field: string) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof num !== 'number' || !Number.isFinite(num) || num < 0) {
    throw new Error(`${field} must be a non-negative number`);
  }
  return num;
}

function parseOrderItem(value: unknown): CreateOrderItemInput {
  const item = assertObject(value);
  const rawProductId = item.productId;
  let productId: string;

  if (rawProductId !== undefined && rawProductId !== null) {
    productId = String(rawProductId).trim();
  } else {
    throw new Error('Item productId is missing');
  }

  if (typeof item.name !== 'string' || item.name.trim().length === 0) {
    throw new Error('Item name is required');
  }
  const rawQuantity = item.quantity;
  const quantity = typeof rawQuantity === 'string' ? parseInt(rawQuantity, 10) : rawQuantity;

  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
    throw new Error('[DEBUG] Item quantity must be a positive integer');
  }

  return {
    productId,
    name: item.name.trim(),
    price: assertPositiveNumber(item.price, 'Item price'),
    quantity: quantity,
    category: optionalString(item.category, 'Item category'),
    emoji: optionalString(item.emoji, 'Item emoji'),
  };
}

export const createOrderSchema: ValidationSchema<{
  displayId?: string;
  type?: string;
  tableId?: number | null;
  customerName?: string | null;
  items: CreateOrderItemInput[];
}> = {
  parse(value) {
    const data = assertObject(value);
    const type = optionalString(data.type, 'type');

    if (type && !orderTypes.includes(type)) {
      throw new Error('Invalid order type');
    }
    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new Error('Order items are required');
    }

    return {
      displayId: optionalString(data.displayId, 'displayId'),
      type,
      tableId: optionalNumberOrNull(data.tableId, 'tableId'),
      customerName: optionalString(data.customerName, 'customerName') || null,
      items: data.items.map(parseOrderItem),
    };
  },
};

export const updateOrderStatusSchema: ValidationSchema<{ status: OrderStatus; version?: number }> = {
  parse(value) {
    const data = assertObject(value);
    if (!isOrderStatus(data.status)) {
      throw new Error('Invalid order status');
    }
    if (data.version !== undefined && (!Number.isInteger(data.version) || (data.version as number) < 0)) {
      throw new Error('version must be a non-negative integer');
    }

    return {
      status: data.status,
      version: data.version as number | undefined,
    };
  },
};

export const addOrderItemsSchema: ValidationSchema<{ items: CreateOrderItemInput[] }> = {
  parse(value) {
    const data = assertObject(value);
    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new Error('Order items are required');
    }

    return {
      items: data.items.map(parseOrderItem),
    };
  },
};

export const recordPaymentSchema: ValidationSchema<{ method: string; amount: number; tableId?: number | null }> = {
  parse(value) {
    const data = assertObject(value);
    if (typeof data.method !== 'string' || !paymentMethods.includes(data.method)) {
      throw new Error('Invalid payment method');
    }

    return {
      method: data.method,
      amount: assertPositiveNumber(data.amount, 'amount'),
      tableId: optionalNumberOrNull(data.tableId, 'tableId'),
    };
  },
};

export const updateOrderItemStatusSchema: ValidationSchema<{ status: OrderItemStatus }> = {
  parse(value) {
    const data = assertObject(value);
    if (!isOrderItemStatus(data.status)) {
      throw new Error('Invalid item status');
    }

    return { status: data.status };
  },
};
