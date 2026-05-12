import React, { useState } from 'react';
import { MenuModule } from './modules/menu/MenuModule';
import { KDSModule } from './modules/kitchen/KDSModule';
import { KaspiModal } from './modules/billing/KaspiModal';
import { AnalyticsModule } from './modules/analytics/AnalyticsModule';
import { BillingModule } from './modules/billing/BillingModule';
import { KitchenPrintModule } from './modules/kitchen/KitchenPrintModule';
import { CustomerReceiptModule } from './modules/billing/CustomerReceiptModule';
import { MenuAdmin } from './modules/menu/MenuAdmin';
import { OrderProvider, useOrders } from './context/OrderContext';
import { AuthProvider, useAuth, ROLE_PERMISSIONS } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { useSocket } from './hooks/useSocket';
import { CONFIG } from './config';
import { NotificationProvider } from './context/NotificationContext';
import { 
  ORDER_STATUS, 
  ORDER_ITEM_STATUS, 
  ACTIVE_ORDER_STATUSES,
  BILLABLE_ORDER_STATUSES,
  OrderStatus
} from './constants/orderStatus';

// --- TYPES ---
type Module = 'tables' | 'order' | 'kitchen' | 'menu' | 'analytics' | 'billing' | 'menu_admin' | 'settings';

const AppContent: React.FC = () => {
  const { currentUser, logout, verifyPin } = useAuth();
  
  const allowedModules = currentUser ? ROLE_PERMISSIONS[currentUser.role] || [] : [];
  
  const [activeModule, setActiveModule] = useState<Module>(() => {
    return (allowedModules[0] as Module) || 'tables';
  });

  if (!currentUser || allowedModules.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
        <div className="text-xl font-bold text-gray-800">Invalid user role or session</div>
        <button onClick={logout} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          Return to Login
        </button>
      </div>
    );
  }
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { 
    orders,
    activeOrder, 
    setActiveTable, 
    startTakeaway,
    addToCart, 
    updateQuantity, 
    removeFromCart, 
    sendToKitchen,
    initiatePayment,
    updateItemStatus,
    isBackendOnline,
    cancelOrder,
    reportLoss,
    cancelOrderItem,
    reportLossOrderItem
  } = useOrders();

  const { connected } = useSocket();

  const [printingMode, setPrintingMode] = useState<'kitchen' | 'customer' | null>(null);
  const [customerPrintData, setCustomerPrintData] = useState<any>(null);
  const [isManagerVerified, setIsManagerVerified] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isPrinting, setIsPrinting] = useState(false);

  const isReadOnly = currentUser?.role === 'boss';

  const handlePrintCustomerReceipt = (data: any) => {
    setCustomerPrintData(data);
    setPrintingMode('customer');
    setTimeout(() => {
      window.print();
      setPrintingMode(null);
    }, 50);
  };

  const handleSendToKitchen = () => {
    if (draftItems.length === 0 || isPrinting) return;
    
    setIsPrinting(true);
    setPrintingMode('kitchen');
    
    setTimeout(() => {
      window.print();
      sendToKitchen();
      setActiveTable(null);
      setActiveModule('tables');
      setSidebarCollapsed(true);
      setPrintingMode(null);
      setIsPrinting(false);
    }, 100);
  };

  const isCartLocked = activeOrder?.status === ORDER_STATUS.PAID;
  
  const draftItems = activeOrder?.items.filter(i => i.status === ORDER_ITEM_STATUS.DRAFT) || [];
  const sentItems = activeOrder?.items.filter(i => i.status !== ORDER_ITEM_STATUS.DRAFT) || [];

  const showSidebar = activeModule === 'menu' && !sidebarCollapsed;

  return (
    <>
      <div className={theme}>
      <div className={`grid-pos no-print bg-[var(--bg-main)] text-[var(--bg-main)]`} style={{ 
        gridTemplateColumns: window.innerWidth > 1024 ? `80px 1fr ${showSidebar ? '380px' : '0px'}` : '1fr' 
      }}>
        <KaspiModal />

      {/* Sidebar Navigation */}
      <nav className="glass-dark flex flex-col items-center py-6 gap-6 z-50 no-print">
        <div className="w-12 h-12 bg-red-600 rounded-xl flex-center mb-4 shadow-lg">
          <span className="text-white text-[10px] font-black tracking-tight">MUBIN</span>
        </div>
        
        {allowedModules.includes('tables') && (
          <NavIcon 
            active={activeModule === 'tables'} 
            onClick={() => setActiveModule('tables')}
            icon={<CustomTableIcon className="w-6 h-6" />} 
            label="Tables"
            badge={orders.filter(o => ([ORDER_STATUS.SENT, ORDER_STATUS.READY, ORDER_STATUS.DELIVERED] as OrderStatus[]).includes(o.status)).length}
            bc="#f59e0b"
          />
        )}
        {allowedModules.includes('menu') && (
          <NavIcon 
            active={activeModule === 'menu'} 
            onClick={() => setActiveModule('menu')}
            icon="📋" 
            label="Menu"
          />
        )}
        {allowedModules.includes('kitchen') && (
          <NavIcon 
            active={activeModule === 'kitchen'} 
            onClick={() => setActiveModule('kitchen')}
            icon="👨‍🍳" 
            label="Kitchen"
            badge={orders.filter(o => o.status === ORDER_STATUS.SENT).length}
            bc="#ef4444"
          />
        )}
        {allowedModules.includes('billing') && (
          <NavIcon 
            active={activeModule === 'billing'} 
            onClick={() => setActiveModule('billing')}
            icon="🧾" 
            label="Billing"
            badge={orders.filter(o => BILLABLE_ORDER_STATUSES.includes(o.status)).length}
            bc="#10b981"
          />
        )}
        {allowedModules.includes('menu_admin') && (
          <NavIcon 
            active={activeModule === 'menu_admin'} 
            onClick={() => setActiveModule('menu_admin')}
            icon="🛠️" 
            label="Menu Admin"
          />
        )}
        {allowedModules.includes('analytics') && (
          <NavIcon 
            active={activeModule === 'analytics'} 
            onClick={() => setActiveModule('analytics')}
            icon="📊" 
            label="Boss Dashboard"
          />
        )}
        
        <div className="mt-auto flex flex-col items-center gap-3">
          {allowedModules.includes('settings') && (
            <NavIcon 
              active={activeModule === 'settings'} 
              onClick={() => setActiveModule('settings')}
              icon="⚙️" 
              label="Settings"
            />
          )}
          <button
            onClick={logout}
            title="退出登录"
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex-center transition-all"
          >
            ⏻
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="overflow-hidden relative flex flex-col bg-slate-50">
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 no-print">
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Mubin.cafe.hogo
            </h1>
            <p className="text-sm text-slate-500">Live POS System Status • {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="w-10 h-10 rounded-xl bg-slate-100 flex-center text-slate-500 hover:bg-slate-200 transition-all no-print"
              title="Toggle Theme"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            {/* WebSocket / Tab Sync status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
              connected
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
              }`} />
              {connected ? 'Live Sync' : 'Offline'}
            </div>
            {/* Backend DB status */}
            <div
              title={isBackendOnline ? '数据库已连接 — 数据实时落库' : '数据库离线 — 数据暂存本地'}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border cursor-default ${
                isBackendOnline
                  ? 'bg-blue-50 text-blue-600 border-blue-100'
                  : 'bg-red-50 text-red-400 border-red-100'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                isBackendOnline ? 'bg-blue-500 animate-pulse' : 'bg-red-400'
              }`} />
              {isBackendOnline ? 'DB 在线' : 'DB 离线'}
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">{currentUser!.name}</p>
                <p className="text-xs text-slate-400 font-medium capitalize">{currentUser!.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser!.name}`} alt="avatar" />
              </div>
              <button
                onClick={logout}
                className="ml-1 text-slate-300 hover:text-red-500 text-xs font-bold transition-colors"
                title="退出登录"
              >
                退出
              </button>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8 animate-fade bg-[var(--bg-main)]">
           {activeModule === 'tables' && (
             <TableModule 
               onSelectTable={(id) => { 
                 setActiveTable(id); 
                 setActiveModule('menu');
                 setSidebarCollapsed(false);
               }} 
               onStartTakeaway={() => {
                 const name = window.prompt('Customer Name (Optional):', '');
                 if (name !== null) {
                   startTakeaway(name);
                   setActiveModule('menu');
                   setSidebarCollapsed(false);
                 }
               }}
             />
           )}
           {activeModule === 'menu' && <MenuModule onAddToCart={addToCart} locked={isCartLocked || isReadOnly} />}
           {activeModule === 'kitchen' && <KDSModule />}
           {activeModule === 'billing' && <BillingModule onPrint={handlePrintCustomerReceipt} />}
           {activeModule === 'analytics' && (
             !isManagerVerified ? (
               <div className="flex-center flex-col h-full bg-slate-900 rounded-[3rem] shadow-2xl relative overflow-hidden p-10 animate-fade">
                 <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-600/20 to-transparent pointer-events-none" />
                 <div className="relative z-10 flex flex-col items-center">
                   <div className="w-24 h-24 bg-red-600 rounded-[2rem] flex-center text-4xl mb-8 shadow-lg shadow-red-900/50">📊</div>
                   <h2 className="text-3xl font-black text-white mb-2">Manager Access</h2>
                   <p className="text-slate-400 mb-10 font-medium">Please enter your secure PIN to proceed</p>
                     <input 
                       type="password" 
                       maxLength={4} 
                       placeholder="••••"
                       autoFocus
                       onKeyUp={async (e: any) => {
                         const val = e.target.value;
                         if (val.length === 4) {
                           const success = await verifyPin(val);
                           if (success) {
                             setIsManagerVerified(true);
                           } else {
                             e.target.value = '';
                             e.target.classList.add('animate-shake');
                             setTimeout(() => e.target.classList.remove('animate-shake'), 600);
                           }
                         }
                       }}
                       className="w-56 py-5 bg-white/5 border-2 border-white/10 rounded-2xl text-center text-4xl font-black text-white tracking-[1em] outline-none focus:border-red-600 focus:bg-white/10 transition-all backdrop-blur-md"
                     />
                 </div>
               </div>
             ) : (
               <AnalyticsModule />
             )
           )}
           {activeModule === 'menu_admin' && (
             !isManagerVerified ? (
               <div className="flex-center flex-col h-full bg-slate-900 rounded-[3rem] shadow-2xl relative overflow-hidden p-10 animate-fade">
                 <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-600/20 to-transparent pointer-events-none" />
                 <div className="relative z-10 flex flex-col items-center">
                   <div className="w-24 h-24 bg-red-600 rounded-[2rem] flex-center text-4xl mb-8 shadow-lg shadow-red-900/50">🛠️</div>
                   <h2 className="text-3xl font-black text-white mb-2">Menu Admin Access</h2>
                   <p className="text-slate-400 mb-10 font-medium">Please enter your secure PIN to proceed</p>
                   <input 
                     type="password" 
                     maxLength={4} 
                     placeholder="••••"
                     autoFocus
                                           onKeyUp={async (e: any) => {
                                               const success = await verifyPin(e.target.value);
                        if (success) {
                         setIsManagerVerified(true);
                       } else if (e.target.value.length === 4) {
                         e.target.value = '';
                         e.target.classList.add('animate-shake');
                         setTimeout(() => e.target.classList.remove('animate-shake'), 600);
                       }
                     }}
                     className="w-56 py-5 bg-white/5 border-2 border-white/10 rounded-2xl text-center text-4xl font-black text-white tracking-[1em] outline-none focus:border-red-600 focus:bg-white/10 transition-all backdrop-blur-md"
                   />
                 </div>
               </div>
             ) : (
               <MenuAdmin />
             )
           )}
        </section>
      </main>

      {/* Right Order Panel — Only visible on Menu page */}
      {activeModule === 'menu' ? (
        <aside className={`bg-white border-l border-slate-200 flex flex-col shadow-2xl z-40 relative transition-all duration-300 no-print ${sidebarCollapsed ? 'translate-x-full' : 'translate-x-0'}`} style={{ width: sidebarCollapsed ? 0 : 380, height: '100vh' }}>
        {/* Toggle Button */}
        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -left-10 top-24 bg-white border border-slate-200 border-r-0 w-10 h-12 rounded-l-xl flex-center text-slate-400 hover:text-red-600 shadow-[-4px_0_10px_rgba(0,0,0,0.05)] transition-colors z-50"
        >
          {sidebarCollapsed ? '◀' : '▶'}
        </button>
        
        {/* Header (Fixed) */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {activeOrder ? (activeOrder.type === 'dine-in' ? `Table #${activeOrder.tableId}` : (activeOrder.customerName || 'Takeaway')) : 'No Active Table'}
              </h2>
              <p className="text-xs text-slate-400">
                {activeOrder ? `Order ID: ${activeOrder.id}` : 'Select a table or start takeaway'}
              </p>
            </div>
            {activeOrder && activeOrder.status !== ORDER_STATUS.PAID && !isReadOnly && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (window.confirm('⚠️ 整单取消\n\n菜已经发到厨房了，确定要取消整张单子吗？\n此操作无法撤销。')) {
                      cancelOrder(activeOrder.id);
                    }
                  }}
                  className="px-2 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
                >
                  取消 (DEL)
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('【报损】确定要将此单标记为损耗吗？（将记录在损耗报表中）')) {
                      reportLoss(activeOrder.id);
                    }
                  }}
                  className="px-2 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all shadow-sm border border-amber-100"
                >
                  报损 (LOSS)
                </button>
              </div>
            )}
            {isCartLocked && (
              <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-[10px] font-black uppercase">
                Paid
              </span>
            )}
          </div>
        </div>
        
        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto sidebar-scroll p-6 relative">
            {!activeOrder ? (
              <div className="flex-center flex-col h-full text-slate-300 gap-4 opacity-50">
                 <span className="text-6xl">📥</span>
                 <p className="text-sm font-bold uppercase tracking-widest text-center">Select Table to<br/>begin transaction</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Pending Items Section */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Order</h3>
                  {draftItems.length === 0 ? (
                    <p className="text-xs text-slate-300 italic">No new items added...</p>
                  ) : (
                    draftItems.map((item, idx) => (
                      <CartItem key={`${item.id}-${idx}`} item={item} locked={false} orderId={activeOrder.id} updateQuantity={updateQuantity} removeFromCart={removeFromCart} readOnly={isReadOnly} />
                    ))
                  )}
                </div>

                {/* Sent Items History Section */}
                {sentItems.length > 0 && (
                  <div className="pt-4 border-t border-slate-50">
                    <button 
                      onClick={() => setShowHistory(!showHistory)}
                      className="flex justify-between items-center w-full group"
                    >
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-red-500 transition-colors">
                        Already Sent ({sentItems.length})
                      </h3>
                      <span className={`text-xs text-slate-300 group-hover:text-red-500 transition-all ${showHistory ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    
                    {showHistory && (
                      <div className="mt-4 space-y-3 animate-fade">
                        {sentItems.map((item, idx) => (
                          <CartItem 
                            key={`${item.id}-${idx}`} 
                            item={item} 
                            locked={true}
                            orderId={activeOrder.id}
                            updateQuantity={updateQuantity} 
                            removeFromCart={removeFromCart} 
                            onCancelItem={cancelOrderItem}
                            onReportLossItem={reportLossOrderItem}
                            onMarkServed={(orderId, itemId) => updateItemStatus(orderId, itemId, ORDER_ITEM_STATUS.SERVED)}
                            readOnly={isReadOnly}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Dynamic Shadow Indicator */}
            {activeOrder && activeOrder.items.length > 4 && <div className="scroll-shadow-bottom" />}
        </div>

        {/* Footer (Sticky/Fixed) */}
        {activeOrder && (
          <div className="p-6 bg-white border-t-2 border-slate-100 space-y-4 shadow-[0_-15px_35px_rgba(0,0,0,0.05)] shrink-0">
            <div className="space-y-2">
              <div className="flex justify-between text-slate-400 text-sm">
                 <span>Subtotal</span>
                 <span>{activeOrder.total.toLocaleString()} ₸</span>
              </div>
              <div className="flex justify-between text-slate-800 text-xl font-black">
                 <span>Total</span>
                 <span className="text-red-600">{activeOrder.total.toLocaleString()} ₸</span>
              </div>
            </div>

            {activeOrder.status !== ORDER_STATUS.PAID && !isReadOnly && (
              <button 
                onClick={handleSendToKitchen}
                disabled={draftItems.length === 0 || isPrinting}
                className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="send-to-kitchen"
              >
                <span>{isPrinting ? '🖨️ Printing...' : '🍳 Send to Kitchen'}</span>
                <span>⚡</span>
              </button>
            )}
            
            {isReadOnly && activeOrder.status !== ORDER_STATUS.PAID && (
              <div className="text-center py-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Read Only Mode</span>
              </div>
            )}
          </div>
        )}
        </aside>
      ) : null}
      </div>
    </div>

    {/* --- PRINTABLE RECEIPTS (Top Level) --- */}
    {printingMode === 'kitchen' && activeOrder && (
      <KitchenPrintModule order={activeOrder} items={draftItems} />
    )}
    
    {printingMode === 'customer' && customerPrintData && (
      <CustomerReceiptModule {...customerPrintData} />
    )}
  </>
);
};

// Sub-component for Cart Item to keep code clean
const CartItem: React.FC<{
  item: any;
  locked: boolean;
  orderId: string;
  updateQuantity: (id: number, delta: number) => void;
  removeFromCart: (id: number) => void;
  onCancelItem?: (orderId: string, itemId: string) => void;
  onReportLossItem?: (orderId: string, itemId: string) => void;
  onMarkServed?: (orderId: string, itemId: string) => void;
  readOnly?: boolean;
}> = ({ item, locked, orderId, updateQuantity, removeFromCart, onCancelItem, onReportLossItem, onMarkServed, readOnly }) => {
  const isSent = item.status !== ORDER_ITEM_STATUS.DRAFT && item.status !== undefined;
  const isWasted = item.status === ORDER_ITEM_STATUS.WASTED;

  if (isWasted) return (
    <div className="flex gap-4 p-3 rounded-2xl border bg-red-50 border-red-100 opacity-60 relative overflow-hidden">
       <div className="absolute top-1/2 left-0 w-full h-[2px] bg-red-500 z-10" />
       <div className="w-14 h-14 rounded-xl bg-white overflow-hidden flex-center shrink-0 border border-red-100">
         <span className="text-2xl grayscale opacity-30">{item.emoji || '🍽️'}</span>
       </div>
       <div className="flex-1 min-w-0">
          <h4 className="text-sm font-black text-red-800 truncate mb-1">{item.name}</h4>
          <span className="text-[10px] font-black uppercase text-red-500">Wasted / Loss</span>
       </div>
       <div className="flex items-center text-red-500 font-black text-xs">x{item.quantity}</div>
    </div>
  );

  return (
    <div className={`flex gap-4 p-3 rounded-2xl border transition-all ${locked ? 'bg-slate-50 border-slate-50' : 'bg-white border-slate-100 hover:border-red-100 shadow-sm'}`}>
      <div className="w-14 h-14 rounded-xl bg-slate-50 overflow-hidden flex-center shrink-0 border border-slate-100">
        {item.emoji && (item.emoji.startsWith('http') || item.emoji.startsWith('/')) ? (
          <img src={item.emoji} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl">{item.emoji || '🍽️'}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-sm font-black text-slate-800 truncate">{item.name}</h4>
          {isSent && (
            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${item.status === ORDER_ITEM_STATUS.READY ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
              {item.status}
            </span>
          )}
        </div>
        <p className="text-xs font-bold text-red-600">{item.price.toLocaleString()} ₸</p>
      </div>
      <div className="flex items-center gap-2">
        {!locked ? (
          <>
            <button 
              onClick={() => updateQuantity(item.id, -1)} 
              disabled={readOnly}
              className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex-center font-black hover:bg-red-500 hover:text-white transition-colors disabled:opacity-30"
            >-</button>
            <span className="text-sm font-black w-5 text-center text-slate-800">{item.quantity}</span>
            <button 
              onClick={() => updateQuantity(item.id, 1)} 
              disabled={readOnly}
              className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex-center font-black hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-30"
            >+</button>
            <button 
              onClick={() => removeFromCart(item.id)} 
              disabled={readOnly}
              className="ml-2 w-7 h-7 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 flex-center transition-all disabled:opacity-30"
            >✕</button>
          </>
        ) : (
          <div className="flex items-center gap-3">
             <span className="bg-white/50 px-3 py-1 rounded-lg text-xs font-black border border-slate-100">x{item.quantity}</span>
             {item.status === ORDER_ITEM_STATUS.READY && onMarkServed && !readOnly && (
               <button
                 onClick={() => onMarkServed(orderId, item.dbId || String(item.id))}
                 title="Mark item as served"
                 className="w-7 h-7 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white flex-center transition-all shadow-sm"
                 data-testid="mark-served"
               >
                 <span className="text-[10px] font-black">✓</span>
               </button>
             )}
              {isSent && !item.status.includes(ORDER_ITEM_STATUS.SERVED) && !readOnly && (
                <button 
                  onClick={() => {
                    if (item.status === ORDER_ITEM_STATUS.SENT) {
                      if (window.confirm(`Cancel Item: ${item.name}\n\nThis item hasn't been prepared yet. Confirm cancellation?`)) onCancelItem?.(orderId, item.dbId || String(item.id));
                    } else {
                      if (window.confirm(`Report Loss: ${item.name}\n\nThis item is ready. Confirm loss report?`)) onReportLossItem?.(orderId, item.dbId || String(item.id));
                    }
                  }}
                  title={item.status === ORDER_ITEM_STATUS.SENT ? 'Cancel Item' : 'Report Loss for Item'}
                  className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white flex-center transition-all shadow-sm"
                  data-testid={item.status === ORDER_ITEM_STATUS.SENT ? 'cancel-item' : 'report-loss'}
                >
                  <span className="text-[10px] font-black">{item.status === ORDER_ITEM_STATUS.SENT ? '✕' : '⚠️'}</span>
                </button>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <NotificationProvider>
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  </NotificationProvider>
);

const AuthGate: React.FC = () => {
  const { currentUser, token } = useAuth();
  if (!currentUser || !token) return <LoginPage />;
  return (
    <OrderProvider>
      <AppContent />
    </OrderProvider>
  );
};

// --- SUBCOMPONENTS ---

const CustomTableIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* 圆形桌面 (透视效果) */}
    <ellipse cx="12" cy="9" rx="9" ry="4" stroke="currentColor" strokeWidth="2"/>
    {/* 中间桌柱 */}
    <path d="M12 13V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    {/* 底座 */}
    <path d="M9 19H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const NavIcon: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number; bc?: string }> = ({ active, onClick, icon, label, badge, bc }) => (
  <button 
    onClick={onClick}
    className={`group relative w-12 h-12 rounded-xl flex-center transition-all duration-300 ${
      active 
        ? 'bg-red-600 text-white shadow-lg shadow-red-200' 
        : 'text-slate-400 hover:bg-white/10 hover:text-white'
    }`}
  >
    <span className="text-xl">{icon}</span>
    {badge ? (
      <span 
        className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-black flex-center border-2 border-white text-white"
        style={{ background: bc || '#D32F2F' }}
      >
        {badge}
      </span>
    ) : null}
    <span className="absolute left-16 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
      {label}
    </span>
    {active && <div className="absolute -left-3 w-1.5 h-6 bg-red-600 rounded-r-full" />}
  </button>
);

const TableModule: React.FC<{ onSelectTable: (id: number) => void; onStartTakeaway: () => void }> = ({ onSelectTable, onStartTakeaway }) => {
  const { orders } = useOrders();
  const [expandedTableId, setExpandedTableId] = useState<number | null>(null);
  
  const tables = Array.from({ length: CONFIG.TABLE_COUNT }, (_, i) => {
    const id = i + 1;
    const activeOrder = orders.find(o => o.tableId === id && ACTIVE_ORDER_STATUSES.includes(o.status));
    const status = activeOrder 
      ? (activeOrder.status === ORDER_STATUS.DRAFT ? 'occupied' : activeOrder.status === ORDER_STATUS.SENT ? 'busy' : activeOrder.status === ORDER_STATUS.READY ? ORDER_STATUS.READY : ORDER_STATUS.DELIVERED) 
      : 'available';
    
    return {
      id,
      status,
      capacity: [2, 4, 6][i % 3],
      total: activeOrder ? activeOrder.total : 0
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
           <FilterPill label="All" count={16} active />
           <FilterPill label="Available" count={tables.filter(t => t.status === 'available').length} bc="#10b981" />
           <FilterPill label="Preparing" count={tables.filter(t => t.status === 'occupied').length} bc="#f59e0b" />
           <FilterPill label="Busy" count={tables.filter(t => t.status === 'busy').length} bc="#ef4444" />
           <FilterPill label="Ready" count={tables.filter(t => t.status === ORDER_STATUS.READY).length} bc="#3b82f6" />
        </div>

        <button 
          onClick={onStartTakeaway}
          className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black flex items-center gap-3 hover:bg-red-600 transition-all shadow-xl shadow-slate-200 uppercase tracking-widest group"
        >
          <span className="text-lg group-hover:scale-125 transition-transform">🥡</span>
          New Takeaway
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {tables.map(table => {
          const ord = orders.find(o => o.tableId === table.id && ACTIVE_ORDER_STATUSES.includes(o.status));
          return (
            <div key={table.id} onClick={() => onSelectTable(table.id)} className="card group cursor-pointer hover:scale-[1.02] relative p-5">
              <div className="flex justify-between items-start mb-4">
                <span className="text-lg font-black text-slate-300 group-hover:text-red-100 transition-colors">#{table.id}</span>
                <StatusBadge status={table.status} />
              </div>
              
              <div className="flex-center flex-col py-1">
                 <div className="w-8 h-8 mb-1 opacity-80 group-hover:scale-110 transition-transform text-slate-300 group-hover:text-red-500">
                    <CustomTableIcon className="w-full h-full" />
                 </div>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{table.capacity} Seats</p>
              </div>

              {ord && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                   <div className="mb-3 space-y-1">
                      {(expandedTableId === table.id ? ord.items : ord.items.slice(0, 3)).map((item, i) => (
                        <div key={i} className="text-[10px] text-slate-500 font-medium truncate flex justify-between">
                          <span>{item.name}</span>
                          <span className="text-slate-300 ml-2">x{item.quantity}</span>
                        </div>
                      ))}
                      
                      {ord.items.length > 3 && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedTableId(expandedTableId === table.id ? null : table.id);
                          }}
                          className="text-[9px] text-red-500 font-black uppercase tracking-tighter hover:underline mt-1 flex items-center gap-1"
                        >
                          {expandedTableId === table.id ? '收起 (HIDE) ▲' : `查看更多 (MORE ${ord.items.length - 3}) ▼`}
                        </button>
                      )}
                   </div>
                   <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{ord.items.length} items</span>
                      <span className="text-sm font-black text-red-600">{table.total.toLocaleString()} ₸</span>
                   </div>
                   <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${ord.status === ORDER_STATUS.READY || ord.status === ORDER_STATUS.DELIVERED ? 'bg-blue-500' : 'bg-amber-400'}`} 
                        style={{ width: ord.status === ORDER_STATUS.READY || ord.status === ORDER_STATUS.DELIVERED ? '100%' : '60%' }} 
                      />
                   </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FilterPill: React.FC<{ label: string; count: number; active?: boolean; bc?: string }> = ({ label, count, active, bc }) => (
  <button 
    className={`px-4 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-2 ${
      active 
        ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-100' 
        : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-200'
    }`}
  >
    {bc && !active && <div className="w-2 h-2 rounded-full" style={{ background: bc }} />}
    {label} 
    <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
      {count}
    </span>
  </button>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: any = {
    available: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    busy: 'bg-amber-50 text-amber-600 border-amber-100',
    occupied: 'bg-red-50 text-red-600 border-red-100',
    ready: 'bg-blue-50 text-blue-600 border-blue-100',
    delivered: 'bg-purple-50 text-purple-600 border-purple-100',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${styles[status]}`}>
      {status}
    </span>
  );
};

export default App;
