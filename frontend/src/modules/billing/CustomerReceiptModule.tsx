import React from 'react';

interface CustomerReceiptModuleProps {
  order: any;
  subtotal: number;
  vatAmount: number;
  discount: number;
  discountAmount: number;
  finalTotal: number;
}

const CUR = "₸";
const fmt = (n: number) => n.toLocaleString();

export const CustomerReceiptModule: React.FC<CustomerReceiptModuleProps> = ({ 
  order, subtotal, vatAmount, discount, discountAmount, finalTotal 
}) => {
  if (!order) return null;

  return (
    <div className="receipt-container customer-receipt text-black">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold uppercase mb-1">Mubin.cafe.hogo</h1>
        <p className="text-xs">Premium Restaurant System</p>
        <div className="border-b border-dashed border-black my-4" />
        <p className="text-sm font-bold">RECEIPT: {order.id}</p>
        <p className="text-xs">{new Date().toLocaleString()}</p>
      </div>
      
      <div className="space-y-2 mb-6">
        {order.items.map((item: any) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>{item.name} x{item.quantity}</span>
            <span>{fmt(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>
      
      <div className="border-t border-dashed border-black pt-4 space-y-1">
        <div className="flex justify-between text-sm font-medium">
          <span>Subtotal:</span>
          <span>{fmt(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>VAT (16%):</span>
          <span>{fmt(vatAmount)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm italic">
            <span>Discount ({discount}%):</span>
            <span>-{fmt(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg pt-4 border-t border-black mt-2">
          <span>TOTAL:</span>
          <span>{fmt(finalTotal)} {CUR}</span>
        </div>
      </div>
      
      <div className="mt-8 text-center text-xs">
        <p className="font-bold mb-1">Thank you for your visit!</p>
        <p>Please come again</p>
      </div>
    </div>
  );
};
