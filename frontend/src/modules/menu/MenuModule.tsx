import React, { useState, useEffect } from 'react';
import { CONFIG } from '../../config';
import { useNotify } from '../../context/NotificationContext';

interface Product {
  id: string | number;
  name_ru: string;
  name_kz: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
}

const CATS = ["All", "Salads", "Pizza", "Soups", "Main", "Drinks", "Desserts"];
const CICO: Record<string, string> = { All: "🍽️", Salads: "🥗", Pizza: "🍕", Soups: "🍲", Main: "🥩", Drinks: "🥤", Desserts: "🍰" };
const CC: Record<string, string> = { Salads: "#10b981", Pizza: "#f59e0b", Soups: "#3b82f6", Main: "#8b5cf6", Drinks: "#0ea5e9", Desserts: "#ec4899", All: "#D32F2F" };

export const MenuModule: React.FC<{ onAddToCart: (product: any) => void; locked?: boolean }> = ({ onAddToCart, locked }) => {
  const [lang, setLang] = useState<'RU' | 'KZ'>('RU');
  const [selectedCat, setSelectedCat] = useState('All');
  const [products, setProducts] = useState<Product[]>([]);
  const { notify } = useNotify();

  useEffect(() => {
    fetch(`${CONFIG.API_BASE}/menu`)
      .then(res => res.json())
      .then(data => {
        const mapped = data.filter((d: any) => d.is_active).map((d: any) => ({
          id: d.id,
          name_ru: d.name,
          name_kz: d.name,
          description: d.description || 'Delicious freshly prepared dish.',
          price: d.price,
          category: d.category.charAt(0).toUpperCase() + d.category.slice(1),
          image: d.emoji || '🍽️',
          available: d.is_active
        }));
        setProducts(mapped);
      })
      .catch((err) => {
        console.error(err);
        setProducts([]);
        notify('Network Error: Failed to load menu products.', 'error');
      });
  }, [notify]);

  return (
    <div className="space-y-8 animate-fade pb-10">
      {/* Category Pills - Improved layout but in original RED theme */}
      <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {CATS.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-5 py-2.5 rounded-xl text-[11px] font-black transition-all flex items-center gap-3 border-2 ${
                selectedCat === cat 
                  ? 'text-white border-red-600 bg-red-600 shadow-md shadow-red-100' 
                  : 'text-slate-400 bg-transparent border-transparent hover:bg-slate-50'
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex-center text-sm ${selectedCat === cat ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {CICO[cat]}
              </div>
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
        
        <div className="hidden lg:flex items-center bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 w-64 ml-4">
          <span className="mr-2 opacity-40">🔍</span>
          <input disabled placeholder="Search menu..." className="bg-transparent text-xs text-slate-400 outline-none w-full" />
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl ml-4 shrink-0">
          {(['RU', 'KZ'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                lang === l ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {products.filter(p => selectedCat === 'All' || p.category === selectedCat).map(product => (
          <div key={product.id} className="bg-white rounded-[1.8rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col">
            <div className="p-3">
              <div 
                className="h-44 rounded-2xl flex-center text-6xl group-hover:scale-105 transition-transform duration-700 overflow-hidden relative"
                style={{ background: (CC[product.category] || '#D32F2F') + '08' }}
              >
                {product.image.startsWith('http') || product.image.startsWith('/') ? (
                  <img src={product.image} alt={product.name_ru} className="w-full h-full object-cover" />
                ) : (
                  <span className="drop-shadow-lg">{product.image}</span>
                )}
                {!product.available && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex-center">
                    <span className="px-3 py-1 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                      Sold Out
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 pt-2 flex-1 flex flex-col">
              <div className="mb-4 flex-1">
                <div className="flex justify-between items-center mb-2">
                  <span 
                    className="text-[9px] font-black px-2 py-0.5 rounded uppercase"
                    style={{ color: CC[product.category] || '#D32F2F', background: (CC[product.category] || '#D32F2F') + '15' }}
                  >
                    {product.category}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 leading-tight text-base mb-1 tracking-tight">
                  {lang === 'RU' ? product.name_ru : product.name_kz}
                </h3>
                <p className="text-[11px] leading-relaxed text-slate-400 font-medium line-clamp-2">
                  {(product as any).description}
                </p>
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-xl font-black text-slate-900 tracking-tighter">
                  {(product.price).toLocaleString()} ₸
                </span>
                
                <button 
                  disabled={locked || !product.available}
                  onClick={() => onAddToCart({ ...product, name_ru: lang === 'RU' ? product.name_ru : product.name_kz })}
                  className="w-16 h-16 text-white rounded-full flex-center transition-all duration-300 active:scale-90 disabled:opacity-30 hover:scale-105"
                  style={{ 
                    background: CC[product.category] || '#D32F2F', 
                    boxShadow: `0 12px 30px ${(CC[product.category] || '#D32F2F')}50` 
                  }}
                  data-testid="add-to-cart"
                >
                  <span className="text-3xl">🛒</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        
        {products.length === 0 && (
          <div className="col-span-full flex flex-col items-center py-32 text-slate-600 opacity-20">
            <span className="text-8xl mb-4">🍽️</span>
            <p className="text-xl font-black italic">Menu is currently empty...</p>
          </div>
        )}
      </div>
    </div>
  );
};
