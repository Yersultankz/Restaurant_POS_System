import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  category: string;
  onBulkAction: (params: { priceMultiplier?: number; priceAdder?: number; is_active?: boolean }) => Promise<void>;
}

export const BulkActionToolbar = ({ category, onBulkAction }: Props) => {
  const [multiplier, setMultiplier] = React.useState('0.9');
  const [adder, setAdder] = React.useState('200');

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900 rounded-[2rem] p-5 flex flex-wrap items-center justify-between shadow-2xl border border-slate-800 mb-8 gap-6"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex-center text-white text-xl shadow-lg shadow-red-900/20">
          ⚡
        </div>
        <div>
          <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-0.5">批量操作中心 / BATCH ACTION</p>
          <p className="text-sm text-white font-black">正在管理「{category}」分类</p>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-4">
        {/* Discount Section */}
        <div className="flex items-center bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
          <input 
            type="number" 
            step="0.1"
            value={multiplier}
            onChange={(e) => setMultiplier(e.target.value)}
            className="w-16 bg-transparent text-white font-black text-center outline-none border-r border-slate-700"
            placeholder="0.9"
          />
          <button
            onClick={() => onBulkAction({ priceMultiplier: parseFloat(multiplier) })}
            className="px-4 py-2 hover:bg-red-600 text-white text-[10px] font-black rounded-xl transition-all"
          >
            打折 (PROMO)
          </button>
        </div>

        {/* Price Adder Section */}
        <div className="flex items-center bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
          <input 
            type="number" 
            value={adder}
            onChange={(e) => setAdder(e.target.value)}
            className="w-20 bg-transparent text-white font-black text-center outline-none border-r border-slate-700"
            placeholder="200"
          />
          <button
            onClick={() => onBulkAction({ priceAdder: parseFloat(adder) })}
            className="px-4 py-2 hover:bg-emerald-600 text-white text-[10px] font-black rounded-xl transition-all"
          >
            调价 (PRICE +)
          </button>
        </div>

        {/* Toggle Buttons */}
        <div className="flex gap-1 bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
          <button
            onClick={() => onBulkAction({ is_active: false })}
            className="px-4 py-2 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] font-black rounded-xl transition-all"
          >
            一键下架
          </button>
          <button
            onClick={() => onBulkAction({ is_active: true })}
            className="px-4 py-2 bg-slate-700 text-white text-[10px] font-black rounded-xl transition-all hover:bg-emerald-600 shadow-lg"
          >
            一键上架
          </button>
        </div>
      </div>
    </motion.div>
  );
};
