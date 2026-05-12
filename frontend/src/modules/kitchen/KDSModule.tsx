import React, { useState } from 'react';
import { useOrders, OrderItem, Order } from '../../context/OrderContext';
import {
  ORDER_STATUS,
  ORDER_ITEM_STATUS,
  TERMINAL_ORDER_STATUSES
} from '../../constants/orderStatus';

type KDSView = 'kitchen' | 'bar' | 'all';

const KITCHEN_CATEGORIES = ['ALL', 'Hot', 'Cold', 'Pizza', 'Salads', 'Soups', 'Main', 'Others'];
const BAR_CATEGORIES = ['Drinks', 'Dessert', 'Desserts'];

// Tracks ghost (cancelled) items per order
type GhostItem = OrderItem & { ghostAt: number };
type GhostItemsMap = Record<string, GhostItem[]>; // orderId -> ghost items

export const KDSModule: React.FC = () => {
  const { orders, updateItemStatus, loadFromBackend } = useOrders();
  const [view, setView] = useState<KDSView>('kitchen');

  // Filter active orders only (exclude paid, wasted, draft)
  const activeOrders = orders.filter((o: Order) => !TERMINAL_ORDER_STATUSES.includes(o.status) && o.status !== ORDER_STATUS.DRAFT);

  const [cancelledOrders, setCancelledOrders] = useState<Order[]>([]);
  const [ghostItems, setGhostItems] = useState<GhostItemsMap>({});
  const prevOrdersRef = React.useRef<Order[]>([]);

  React.useEffect(() => {
    const prevOrders = prevOrdersRef.current;

    // --- Whole-order cancellation detection ---
    const missingOrders = prevOrders.filter((prev: Order) => {
      const isStillThereById = orders.find((curr: Order) => curr.id === prev.id);
      const isStillThereByDisplayId = orders.find((curr: Order) => curr.displayId === prev.id);
      return !isStillThereById && !isStillThereByDisplayId;
    });

    const wastedOrder = orders.find((curr: Order) => {
      const prev = prevOrders.find((p: Order) => p.id === curr.id || (curr.displayId && p.id === curr.displayId));
      return curr.status === ORDER_STATUS.WASTED && prev && (prev.status === ORDER_STATUS.SENT || prev.status === ORDER_STATUS.READY);
    });

    const targetOrder = missingOrders.find((o: Order) => o.status === ORDER_STATUS.SENT || o.status === ORDER_STATUS.READY) || wastedOrder;
    if (targetOrder) {
      const ghostOrder = { ...targetOrder, isCancelled: true, cancelledAt: Date.now() };
      setCancelledOrders(prev => [...prev, ghostOrder]);
    }

    // --- Item-level cancellation detection ---
    const newGhosts: GhostItemsMap = {};

    orders.forEach((currOrder: Order) => {
      if (TERMINAL_ORDER_STATUSES.includes(currOrder.status) || currOrder.status === ORDER_STATUS.DRAFT) return;

      const prevOrder = prevOrders.find((p: Order) =>
        p.id === currOrder.id || (currOrder.displayId && p.id === currOrder.displayId)
      );
      if (!prevOrder) return;

      prevOrder.items.forEach((prevItem: OrderItem) => {
        if (prevItem.status === ORDER_ITEM_STATUS.DRAFT) return;

        const stillExists = currOrder.items.find((ci: any) =>
          (ci.dbId && prevItem.dbId && ci.dbId === prevItem.dbId) || ci.id === prevItem.id
        );

        const nowWasted = stillExists?.status === ORDER_ITEM_STATUS.WASTED;
        const nowGone = !stillExists;

        if ((nowGone || nowWasted) && (prevItem.status === ORDER_ITEM_STATUS.SENT || prevItem.status === ORDER_ITEM_STATUS.READY)) {
          if (!newGhosts[currOrder.id]) newGhosts[currOrder.id] = [];
          newGhosts[currOrder.id].push({ ...prevItem, ghostAt: Date.now() });
        }
      });
    });

    if (Object.keys(newGhosts).length > 0) {
      setGhostItems(prev => {
        const merged = { ...prev };
        Object.entries(newGhosts).forEach(([orderId, items]) => {
          const existing = merged[orderId] || [];
          const dedupedNew = items.filter(ni =>
            !existing.find(ei => (ei.dbId && ni.dbId && ei.dbId === ni.dbId) || ei.id === ni.id)
          );
          merged[orderId] = [...existing, ...dedupedNew];
        });
        return merged;
      });
    }

    prevOrdersRef.current = orders;
  }, [orders]);

  // Auto-dismiss ghost items and cancelled orders after 5 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      setCancelledOrders(prev => {
        const next = prev.filter(o => now - o.cancelledAt! < 5000);
        return next.length === prev.length ? prev : next;
      });

      setGhostItems(prev => {
        let changed = false;
        const next = { ...prev };
        Object.keys(next).forEach(orderId => {
          const valid = next[orderId].filter(gi => now - gi.ghostAt < 5000);
          if (valid.length !== next[orderId].length) changed = true;
          if (valid.length === 0) delete next[orderId];
          else next[orderId] = valid;
        });
        return changed ? next : prev;
      });

      // Optional: Periodic background sync (every 30 iterations = 30 seconds)
      // Since interval is 1s, we use a counter or just do it less frequently
      if (now % 30000 < 1000) { 
        loadFromBackend();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const allCurrentOrders = [...activeOrders, ...cancelledOrders];

  const categories = React.useMemo(() => {
    if (view === 'all') return [...KITCHEN_CATEGORIES, ...BAR_CATEGORIES];
    return view === 'kitchen' ? KITCHEN_CATEGORIES : BAR_CATEGORIES;
  }, [view]);

  const isCategoryMatch = (itemCat?: string) => {
    if (view === 'all') return true;
    if (!itemCat) return view === 'kitchen';
    const cat = itemCat.trim().toLowerCase();
    return categories.some(c => c.toLowerCase() === cat);
  };

  const pending = allCurrentOrders.filter((o: Order) =>
    o.items.some((i: OrderItem) => i.status === ORDER_ITEM_STATUS.SENT && isCategoryMatch(i.category)) ||
    (ghostItems[o.id] || []).some(gi => gi.status === ORDER_ITEM_STATUS.SENT && isCategoryMatch(gi.category))
  );

  const ready = allCurrentOrders.filter((o: Order) =>
    o.items.some((i: OrderItem) => i.status === ORDER_ITEM_STATUS.READY && isCategoryMatch(i.category)) ||
    (ghostItems[o.id] || []).some(gi => gi.status === ORDER_ITEM_STATUS.READY && isCategoryMatch(gi.category))
  );

  React.useEffect(() => {
    if (allCurrentOrders.length > 0) {
      console.log(`[KDS] Total Orders: ${allCurrentOrders.length}, Pending: ${pending.length}, Ready: ${ready.length}`);
    }
  }, [allCurrentOrders.length, pending.length, ready.length]);

  return (
    <div className="flex flex-col h-full gap-6 relative">
      <div className="flex gap-4 p-1.5 bg-slate-100 rounded-2xl w-fit self-center shadow-inner">
        <button
          onClick={() => setView('all')}
          className={`px-8 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${view === 'all' ? 'bg-white text-slate-800 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <span>📋</span> ALL ORDERS
        </button>
        <button
          onClick={() => setView('kitchen')}
          className={`px-8 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${view === 'kitchen' ? 'bg-white text-slate-800 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <span>🍳</span> KITCHEN
        </button>
        <button
          onClick={() => setView('bar')}
          className={`px-8 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${view === 'bar' ? 'bg-white text-slate-800 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <span>🥤</span> BAR (DRINKS)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
        {/* PREPARING COLUMN */}
        <div className="flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between bg-amber-50 p-4 rounded-2xl border border-amber-100 shrink-0">
            <h2 className="font-bold text-amber-800 flex items-center gap-2">
              <span>🔥</span> {view === 'kitchen' ? 'COOKING' : 'PREPARING DRINKS'}
            </h2>
            <span className="bg-amber-200 text-amber-800 px-3 py-1 rounded-full text-xs font-black">{pending.length}</span>
          </div>
          <div className="space-y-4 overflow-y-auto pr-2 flex-1 pb-10">
            {pending.length === 0 && (
              <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
                No active {view} orders
              </div>
            )}
            {pending.map(order => (
              <KDSOrderCard
                key={order.id}
                order={{ ...order, items: order.items.filter((i: any) => i.status === ORDER_ITEM_STATUS.SENT && isCategoryMatch(i.category)) }}
                ghostItems={(ghostItems[order.id] || []).filter(gi => gi.status === ORDER_ITEM_STATUS.SENT && isCategoryMatch(gi.category))}
                onItemAction={(itemId) => updateItemStatus(order.id, itemId, ORDER_ITEM_STATUS.READY)}
                onAllAction={() => {
                  order.items
                    .filter((i: any) => i.status === ORDER_ITEM_STATUS.SENT && isCategoryMatch(i.category))
                    .forEach((i: any) => updateItemStatus(order.id, i.dbId || String(i.id), ORDER_ITEM_STATUS.READY));
                }}
                actionLabel="All Ready"
                actionColor="bg-emerald-600"
                data-testid="all-ready"
              />
            ))}
          </div>
        </div>

        {/* READY COLUMN */}
        <div className="flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shrink-0">
            <h2 className="font-bold text-emerald-800 flex items-center gap-2">
              <span>✅</span> READY TO SERVE
            </h2>
            <span className="bg-emerald-200 text-emerald-800 px-3 py-1 rounded-full text-xs font-black">{ready.length}</span>
          </div>
          <div className="space-y-4 overflow-y-auto pr-2 flex-1 pb-10">
            {ready.length === 0 && (
              <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
                Nothing ready yet
              </div>
            )}
            {ready.map(order => (
              <KDSOrderCard
                key={order.id}
                order={{ ...order, items: order.items.filter((i: any) => i.status === ORDER_ITEM_STATUS.READY && isCategoryMatch(i.category)) }}
                ghostItems={(ghostItems[order.id] || []).filter(gi => gi.status === ORDER_ITEM_STATUS.READY && isCategoryMatch(gi.category))}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const KDSOrderCard: React.FC<{
  order: any;
  ghostItems: GhostItem[];
  onItemAction?: (itemId: string) => void;
  onAllAction?: () => void;
  actionLabel?: string;
  actionColor?: string;
}> = ({ order, ghostItems, onItemAction, onAllAction, actionLabel, actionColor }) => {
  const elapsed = Math.floor((Date.now() - order.createdAt) / 60000);
  const isCancelled = order.isCancelled;
  const hasGhostItems = ghostItems.length > 0;

  return (
    <div className={`bg-white rounded-3xl border shadow-sm overflow-hidden animate-fade transition-all relative ${isCancelled ? 'border-red-500 shadow-red-100 ring-2 ring-red-500 ring-opacity-50' :
        hasGhostItems ? 'border-orange-300 ring-1 ring-orange-300' :
          'border-slate-200 hover:shadow-xl'
      }`}>
      {isCancelled && <div className="absolute inset-0 bg-red-50/10 pointer-events-none z-10" />}

      <div className={`p-5 border-b flex justify-between items-center ${isCancelled ? 'bg-red-50 border-red-100' : hasGhostItems ? 'bg-orange-50/50 border-orange-50' : 'bg-slate-50/50 border-slate-50'}`}>
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Table</span>
          <h3 className={`text-2xl font-black ${isCancelled ? 'text-red-700' : 'text-slate-800'}`}>#{order.tableId}</h3>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">{isCancelled ? 'Voided At' : 'Wait Time'}</span>
          <span className={`text-base font-black ${isCancelled ? 'text-red-500' : (elapsed > 15 ? 'text-red-500' : 'text-slate-600')}`}>
            {isCancelled ? new Date(order.cancelledAt!).toLocaleTimeString() : `${elapsed} min`}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-3 relative z-20">
        {/* Active items */}
        {order.items.map((item: any, idx: number) => (
          <div
            key={`active-${item.id}-${idx}`}
            onClick={() => !isCancelled && onItemAction?.(item.dbId || String(item.id))}
            className={`flex justify-between items-center p-3 rounded-2xl border transition-all relative overflow-hidden ${isCancelled
                ? 'bg-white border-red-100 opacity-60'
                : `bg-slate-50/30 border-slate-100/50 ${onItemAction ? 'hover:bg-white hover:border-emerald-200 hover:shadow-md cursor-pointer group' : ''}`
              }`}
            data-testid="kitchen-item-action"
          >
            {isCancelled && <div className="absolute top-1/2 left-0 w-full h-[2px] bg-red-500 z-30" />}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white overflow-hidden flex-center shrink-0 border border-slate-100 shadow-sm">
                {item.emoji && (item.emoji.startsWith('http') || item.emoji.startsWith('/')) ? (
                  <img src={item.emoji} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">{item.emoji || '🍽️'}</span>
                )}
              </div>
              <div>
                <span className="text-sm font-black text-slate-800 block">{item.name}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{item.category}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-black">x {item.quantity}</span>
              {!isCancelled && (
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex-center opacity-0 group-hover:opacity-100 transition-opacity">✓</div>
              )}
            </div>
          </div>
        ))}

        {/* Ghost (cancelled) items — chef must confirm Y/N before dismissing */}
        {ghostItems.map((item, idx) => (
          <div
            key={`ghost-${item.id}-${idx}`}
            className="rounded-2xl border border-red-300 bg-red-50 relative overflow-hidden"
          >
            {/* Item row with strikethrough */}
            <div className="flex justify-between items-center p-3 relative">
              <div className="absolute top-1/2 left-0 w-full h-[3px] bg-red-600 z-30 opacity-90 pointer-events-none" />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white overflow-hidden flex-center shrink-0 border border-red-100 shadow-sm opacity-50">
                  {item.emoji && (item.emoji.startsWith('http') || item.emoji.startsWith('/')) ? (
                    <img src={item.emoji} alt={item.name} className="w-full h-full object-cover grayscale" />
                  ) : (
                    <span className="text-2xl grayscale opacity-50">{item.emoji || '🍽️'}</span>
                  )}
                </div>
                <div>
                  <span className="text-sm font-black text-red-900 block opacity-70">{item.name}</span>
                  <span className="text-[10px] font-black text-red-600 uppercase tracking-wider">⚠ 已取消 / CANCELLED</span>
                </div>
              </div>
              <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-black">x {item.quantity}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 pb-5 relative z-20">
        {isCancelled ? (
          <div className="w-full py-4 rounded-2xl bg-red-600 text-white font-black text-center text-sm shadow-lg shadow-red-200">
            ⚠️ VOIDED
          </div>
        ) : onAllAction && actionLabel && actionColor ? (
          <button
            onClick={onAllAction}
            className={`w-full py-4 rounded-2xl text-white font-black text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${actionColor}`}
          >
            <span>🚀</span> {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
};
