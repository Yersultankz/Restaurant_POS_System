import React, { useState } from 'react';
import { useOrders, Order } from '../../context/OrderContext';
import { CONFIG } from '../../config';
import { 
  ORDER_STATUS, 
  BILLABLE_ORDER_STATUSES 
} from '../../constants/orderStatus';

const CUR = "₸";
const fmt = (n: number) => n.toLocaleString();

export const BillingModule: React.FC<{ onPrint: (data: any) => void }> = ({ onPrint }) => {
  const { orders, initiatePayment, confirmPayment, setActiveTable, setActiveOrderId } = useOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [method, setMethod] = useState<'Cash' | 'Kaspi'>('Kaspi');

  const pendingOrders = orders.filter((o: Order) => BILLABLE_ORDER_STATUSES.includes(o.status));
  const selectedOrder = pendingOrders.find((o: Order) => o.id === selectedOrderId);

  const subtotal = selectedOrder ? selectedOrder.total : 0;
  const vatAmount = Math.round(subtotal * CONFIG.VAT_RATE);
  const discountAmount = Math.round(subtotal * (discount / 100));
  const finalTotal = subtotal + vatAmount - discountAmount;

  const [cashPaid, setCashPaid] = useState(false);

  const triggerPrint = () => {
    if (!selectedOrder) return;
    onPrint({
      order: selectedOrder,
      subtotal,
      vatAmount,
      discount,
      discountAmount,
      finalTotal
    });
  };

  const handleComplete = () => {
    if (!selectedOrder) return;
    if (method === 'Cash') {
      initiatePayment('Cash', selectedOrder);
      setCashPaid(true);
    } else {
      // Kaspi payment - 使用 KaspiModal 组件处理
      initiatePayment('Kaspi', selectedOrder);
    }
  };

  const handleCashConfirm = () => {
    triggerPrint();
    
    setTimeout(() => {
      confirmPayment();
      setCashPaid(false);
    }, 100);
  };

  // Allow payment only once the order is ready or delivered
  const isPayable = selectedOrder && BILLABLE_ORDER_STATUSES.includes(selectedOrder.status);

  return (
      <div className="flex h-full gap-6 animate-fade no-print">
      {/* Left: Pending List */}
      <div className="w-80 flex flex-col gap-4 border-r border-slate-100 pr-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Pending Bills</h3>
        <div className="flex-1 overflow-y-auto space-y-3">
          {pendingOrders.map((o: Order) => (
            <div 
              key={o.id}
              onClick={() => { 
                setSelectedOrderId(o.id); 
                setActiveOrderId(o.id);
                setDiscount(0); 
                if (o.tableId) setActiveTable(o.tableId);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                selectedOrderId === o.id 
                  ? 'border-red-600 bg-red-50 shadow-md shadow-red-50' 
                  : 'border-slate-100 bg-white hover:border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-slate-800">
                  {o.type === 'dine-in' ? `Table #${o.tableId}` : o.customerName || 'Takeaway'}
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                  o.status === ORDER_STATUS.READY ? 'bg-blue-100 text-blue-600' : 
                  o.status === ORDER_STATUS.DELIVERED ? 'bg-purple-100 text-purple-600' :
                  'bg-amber-100 text-amber-600'
                }`}>
                  {o.status.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-slate-400 mb-3">{o.id} · {o.items.length} items</div>
              <div className="text-lg font-black text-slate-900">{fmt(o.total)} {CUR}</div>
            </div>
          ))}
          {pendingOrders.length === 0 && (
            <div className="py-20 text-center text-slate-300">
              <span className="text-4xl block mb-2">🧾</span>
              <p className="text-sm font-bold">No pending bills</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Checkout Details */}
      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {selectedOrder ? (
          <>
            <div className="p-8 border-b border-slate-50 flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {selectedOrder.type === 'dine-in' ? `Table #${selectedOrder.tableId}` : selectedOrder.customerName || 'Takeaway'}
                </h2>
                <p className="text-slate-400 font-medium">Checkout · {selectedOrder.id}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Time Elapsed</p>
                <p className="text-sm font-bold text-slate-700">24 mins</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {/* Item List */}
              <div className="space-y-4">
                {selectedOrder.items.map((item: any) => (
                  <div key={`${item.dbId || item.id}-${Math.random().toString(36).substr(2, 4)}`} className="flex justify-between items-center text-sm bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white overflow-hidden flex-center shrink-0 border border-slate-100 shadow-sm">
                        {item.emoji && (item.emoji.startsWith('http') || item.emoji.startsWith('/')) ? (
                          <img src={item.emoji} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">{item.emoji || '🍽️'}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-black text-slate-800">{item.name}</p>
                        <p className="text-xs font-bold text-slate-400">{fmt(item.price)} {CUR} × {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-black text-slate-900">{fmt(item.price * item.quantity)} {CUR}</span>
                  </div>
                ))}
              </div>

              {/* Discount Section */}
              <div className="bg-slate-50 rounded-2xl p-6">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Apply Discount</p>
                <div className="flex gap-2">
                  {[0, 5, 10, 15, 20].map(d => (
                    <button
                      key={d}
                      onClick={() => setDiscount(d)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        discount === d 
                          ? 'bg-red-600 text-white shadow-md' 
                          : 'bg-white text-slate-500 border border-slate-100'
                      }`}
                    >
                      {d}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-3 pt-4">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Subtotal</span>
                  <span>{fmt(subtotal)} {CUR}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-medium">
                  <span className="flex items-center gap-2">VAT <span className="bg-slate-100 text-[10px] px-1.5 py-0.5 rounded font-black text-slate-400">16%</span></span>
                  <span>{fmt(vatAmount)} {CUR}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount ({discount}%)</span>
                    <span>-{fmt(discountAmount)} {CUR}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <span className="text-lg font-black text-slate-800">Total</span>
                  <span className="text-3xl font-black text-red-600">{fmt(finalTotal)} {CUR}</span>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button 
                  onClick={() => setMethod('Cash')}
                  className={`py-4 rounded-2xl font-bold flex-center gap-2 border-2 transition-all ${
                    method === 'Cash' ? 'border-red-600 bg-red-50 text-red-600' : 'border-white bg-white text-slate-400'
                  }`}
                  data-testid="payment-method-cash"
                >
                  <span className="text-xl">💵</span> Cash
                </button>
                <button 
                  onClick={() => setMethod('Kaspi')}
                  className={`py-4 rounded-2xl font-bold flex-center gap-2 border-2 transition-all ${
                    method === 'Kaspi' ? 'border-red-600 bg-red-50 text-red-600' : 'border-white bg-white text-slate-400'
                  }`}
                  data-testid="payment-method-kaspi"
                >
                  <span className="text-xl">📱</span> Kaspi QR
                </button>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={triggerPrint}
                  className="py-5 px-6 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold flex-center gap-2 hover:bg-slate-100 transition-all shadow-sm"
                  title="Print Receipt"
                >
                  <span>🖨️</span>
                </button>
                <button 
                  onClick={handleComplete}
                  disabled={!isPayable}
                  className={`flex-1 py-5 rounded-2xl font-black text-lg transition-all ${
                    isPayable 
                      ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-[0.98]' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                  data-testid="confirm-payment"
                >
                  {isPayable ? `Confirm Payment · ${fmt(finalTotal)} ${CUR}` : 'Wait for Kitchen...'}
                </button>
              </div>
            </div>

            {/* Cash Payment Confirmation Modal */}
            {cashPaid && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex-center animate-fade">
                <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full text-center space-y-6 relative animate-scale">
                  <button 
                    onClick={() => setCashPaid(false)}
                    className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex-center hover:bg-red-50 hover:text-red-600 transition-all"
                  >✕</button>
                  
                  <div className="bg-emerald-600 text-white py-3 px-6 rounded-2xl inline-block font-black tracking-widest text-sm mb-4">
                    CASH PAYMENT
                  </div>
                  
                  <div className="text-6xl mb-2">💵</div>
                  
                  <div>
                    <p className="text-2xl font-black text-slate-900">{fmt(finalTotal)} {CUR}</p>
                    <p className="text-sm text-slate-400 font-medium mt-1">Confirm cash received</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setCashPaid(false)}
                      className="py-5 bg-slate-100 text-slate-500 rounded-2xl font-bold text-lg hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleCashConfirm}
                      className="py-5 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all"
                    >
                      Confirm ✓
                    </button>
                  </div>
                </div>
              </div>
            )}

          </>
        ) : (
          <div className="flex-center flex-col h-full text-slate-200 p-10 text-center">
            <span className="text-8xl mb-6 opacity-20">🧾</span>
            <h3 className="text-xl font-bold text-slate-400">Select an order to bill</h3>
            <p className="text-sm text-slate-300 max-w-xs mt-2">Pick a table or takeaway order from the left to generate the final receipt.</p>
          </div>
        )}
      </div>
    </div>
);
};
