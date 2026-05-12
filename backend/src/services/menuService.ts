import { PrismaClient } from '@prisma/client';

type MenuItemInput = {
  name?: string;
  price?: number;
  category?: string;
  emoji?: string;
  is_active?: boolean;
};

type BulkMenuUpdateInput = {
  category?: string;
  priceMultiplier?: number;
  priceAdder?: number;
  is_active?: boolean;
};

export class MenuBusinessError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export class MenuService {
  constructor(private prisma: PrismaClient) {}

  getMenuItems(category?: string) {
    let where = {};

    if (category === 'Others') {
      where = {
        category: {
          notIn: ['Hot', 'Cold', 'Pizza', 'Drinks', 'Dessert'],
        },
      };
    } else if (category) {
      where = { category };
    }

    return this.prisma.menuItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  createMenuItem(input: MenuItemInput) {
    const { name, price, category, emoji, is_active = true } = input;

    if (!name || price === undefined || !category) {
      throw new MenuBusinessError('MISSING_FIELDS', 'Name, price, and category are required');
    }

    return this.prisma.menuItem.create({
      data: {
        name: String(name).trim(),
        price: Number(price),
        category: String(category),
        emoji: String(emoji || 'plate'),
        is_active: Boolean(is_active),
      },
    });
  }

  updateMenuItem(id: string, updates: Record<string, unknown>) {
    const allowedUpdates = ['name', 'price', 'category', 'is_active', 'emoji'];
    const data: any = {};

    Object.keys(updates).forEach((key) => {
      if (!allowedUpdates.includes(key)) return;
      if (key === 'price') data[key] = Number(updates[key]);
      else if (key === 'is_active') data[key] = Boolean(updates[key]);
      else data[key] = updates[key];
    });

    if (Object.keys(data).length === 0) {
      throw new MenuBusinessError('NO_UPDATES', 'No valid fields provided for update');
    }

    return this.prisma.menuItem.update({
      where: { id },
      data,
    });
  }

  async deleteMenuItem(id: string) {
    const item = await this.prisma.menuItem.delete({
      where: { id },
    });

    return { message: 'Item deleted permanently', item };
  }

  async bulkUpdate(input: BulkMenuUpdateInput) {
    const { category, priceMultiplier, priceAdder, is_active } = input;

    if (!category) {
      throw new MenuBusinessError('CATEGORY_REQUIRED', 'Category is required for bulk actions');
    }

    const items = await this.prisma.menuItem.findMany({
      where: { category: String(category) },
    });

    const updates = items.map((item) => {
      let newPrice = item.price;
      if (priceMultiplier !== undefined) newPrice *= Number(priceMultiplier);
      if (priceAdder !== undefined) newPrice += Number(priceAdder);

      const data: any = { price: Math.round(newPrice) };
      if (is_active !== undefined) data.is_active = Boolean(is_active);

      return this.prisma.menuItem.update({
        where: { id: item.id },
        data,
      });
    });

    await this.prisma.$transaction(updates);

    return { message: `Successfully updated ${items.length} items` };
  }
}
