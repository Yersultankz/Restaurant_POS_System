import React from 'react';
import { motion } from 'framer-motion';

interface Product {
  name: string;
  soldCount: number;
  revenue: number;
}

export const TopProductsTable = ({ products }: { products: Product[] }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
      <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
        🔥 热销菜品 (Top Selling Dishes)
        <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-1 rounded">TOP 5</span>
      </h3>
      <div className="space-y-4">
        {products.map((product, index) => (
          <motion.div
            key={product.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-transparent hover:border-red-100 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs ${
                index === 0 ? 'bg-yellow-500' :
                index === 1 ? 'bg-slate-400' :
                index === 2 ? 'bg-orange-400' :
                'bg-slate-300'
              }`}>
                {index + 1}
              </div>
              <div>
                <p className="font-black text-slate-800 group-hover:text-red-600 transition-colors">{product.name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{product.soldCount} 份 (units)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-black text-red-600">₸ {product.revenue.toLocaleString()}</p>
            </div>
          </motion.div>
        ))}
        {products.length === 0 && (
          <div className="flex-center flex-col py-12 text-slate-300">
             <span className="text-4xl mb-2">🍽️</span>
             <p className="text-sm font-bold italic">今日暂无销售数据 (No sales today)</p>
          </div>
        )}
      </div>
    </div>
  );
};
