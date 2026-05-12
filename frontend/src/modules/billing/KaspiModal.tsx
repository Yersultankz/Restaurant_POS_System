import React, { useState, useEffect } from 'react';
import { useOrders } from '../../context/OrderContext';

import kaspiQr from '../../assets/images/kaspi_QR.png';

const KASPI_QR_IMAGE = kaspiQr;

type Step = 'qr' | 'confirm' | 'done';

export const KaspiModal: React.FC = () => {
  const { activeOrder, paymentStatus, currentPaymentMethod, payments, confirmPayment, cancelPayment } = useOrders();
  const [step, setStep] = useState<Step>('qr');
  const [lastOrder, setLastOrder] = useState<any>(null);

  // We use a local state to keep the modal open even after paymentStatus becomes 'idle'
  // so we can show the success screen.
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (activeOrder) setLastOrder(activeOrder);
    
    if (paymentStatus === 'pending' && currentPaymentMethod === 'Kaspi' && activeOrder) {
      setIsVisible(true);
      setStep('qr');
    }
  }, [paymentStatus, currentPaymentMethod, activeOrder]);

  if (!isVisible || (!activeOrder && step !== 'done')) return null;

  const displayOrder = activeOrder || lastOrder;
  if (!displayOrder) return null;

  const handleFinalConfirm = () => {
    confirmPayment();
    setStep('done');
  };

  const handleClose = () => {
    setIsVisible(false);
    if (paymentStatus === 'pending') cancelPayment();
  };


  if (step === 'done') {
    return (
      <div className="fixed inset-0 z-[100] flex-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fade">
        <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl text-center p-8 animate-scale">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-xl font-black text-slate-800 mb-1">Payment Confirmed!</h2>
          <p className="text-slate-400 text-xs mb-6 font-bold uppercase tracking-wider">
            {displayOrder.id} · {displayOrder.total.toLocaleString()} ₸
          </p>
          <button
            onClick={handleClose}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-base shadow-lg shadow-emerald-100 hover:bg-emerald-700 active:scale-[0.98] transition-all"
          >
            Finish & Return
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fade">
      <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl border border-slate-100 animate-scale">
        <div className="bg-red-600 p-5 text-white text-center relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex-center hover:bg-white/40 transition-colors"
            title="Cancel"
          >
            ✕
          </button>
          <div className="mb-1 opacity-80 text-[10px] font-black uppercase tracking-[0.2em]">Payment Required</div>
          <div className="text-2xl font-black">{displayOrder.total.toLocaleString()} ₸</div>
          <div className="mt-1 text-red-100 text-xs font-medium">Order {displayOrder.id}</div>
        </div>
        
        <div className="p-6 flex-center flex-col gap-4">
          <div className="text-center space-y-1">
            <h3 className="text-lg font-bold text-slate-800">Scan with Kaspi.kz</h3>
            <p className="text-xs text-slate-500 max-w-[180px] mx-auto leading-tight">
              Ask the customer to scan the QR code to pay
            </p>
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-3 bg-red-50 rounded-[1.5rem] scale-95 group-hover:scale-100 transition-transform duration-500" />
            <img
              src={KASPI_QR_IMAGE}
              alt="Kaspi QR Code"
              className="w-40 h-40 relative z-10 rounded-xl shadow-lg border-2 border-white"
            />
          </div>
          
          <div className="text-center">
            <p className="text-xl font-black text-slate-900">{displayOrder.total.toLocaleString()} ₸</p>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">SCAN TO PAY</p>
          </div>
        </div>
        
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
          {step === 'qr' ? (
            <button
              onClick={() => setStep('confirm')}
              className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-black text-base shadow-lg shadow-emerald-100 hover:bg-emerald-700 active:scale-[0.98] transition-all"
            >
              Confirm Payment Received
            </button>
          ) : (
            <div className="space-y-3 animate-fade">
              <p className="text-center text-xs font-bold text-slate-600">
                Are you sure the payment is received?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setStep('qr')} 
                  className="py-3 bg-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-300 transition-all"
                >
                  No, Wait
                </button>
                <button 
                  onClick={handleFinalConfirm} 
                  className="py-3 bg-red-600 text-white rounded-xl font-black text-sm shadow-lg shadow-red-100 hover:bg-red-700 transition-all"
                >
                  Yes, Confirm ✓
                </button>
              </div>
            </div>
          )}
          
          <button 
            onClick={handleClose} 
            className="w-full py-3 mt-1 border border-slate-200 text-slate-400 rounded-xl font-black text-[10px] tracking-widest hover:border-red-100 hover:text-red-500 hover:bg-red-50 transition-all flex-center gap-2"
          >
            ✕ CANCEL TRANSACTION
          </button>
        </div>
      </div>
    </div>
  );
};
