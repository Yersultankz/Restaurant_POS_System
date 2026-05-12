export type MenuCategory = 'Hot' | 'Cold' | 'Pizza' | 'Drinks' | 'Dessert';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: MenuCategory | string;
  is_active: boolean;
  createdAt: string;
}
