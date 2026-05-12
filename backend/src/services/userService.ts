import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const getSecret = () => process.env.JWT_SECRET || 'habicafe_secret_key_2026_pos_system_secure_v1';

type CreateUserInput = {
  role?: string;
  name?: string;
  pin?: string;
  emoji?: string;
};

export class UserBusinessError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export class UserService {
  constructor(private prisma: PrismaClient) {}

  listUsers() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, role: true, emoji: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createUser(input: CreateUserInput) {
    const { role, name, pin, emoji } = input;

    if (!role || !name || !pin) {
      throw new UserBusinessError('MISSING_FIELDS', 'Role, name, and pin are required');
    }

    const passwordHash = await bcrypt.hash(pin, 10);
    const user = await this.prisma.user.create({
      data: {
        role,
        name,
        passwordHash,
        emoji: emoji || 'person',
      },
    });

    return this.withoutPasswordHash(user);
  }

  async login(id?: string, pin?: string) {
    if (!id || !pin) {
      throw new UserBusinessError('MISSING_FIELDS', 'User id and PIN are required', 401);
    }

    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new UserBusinessError('USER_NOT_FOUND', 'User not found', 401);
    }

    if (!user.passwordHash) {
      throw new UserBusinessError('UNSET_PIN', 'User PIN has not been set for this account', 401);
    }

    const isValid = await bcrypt.compare(pin, user.passwordHash);
    if (!isValid) {
      throw new UserBusinessError('INVALID_PIN', 'Invalid PIN', 401);
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      getSecret(),
      { expiresIn: '24h' },
    );

    return {
      user: this.withoutPasswordHash(user),
      token,
    };
  }

  async verifyPin(authHeader: string | undefined, pin?: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UserBusinessError('UNAUTHORIZED', 'Unauthorized', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getSecret()) as any;
    const user = await this.prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user || !user.passwordHash || !pin) {
      throw new UserBusinessError('UNAUTHORIZED', 'Unauthorized', 401);
    }

    const isValid = await bcrypt.compare(pin, user.passwordHash);
    if (!isValid) {
      throw new UserBusinessError('INVALID_PIN', 'Invalid PIN', 401);
    }

    return { success: true, valid: true };
  }

  async deleteUser(id: string) {
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  private withoutPasswordHash<T extends { passwordHash?: string | null }>(user: T) {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
