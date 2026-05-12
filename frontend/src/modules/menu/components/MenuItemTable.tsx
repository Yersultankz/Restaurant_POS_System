import React, { useState } from 'react';
import { MenuItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  items: MenuItem[];
  onUpdate: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const MenuItemTable = ({ items, onUpdate, onDelete }: Props) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const saveEdit = async (id: string, value: string) => {
    const newPrice = parseFloat(value);
    if (isNaN(newPrice) || newPrice < 0) {
      alert('请输入有效价格');
      return;
    }
    
    try {
      await onUpdate(id, { price: newPrice });
      setEditingId(null);
    } catch (error) {
      alert('保存失败');
    }
  };

  const toggleActive = async (item: MenuItem) => {
    try {
      await onUpdate(item.id, { is_active: !item.is_active });
    } catch (error) {
      alert('操作失败');
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center text-slate-300 border-2 border-dashed border-slate-100 animate-fade">
        <span className="text-6xl mb-4 block">🍽️</span>
        <p className="font-black uppercase tracking-widest">暂无菜品，点击左侧「+ 新增菜品」</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden animate-fade">
      <table className="w-full text-left">
        <thead className="bg-slate-50/50 border-b border-slate-100">
          <tr>
            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">菜品名称 (Dish)</th>
            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">分类 (Category)</th>
            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">价格 (Price)</th>
            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">状态 (Status)</th>
            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">操作 (Action)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          <AnimatePresence mode="popLayout">
            {items.map((item, index) => (
              <motion.tr
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
                className={`hover:bg-slate-50/50 transition-colors ${!item.is_active ? 'opacity-50' : ''}`}
              >
                <td className="px-6 py-5">
                  {editingId === `${item.id}-name` ? (
                    <input
                      type="text"
                      defaultValue={item.name}
                      onBlur={(e) => {
                        onUpdate(item.id, { name: e.target.value });
                        setEditingId(null);
                      }}
                      onKeyDown={(e: any) => {
                        if (e.key === 'Enter') {
                          onUpdate(item.id, { name: e.target.value });
                          setEditingId(null);
                        }
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="w-full px-3 py-1.5 border-2 border-slate-200 rounded-xl font-black text-slate-800 outline-none focus:border-red-600 transition-all"
                    />
                  ) : (
                    <span 
                      className="font-black text-slate-800 text-base cursor-pointer hover:text-red-600 transition-colors"
                      onClick={() => setEditingId(`${item.id}-name`)}
                    >
                      {item.name}
                    </span>
                  )}
                </td>

                <td className="px-6 py-5">
                   <select
                     value={['Hot', 'Cold', 'Pizza', 'Drinks', 'Dessert'].includes(item.category) ? item.category : 'Others'}
                     onChange={(e) => onUpdate(item.id, { category: e.target.value })}
                     className="w-full bg-slate-50 border-none rounded-lg px-2 py-1 text-xs font-black text-slate-600 outline-none focus:ring-2 ring-red-100 transition-all cursor-pointer"
                   >
                     <option value="Hot">🔥 HOT</option>
                     <option value="Cold">🥗 COLD</option>
                     <option value="Pizza">🍕 PIZZA</option>
                     <option value="Drinks">🥤 DRINKS</option>
                     <option value="Dessert">🍰 DESSERT</option>
                     <option value="Others" disabled>❓ OTHERS</option>
                   </select>
                </td>

                <td className="px-6 py-5 text-right">
                  {editingId === `${item.id}-price` ? (
                    <input
                      type="number"
                      defaultValue={item.price}
                      onBlur={(e) => {
                        saveEdit(item.id, e.target.value);
                      }}
                      onKeyDown={(e: any) => {
                        if (e.key === 'Enter') {
                          saveEdit(item.id, e.target.value);
                        }
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="w-24 px-3 py-1.5 border-2 border-red-200 rounded-xl text-right font-black text-red-600 outline-none focus:border-red-600 transition-all"
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(`${item.id}-price`);
                        setEditValue(String(item.price));
                      }}
                      className="text-right font-black text-slate-800 hover:text-red-600 transition-colors cursor-pointer text-lg tracking-tighter"
                    >
                      ₸{item.price.toLocaleString()}
                    </button>
                  )}
                </td>

                <td className="px-6 py-5">
                  <div className="flex justify-center">
                    <button
                      onClick={() => toggleActive(item)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
                        item.is_active ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          item.is_active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </td>

                <td className="px-6 py-5 text-right">
                  <button
                    onClick={() => onDelete(item.id)}
                    className="text-xs font-black text-red-300 hover:text-red-600 transition-colors uppercase tracking-widest"
                  >
                    删除 (DELETE)
                  </button>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
};
