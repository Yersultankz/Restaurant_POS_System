import { ValidationSchema } from '../middleware/validate.middleware';

function assertObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    throw new Error('Expected an object');
  }
  return value as Record<string, unknown>;
}

function assertName(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}

function assertPrice(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error('price must be a non-negative number');
  }
  return value;
}

function optionalBoolean(value: unknown, field: string) {
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') throw new Error(`${field} must be a boolean`);
  return value;
}

function optionalNumber(value: unknown, field: string) {
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${field} must be a number`);
  }
  return value;
}

export const createMenuItemSchema: ValidationSchema<{
  name: string;
  price: number;
  category: string;
  emoji?: string;
  is_active?: boolean;
}> = {
  parse(value) {
    const data = assertObject(value);
    if (data.emoji !== undefined && typeof data.emoji !== 'string') {
      throw new Error('emoji must be a string');
    }

    return {
      name: assertName(data.name, 'name'),
      price: assertPrice(data.price),
      category: assertName(data.category, 'category'),
      emoji: data.emoji?.trim(),
      is_active: optionalBoolean(data.is_active, 'is_active'),
    };
  },
};

export const updateMenuItemSchema: ValidationSchema<Record<string, unknown>> = {
  parse(value) {
    const data = assertObject(value);
    const output: Record<string, unknown> = {};

    if (data.name !== undefined) output.name = assertName(data.name, 'name');
    if (data.price !== undefined) output.price = assertPrice(data.price);
    if (data.category !== undefined) output.category = assertName(data.category, 'category');
    if (data.emoji !== undefined) {
      if (typeof data.emoji !== 'string') throw new Error('emoji must be a string');
      output.emoji = data.emoji.trim();
    }
    if (data.is_active !== undefined) output.is_active = optionalBoolean(data.is_active, 'is_active');

    if (Object.keys(output).length === 0) {
      throw new Error('No valid fields provided for update');
    }

    return output;
  },
};

export const bulkMenuUpdateSchema: ValidationSchema<{
  category: string;
  priceMultiplier?: number;
  priceAdder?: number;
  is_active?: boolean;
}> = {
  parse(value) {
    const data = assertObject(value);
    return {
      category: assertName(data.category, 'category'),
      priceMultiplier: optionalNumber(data.priceMultiplier, 'priceMultiplier'),
      priceAdder: optionalNumber(data.priceAdder, 'priceAdder'),
      is_active: optionalBoolean(data.is_active, 'is_active'),
    };
  },
};
