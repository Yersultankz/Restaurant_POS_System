import { ValidationSchema } from '../middleware/validate.middleware';

const roles = ['boss', 'admin', 'waiter', 'chef', 'cashier'];

function assertObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    throw new Error('Expected an object');
  }
  return value as Record<string, unknown>;
}

function assertPin(value: unknown) {
  if (typeof value !== 'string' || value.trim().length < 4) {
    throw new Error('PIN must be at least 4 characters');
  }
  return value.trim();
}

export const loginSchema: ValidationSchema<{ id: string; pin: string }> = {
  parse(value) {
    const data = assertObject(value);
    if (typeof data.id !== 'string' || data.id.trim().length === 0) {
      throw new Error('User id is required');
    }

    return {
      id: data.id.trim(),
      pin: assertPin(data.pin),
    };
  },
};

export const verifyPinSchema: ValidationSchema<{ pin: string }> = {
  parse(value) {
    const data = assertObject(value);
    return {
      pin: assertPin(data.pin),
    };
  },
};

export const createUserSchema: ValidationSchema<{
  role: string;
  name: string;
  pin: string;
  emoji?: string;
}> = {
  parse(value) {
    const data = assertObject(value);

    if (typeof data.role !== 'string' || !roles.includes(data.role)) {
      throw new Error('Invalid role');
    }
    if (typeof data.name !== 'string' || data.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters');
    }
    if (data.emoji !== undefined && typeof data.emoji !== 'string') {
      throw new Error('Emoji must be a string');
    }

    return {
      role: data.role,
      name: data.name.trim(),
      pin: assertPin(data.pin),
      emoji: data.emoji?.trim(),
    };
  },
};
