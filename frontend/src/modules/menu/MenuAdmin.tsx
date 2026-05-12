import React, { useState, useEffect } from 'react';
import { MenuItem, MenuCategory } from './types';
import { MenuCategoryList } from './components/MenuCategoryList';
import { MenuItemTable } from './components/MenuItemTable';
import { BulkActionToolbar } from './components/BulkActionToolbar';
import { useSocket } from '../../hooks/useSocket';

const CATEGORIES: (MenuCategory | string)[] = ['Hot', 'Cold', 'Pizza', 'Drinks', 'Dessert', 'Others'];
const API_BASE = `http://${window.location.hostname}:4000/api`;

export const MenuAdmin: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Hot');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { connected, on } = useSocket();

  const fetchMenu = async (category: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/menu?category=${category}`);
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch menu:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu(selectedCategory);
  }, [selectedCategory]);

  // WebSocket sync
  useEffect(() => {
    return on('menu:updated', () => fetchMenu(selectedCategory));
  }, [selectedCategory, on]);

  const updateItem = async (id: string, updates: Partial<MenuItem>) => {
    const token = localStorage.getItem('pos_token');
    try {
      const res = await fetch(`${API_BASE}/menu/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates),
      });
      
      if (!res.ok) throw new Error('Update failed');
      
      const updated = await res.json();
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...updated } : item
      ));
    } catch (error) {
      console.error('Failed to update item:', error);
      throw error;
    }
  };

  const createItem = async () => {
    const token = localStorage.getItem('pos_token');
    try {
      const res = await fetch(`${API_BASE}/menu`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: 'NEW DISH',
          price: 0,
          category: selectedCategory, // Keep casing consistent
          is_active: true,
        }),
      });
      
      if (!res.ok) throw new Error('Create failed');
      
      const created = await res.json();
      setItems(prev => [created, ...prev]);
    } catch (error) {
      console.error('Failed to create item:', error);
    }
  };

  const handleBulkAction = async (params: any) => {
    if (!window.confirm(`确定要对「${selectedCategory}」分类下的所有菜品进行此批量操作吗？`)) return;

    const token = localStorage.getItem('pos_token');
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/menu/bulk`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ category: selectedCategory, ...params }),
      });

      if (!res.ok) throw new Error('Bulk action failed');
      
      // Data will refresh via WebSocket or manual fetch
      await fetchMenu(selectedCategory);
    } catch (error) {
      console.error('Bulk action failed:', error);
      alert('批量操作失败');
    } finally {
      setLoading(false);
    }
  };

  const deactivateItem = async (id: string) => {
    if (!window.confirm('确定要下架这个菜品吗？')) return;
    
    const token = localStorage.getItem('pos_token');
    try {
      await fetch(`${API_BASE}/menu/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to deactivate item:', error);
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-8 animate-fade">
      {/* Sidebar: Categories */}
      <div className="w-64 shrink-0 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 px-2">分类目录 (Categories)</h2>
          <MenuCategoryList
            categories={CATEGORIES}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
          
          <button
            onClick={createItem}
            className="mt-8 w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95"
          >
            + 新增菜品 (ADD)
          </button>
        </div>

        <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100/50">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">💡 操作提示</p>
          <p className="text-xs text-emerald-700/70 font-medium leading-relaxed">
            点击价格可直接修改。修改后按下回车或点击空白处自动保存。
          </p>
        </div>
      </div>

      {/* Main Content: Items Table */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex justify-between items-center mb-6 px-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              {selectedCategory} <span className="text-red-600">.</span>
            </h1>
            <p className="text-sm text-slate-400 font-medium">当前分类下共有 {items.length} 个菜品</p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
               connected ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'
             }`}>
               {connected ? '● 实时同步中' : '○ 同步离线'}
             </div>
          </div>
        </div>

        <BulkActionToolbar 
          category={selectedCategory} 
          onBulkAction={handleBulkAction} 
        />

        <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
          {loading && items.length === 0 ? (
            <div className="flex-center h-64">
              <div className="w-10 h-10 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
            </div>
          ) : (
            <MenuItemTable
              items={items}
              onUpdate={updateItem}
              onDelete={deactivateItem}
            />
          )}
        </div>
      </div>
    </div>
  );
};
