import React from 'react';

interface KitchenPrintModuleProps {
  order: any;
  items: any[];
}

export const KitchenPrintModule: React.FC<KitchenPrintModuleProps> = ({ order, items }) => {
  if (!order || items.length === 0) return null;

  return (
    <div id="kitchen-print-root" className="receipt-container kitchen-ticket text-black">
      <div className="text-center mb-4 border-b-2 border-black pb-2">
        <h2 className="text-xl font-black uppercase tracking-tighter">Kitchen Ticket</h2>
        <div className="flex justify-between items-center mt-2 px-1">
          <span className="text-sm font-bold">#{order.id}</span>
          <span className="text-sm font-bold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <p className="text-2xl font-black mt-2 bg-black text-white py-1 rounded">
          {order.type === 'dine-in' ? `TABLE #${order.tableId}` : `TAKEAWAY`}
        </p>
        {order.customerName && order.type === 'takeaway' && (
          <p className="text-lg font-bold mt-1 uppercase">{order.customerName}</p>
        )}
      </div>
      
      <div className="space-y-4 py-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-start border-b border-dashed border-slate-300 pb-2">
            <div className="flex items-start gap-4">
              <span className="text-3xl font-black">x{item.quantity}</span>
              <div className="flex flex-col">
                <span className="text-xl font-bold leading-tight">{item.name}</span>
                {item.notes && <span className="text-sm italic mt-1">Note: {item.notes}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 border-t-2 border-black pt-2 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-50">*** End of kitchen ticket ***</p>
        <p className="text-[10px] mt-1 italic">Mubin POS · {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
};
