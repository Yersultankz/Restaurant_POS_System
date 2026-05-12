import React from 'react';
import { MenuCategory } from '../types';
import { motion } from 'framer-motion';

interface Props {
  categories: (MenuCategory | string)[];
  selected: string;
  onSelect: (category: any) => void;
}

export const MenuCategoryList = ({ categories, selected, onSelect }: Props) => {
  return (
    <div className="space-y-2">
      {categories.map((category, index) => (
        <motion.button
          key={category}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelect(category)}
          className={`w-full text-left px-4 py-3 rounded-xl text-sm font-black transition-all border-2 ${
            selected === category
              ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-100'
              : 'text-slate-400 border-transparent hover:bg-slate-50'
          }`}
        >
          {category.toUpperCase()}
        </motion.button>
      ))}
    </div>
  );
};
