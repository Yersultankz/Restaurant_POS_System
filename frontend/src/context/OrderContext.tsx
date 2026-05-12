import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode, useMemo } from 'react';
import { useSocket } from '../hooks/useSocket';
import { api } from '../services/api';
import { useNotify } from './NotificationContext';
import { useAuth } from './AuthContext';

import { 
  ORDER_STATUS, 
  OrderStatus, 
  ORDER_ITEM_STATUS, 
  OrderItemStatus, 
  ORDER_EVENT_TYPE, 
  OrderEventType,
  ACTIVE_ORDER_STATUSES
} from '../constants/orderStatus';

export type { OrderStatus };
export type PaymentStatus = 'idle' | 'pending' | 'confirmed';

export interface Product {
  id: number;
  name?: string;
  name_ru?: string;
  price: number;
  category?: string;
  image?: string;
}

export interface OrderItem {
  id: number; // Product ID
  dbId?: string; // Database UUID
  name: string;
  price: number;
  quantity: number;
  category: string;
  emoji: string;
  status: OrderItemStatus;
}

export interface PaymentRecord {
  orderId: string;
  tableId: number | null;
  method: 'Cash' | 'Kaspi';
  amount: number;
  paidAt: number;
}

export interface Order {
  id: string;
  displayId?: string; // Original temporary ID (ORD-...)
  type: 'dine-in' | 'takeaway';
  tableId: number | null;
  customerName?: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  discount?: number;
  createdAt: number;
  isCancelled?: boolean;
  cancelledAt?: number;
  version: number;
}

export interface OrderEvent {
  id: string;
  timestamp: number;
  type: OrderEventType;
  orderId: string;
  tableId: number | null;
  details: string;
}

interface OrderContextType {
  orders: Order[];
  activeOrder: Order | null;
  paymentStatus: PaymentStatus;
  currentPaymentMethod: 'Cash' | 'Kaspi' | null;
  payments: PaymentRecord[];
  events: OrderEvent[];
  isBackendOnline: boolean;
  setActiveTable: (tableId: number | null) => void;
  setActiveOrderId: (id: string | null) => void;
  startTakeaway: (customerName?: string) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, delta: number) => void;
  sendToKitchen: () => Promise<void>;
  initiatePayment: (method: 'Cash' | 'Kaspi', order?: Order) => void;
  confirmPayment: () => Promise<void>;
  cancelPayment: () => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updateItemStatus: (orderId: string, itemId: string, status: OrderItem['status']) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  reportLoss: (orderId: string) => Promise<void>;
  cancelOrderItem: (orderId: string, itemId: string) => Promise<void>;
  reportLossOrderItem: (orderId: string, itemId: string) => Promise<void>;
  loadFromBackend: () => Promise<void>;
}

// Helper to recalculate total price (excluding wasted items)
const recalculateTotal = (items: OrderItem[]) => {
  return items
    .filter((item: OrderItem) => item.status !== ORDER_ITEM_STATUS.WASTED)
    .reduce((acc: number, curr: OrderItem) => acc + (curr.price * curr.quantity), 0);
};

// Map a backend order to the frontend Order shape
function mapApiOrder(apiOrder: any): Order {
  return {
    id: apiOrder.id,
    displayId: apiOrder.displayId || undefined,
    type: apiOrder.type as Order['type'],
    tableId: apiOrder.tableId ?? null,
    customerName: apiOrder.customerName ?? undefined,
    status: apiOrder.status as OrderStatus,
    total: apiOrder.total,
    discount: apiOrder.discount ?? undefined,
    createdAt: new Date(apiOrder.createdAt).getTime(),
    version: apiOrder.version || 0,
    items: (apiOrder.items || []).map((item: any) => ({
      id: item.productId,
      dbId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      category: item.category || 'Hot',
      emoji: item.emoji,
      status: item.status as OrderItem['status'],
    })),
  };
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }): JSX.Element {
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('pos_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTableId, setActiveTableId] = useState<number | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<'Cash' | 'Kaspi' | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem('pos_payments');
    return saved ? JSON.parse(saved) : [];
  });
  const [events, setEvents] = useState<OrderEvent[]>(() => {
    const saved = localStorage.getItem('pos_events');
    return saved ? JSON.parse(saved) : [];
  });
  const { token, logout } = useAuth();
  const { notify } = useNotify();
  const [isBackendOnline, setIsBackendOnline] = useState(false);

  const apiCall = useCallback(async <T extends unknown>(path: string, options?: RequestInit): Promise<T | null> => {
    if (!token) return null;
    try {
      api.setToken(token);
      let response;

      if (options?.method === 'POST' || options?.method === 'PATCH') {
        response = await api.request<T>(path, options);
      } else if (options?.method === 'DELETE') {
        response = await api.delete<T>(path);
      } else if (options?.method === 'GET' || !options?.method) {
        response = await api.get<T>(path);
      } else {
        response = await api.request<T>(path, options);
      }

      if (response.error) {
        if (response.error.status === 401) {
          notify('Session expired. Please log in again.', 'error');
          logout();
          return null;
        }
        const errorMsg = response.error.message || `Action failed`;
        notify(`${errorMsg} (${response.error.code})`, 'error');
        return null;
      }

      return response.data;
    } catch (err) {
      notify('Network connection error. Please check server status.', 'error');
      return null;
    }
  }, [token, notify, logout]);

  const loadFromBackend = useCallback(async () => {
    if (!token) return;
    try {
      const health = await apiCall<{ status: string }>('/health');
      if (!health) {
        setIsBackendOnline(false);
        return;
      }

      setIsBackendOnline(true);
      const apiOrders = await apiCall<any[]>('/orders');
      
      // If we got a successful response, use a non-destructive merge strategy
      if (apiOrders) {
        const mapped = apiOrders.map(mapApiOrder);
        const dbOrderMap = new Map(mapped.map((o: Order) => [o.id, o]));

        setOrders((prev: Order[]) => {
          // Keep local draft orders (ORD-...) that are not yet in DB
          const localDrafts = prev.filter((o: Order) => 
            o.id.startsWith('ORD-') && !mapped.some((db: Order) => db.displayId === o.id)
          );
          
          // Merge DB orders with local state
          const updatedOrders = prev.map((local: Order) => {
            const remote = dbOrderMap.get(local.id);
            // If the order exists in DB, update it; otherwise keep local (might be a pending update)
            return remote || local;
          });

          // Add brand new orders from DB
          const newFromDb = mapped.filter((db: Order) => !prev.some((l: Order) => l.id === db.id));
          
          const merged = [...updatedOrders.filter((o: Order) => dbOrderMap.has(o.id)), ...localDrafts, ...newFromDb];
          
          // Deduplicate by ID
          const unique = Array.from(new Map(merged.map((o: Order) => [o.id, o])).values());

          // Cleanup: Remove paid/wasted orders older than 24 hours from local state
          const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
          const final = unique.filter((o: Order) => {
            if (o.status !== ORDER_STATUS.PAID && o.status !== ORDER_STATUS.WASTED) return true;
            return o.createdAt > oneDayAgo;
          });
          
          localStorage.setItem('pos_orders', JSON.stringify(final));
          return final;
        });
      }
    } catch (error) {
      setIsBackendOnline(false);
    }
  }, [token, apiCall]);

  useEffect(() => {
    if (token) {
      loadFromBackend();
    }
    // Initial fetch only. Real-time updates handled by Socket.io and BroadcastChannel.
  }, [loadFromBackend, token]);

  // --- Real-time Sync Logic (WebSocket via Socket.io) ---
  const { connected, on } = useSocket(token);

  // Sync on window focus (fallback for dropped connections)
  useEffect(() => {
    const handleFocus = () => {
      console.debug('[Sync] Window focused, checking for updates...');
      loadFromBackend();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadFromBackend]);

  useEffect(() => {
    if (!connected) return;
    
    console.log('[Socket] Subscribing to sync_orders');
    const unsubscribe = on('sync_orders', (data?: any) => {
      console.log('[Socket] Received sync_orders, reloading...', data?.id || '');
      loadFromBackend();
    });
    return unsubscribe;
  }, [on, loadFromBackend, connected]);

  // --- Real-time Sync Logic (BroadcastChannel - Legacy Fallback) ---
  const syncChannel = useRef<BroadcastChannel | null>(null);
  const isInternalUpdate = useRef(false);

  useEffect(() => {
    syncChannel.current = new BroadcastChannel('pos_system_sync');
    syncChannel.current.onmessage = (event) => {
      const { type, payload } = event.data;
      isInternalUpdate.current = true;
      if (type === 'SYNC_STATE') {
        setOrders(prev => {
          // Merge logic: only overwrite orders that are NOT currently being edited (not drafts)
          const remoteOrders = payload.orders as Order[];
          const remoteMap = new Map(remoteOrders.map(o => [o.id, o]));
          
          return prev.map(local => {
            const remote = remoteMap.get(local.id);
            if (!remote) return local;
            // If local is a draft and remote is NOT, keep local for now (or merge)
            if (local.status === ORDER_STATUS.DRAFT && remote.status !== ORDER_STATUS.DRAFT) return local;
            return remote;
          }).concat(remoteOrders.filter(r => !prev.some(l => l.id === r.id)));
        });
        setPayments(payload.payments);
        setEvents(payload.events);
      }
      setTimeout(() => { isInternalUpdate.current = false; }, 50);
    };
    return () => syncChannel.current?.close();
  }, []);

  // --- Optimized Persistence with Debouncing ---
  useEffect(() => {
    if (isInternalUpdate.current) return;

    const timer = setTimeout(() => {
      // 1. Filter: Only keep active orders or very recent completed ones
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const filteredOrders = orders.filter(o => {
        if (ACTIVE_ORDER_STATUSES.includes(o.status)) return true;
        return o.createdAt > oneDayAgo;
      });

      // 2. Persist to localStorage
      localStorage.setItem('pos_orders', JSON.stringify(filteredOrders));
      localStorage.setItem('pos_payments', JSON.stringify(payments));
      localStorage.setItem('pos_events', JSON.stringify(events));

      // 3. Broadcast to other tabs
      syncChannel.current?.postMessage({
        type: 'SYNC_STATE',
        payload: { orders: filteredOrders, payments, events }
      });
    }, 1000); // 1s debounce

    return () => clearTimeout(timer);
  }, [orders, payments, events]);

  const addEvent = (type: OrderEvent['type'], order: Order, details: string) => {
    const newEvent: OrderEvent = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: Date.now(),
      type,
      orderId: order.id,
      tableId: order.tableId,
      details
    };
    setEvents(prev => [newEvent, ...prev].slice(0, 100));
  };

  const activeOrder = useMemo(() => {
    if (activeOrderId) {
      return orders.find(o => o.id === activeOrderId) || null;
    }
    if (activeTableId !== null) {
      return orders.find(o => o.tableId === activeTableId && ACTIVE_ORDER_STATUSES.includes(o.status)) || null;
    }
    return null;
  }, [orders, activeTableId, activeOrderId]);

  const setActiveTable = (id: number | null) => {
    if (paymentStatus === 'pending') return;
    setActiveTableId(id);
    if (id !== null) {
      const existing = orders.find(o => o.tableId === id && ACTIVE_ORDER_STATUSES.includes(o.status));
      if (existing) {
        setActiveOrderId(existing.id);
      } else {
        const newOrderId = `ORD-${Date.now().toString().slice(-4)}`;
        const newOrder: Order = {
          id: newOrderId,
          type: 'dine-in',
          tableId: id,
          items: [],
          status: ORDER_STATUS.DRAFT,
          total: 0,
          createdAt: Date.now(),
          version: 0,
        };
        setOrders(prev => [...prev, newOrder]);
        setActiveOrderId(newOrderId);
      }
    } else {
      setActiveOrderId(null);
    }
  };

  const startTakeaway = (customerName: string = '') => {
    const newOrderId = `ORD-T${Date.now().toString().slice(-4)}`;
    const newOrder: Order = {
      id: newOrderId,
      type: 'takeaway',
      tableId: null,
      customerName,
      items: [],
      status: ORDER_STATUS.DRAFT,
      total: 0,
      createdAt: Date.now(),
      version: 0,
    };
    setOrders(prev => [...prev, newOrder]);
    setActiveTableId(null);
    setActiveOrderId(newOrderId);
  };

  const addToCart = useCallback((product: Product) => {
    setOrders(prev => {
      const currentActive = activeOrderId 
        ? prev.find(o => o.id === activeOrderId)
        : prev.find(o => o.tableId === activeTableId && ACTIVE_ORDER_STATUSES.includes(o.status));
      
      if (!currentActive || currentActive.status === ORDER_STATUS.PAID) return prev;

      return prev.map(o => {
        if (o.id !== currentActive.id) return o;
        const existingDraftItem = o.items.find(i => i.id === product.id && i.status === ORDER_ITEM_STATUS.DRAFT);
        let newItems;
        if (existingDraftItem) {
          newItems = o.items.map(i => (i.id === product.id && i.status === ORDER_ITEM_STATUS.DRAFT) ? { ...i, quantity: i.quantity + 1 } : i);
        } else {
          newItems = [...o.items, {
            id: Number(product.id),
            name: product.name_ru || product.name || 'Unknown Item',
            price: product.price || 0,
            quantity: 1,
            category: product.category || 'Hot',
            emoji: product.image || '🍽️',
            status: ORDER_ITEM_STATUS.DRAFT
          }];
        }
        return { ...o, items: newItems, total: recalculateTotal(newItems) };
      });
    });
  }, [activeTableId, activeOrderId]);

  const updateQuantity = useCallback((productId: number, delta: number) => {
    setOrders(prev => {
      const currentActive = activeOrderId 
        ? prev.find(o => o.id === activeOrderId)
        : prev.find(o => o.tableId === activeTableId && ACTIVE_ORDER_STATUSES.includes(o.status));
      
      if (!currentActive || currentActive.status === ORDER_STATUS.PAID) return prev;

      return prev.map(o => {
        if (o.id !== currentActive.id) return o;
        const newItems = o.items.map(i => (i.id === productId && i.status === ORDER_ITEM_STATUS.DRAFT) ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i);
        return { ...o, items: newItems, total: recalculateTotal(newItems) };
      });
    });
  }, [activeTableId, activeOrderId]);

  const removeFromCart = useCallback((productId: number) => {
    setOrders(prev => {
      const currentActive = activeOrderId 
        ? prev.find(o => o.id === activeOrderId)
        : prev.find(o => o.tableId === activeTableId && ACTIVE_ORDER_STATUSES.includes(o.status));
      
      if (!currentActive || currentActive.status === ORDER_STATUS.PAID) return prev;

      return prev.map(o => {
        if (o.id !== currentActive.id) return o;
        const newItems = o.items.filter(i => !(i.id === productId && i.status === ORDER_ITEM_STATUS.DRAFT));
        return { ...o, items: newItems, total: recalculateTotal(newItems) };
      });
    });
  }, [activeTableId, activeOrderId]);

  const sendToKitchen = useCallback(async () => {
    if (!activeOrder) return;
    const draftItems = activeOrder.items.filter(i => i.status === ORDER_ITEM_STATUS.DRAFT);
    if (draftItems.length === 0) return;

    // 1. Update UI immediately (optimistic)
    setOrders(prev => prev.map(o => {
      if (o.id !== activeOrder.id) return o;
      const updatedItems = o.items.map(i => i.status === ORDER_ITEM_STATUS.DRAFT ? { ...i, status: ORDER_ITEM_STATUS.SENT } : i);
      const itemNames = draftItems.map(i => `${i.name} x${i.quantity}`).join(', ');
      addEvent(ORDER_EVENT_TYPE.ORDER_SENT, o, `Sent to kitchen: ${itemNames}`);
      return { ...o, items: updatedItems, status: ORDER_STATUS.SENT };
    }));

    // 2. Sync to backend
    try {
      if (activeOrder.id.startsWith('ORD-')) {
        // Create new order
        const newDbOrder = await apiCall<Order>('/orders', {
          method: 'POST',
          body: JSON.stringify({
            displayId: activeOrder.id,
            type: activeOrder.type,
            tableId: activeOrder.tableId,
            customerName: activeOrder.customerName,
            items: draftItems.map(i => ({
              productId: i.id,
              name: i.name,
              price: i.price,
              quantity: i.quantity,
              category: i.category,
              emoji: i.emoji,
            })),
          }),
        });
        
        // Update local order with database IDs so individual item actions work
        if (newDbOrder && newDbOrder.id) {
           setOrders(prev => prev.map(o => o.id === activeOrder.id ? { 
             ...o, 
             id: newDbOrder.id,
             items: newDbOrder.items // This now includes the dbId for each item
           } : o));
        }
      } else {
        // Add items to existing order
        const updatedDbOrder = await apiCall<Order>(`/orders/${activeOrder.id}/items`, {
          method: 'POST',
          body: JSON.stringify({
            items: draftItems.map(i => ({
              productId: i.id,
              name: i.name,
              price: i.price,
              quantity: i.quantity,
              category: i.category,
              emoji: i.emoji,
            })),
          }),
        });

        if (updatedDbOrder) {
          setOrders(prev => prev.map(o => o.id === activeOrder.id ? updatedDbOrder : o));
        }
      }
    } catch (err) {
      console.error('[OrderContext] Sync to kitchen failed:', err);
      notify('Server sync failed. Order saved locally but kitchen may not see it.', 'warning');
    }
  }, [activeOrder, isBackendOnline, notify]);

  const initiatePayment = (method: 'Cash' | 'Kaspi', order?: Order) => {
    const targetOrder = order || activeOrder;
    if (!targetOrder) return;
    
    if (targetOrder.tableId !== null) {
      setActiveTableId(targetOrder.tableId);
      setActiveOrderId(null);
    } else {
      setActiveOrderId(targetOrder.id);
      setActiveTableId(null);
    }
    
    setCurrentPaymentMethod(method);
    setPaymentStatus('pending');
  };

  const confirmPayment = useCallback(async () => {
    if (!activeOrder || !currentPaymentMethod || activeOrder.total <= 0) return;

    setPaymentStatus('pending'); // Lock the UI

    try {
      let finalOrderId = activeOrder.id;

      // 1. If it's a local draft (ORD-...), ensure it exists in the DB first
      if (finalOrderId.startsWith('ORD-')) {
        // Upload all billable items before payment. Served items are still part of the bill.
        const activeItems = activeOrder.items.filter(i => i.status !== ORDER_ITEM_STATUS.WASTED);
        if (activeItems.length === 0) {
          throw new Error('Cannot synchronize an empty order before payment');
        }

        const createdOrder = await apiCall<any>('/orders', {
          method: 'POST',
          body: JSON.stringify({
            displayId: activeOrder.id,
            type: activeOrder.type,
            tableId: activeOrder.tableId,
            customerName: activeOrder.customerName,
            items: activeItems.map(i => ({
              productId: i.id,
              name: i.name,
              price: i.price,
              quantity: i.quantity,
              category: i.category,
              emoji: i.emoji,
            })),
          })
        });

        if (!createdOrder?.id) throw new Error('Failed to synchronize order before payment');
        const syncedOrder = mapApiOrder(createdOrder);
        finalOrderId = syncedOrder.id;
        
        // Update local state with the new DB ID and version
        setOrders(prev => prev.map(o => o.id === activeOrder.id ? syncedOrder : o));
      }

      // 2. Perform payment in the Backend
      const paymentResult = await apiCall<{ success: boolean }>(`/orders/${finalOrderId}/pay`, {
        method: 'POST',
        body: JSON.stringify({
          method: currentPaymentMethod,
          amount: activeOrder.total,
          tableId: activeOrder.tableId
        })
      });

      if (!paymentResult) throw new Error('Payment rejected by backend or connection failed');

      // 3. ONLY NOW update the local state to PAID status
      addEvent(ORDER_EVENT_TYPE.ORDER_PAID, activeOrder, `Paid ${activeOrder.total.toLocaleString()} ₸ via ${currentPaymentMethod}`);
      setPayments(prev => [...prev, {
        orderId: finalOrderId,
        tableId: activeOrder.tableId,
        method: currentPaymentMethod,
        amount: activeOrder.total,
        paidAt: Date.now()
      }]);

      setOrders(prev => prev.map(o => o.id === finalOrderId ? { ...o, status: ORDER_STATUS.PAID } : o));
      setActiveTableId(null);
      setActiveOrderId(null);
      notify('Payment completed successfully', 'success');

    } catch (err) {
      console.error('Payment Error:', err);
      notify('Payment failed. Local state preserved. Please try again.', 'error');
      // No local state changes on failure -> effective rollback
    } finally {
      setPaymentStatus('idle');
      setCurrentPaymentMethod(null);
    }
  }, [activeOrder, currentPaymentMethod, apiCall, notify]);

  const cancelPayment = () => {
    setPaymentStatus('idle');
    setCurrentPaymentMethod(null);
  };

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      let updatedItems = [...o.items];
      if (status === ORDER_STATUS.READY) {
        const itemsToMark = o.items.filter(i => i.status === ORDER_ITEM_STATUS.SENT);
        updatedItems = o.items.map(i => i.status === ORDER_ITEM_STATUS.SENT ? { ...i, status: ORDER_ITEM_STATUS.READY } : i);
        if (itemsToMark.length > 0) {
          addEvent(ORDER_EVENT_TYPE.ITEM_READY, o, `Chef completed: ${itemsToMark.map(i => `${i.name} x${i.quantity}`).join(', ')}`);
        }
      } else if (status === ORDER_STATUS.DELIVERED) {
        const itemsToMark = o.items.filter(i => i.status === ORDER_ITEM_STATUS.READY);
        updatedItems = o.items.map(i => i.status === ORDER_ITEM_STATUS.READY ? { ...i, status: ORDER_ITEM_STATUS.SERVED } : i);
        if (itemsToMark.length > 0) {
          addEvent(ORDER_EVENT_TYPE.ITEM_SERVED, o, `Served to guest: ${itemsToMark.map(i => `${i.name} x${i.quantity}`).join(', ')}`);
        }
      }
      return { ...o, status, items: updatedItems };
    }));

    // Sync to backend
    if (isBackendOnline) {
      const targetOrder = orders.find(o => o.id === orderId);
      const success = await apiCall(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          status,
          version: targetOrder?.version // Send local version for conflict detection
        }),
      });

      // If update failed (e.g., conflict 409), refresh from backend
      if (!success) {
        console.log('[Sync] Update failed or conflict detected, refreshing...');
        loadFromBackend();
      }
    }
  }, [isBackendOnline, orders, loadFromBackend]);

  const updateItemStatus = useCallback(async (orderId: string, itemId: string, status: OrderItem['status']) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const updatedItems = o.items.map(i => 
        ((i.dbId === itemId || String(i.id) === itemId) && i.status !== ORDER_ITEM_STATUS.SERVED) ? { ...i, status } : i
      );
      return { ...o, items: updatedItems };
    }));

    if (isBackendOnline) {
      const targetOrder = orders.find(o => o.id === orderId);
      const targetItem = targetOrder?.items.find(i => i.dbId === itemId || String(i.id) === itemId);
      
      if (targetItem?.dbId) {
        await apiCall(`/orders/${orderId}/items/${targetItem.dbId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        });
      }
    }
  }, [isBackendOnline, orders]);

  const cancelOrder = useCallback(async (orderId: string) => {
    // 1. Identify if it's a local draft or a DB order
    const isDbOrder = !orderId.startsWith('ORD-');
    const orderToCancel = orders.find(o => o.id === orderId);
    
    // 2. Log event only if the order was already sent to kitchen (not a draft correction)
    if (orderToCancel && orderToCancel.status !== ORDER_STATUS.DRAFT) {
      const itemsList = orderToCancel.items
        .map(i => `${i.name} x${i.quantity}`)
        .join(', ');
      
      const details = `Order cancelled for ${orderToCancel.tableId ? `Table #${orderToCancel.tableId}` : 'Takeaway'}. Items: ${itemsList || 'No items'}`;
      
      addEvent(ORDER_EVENT_TYPE.ORDER_CANCELLED, orderToCancel, details);
    }
    // Draft orders are silently deleted — no record needed

    // 3. Update local UI immediately
    setOrders(prev => prev.filter(o => o.id !== orderId));
    if (activeOrder?.id === orderId) {
      setActiveTableId(null);
    }

    // 3. Sync to backend if needed
    if (isDbOrder && isBackendOnline) {
      await apiCall(`/orders/${orderId}`, { method: 'DELETE' });
    }
    
    // Broadcast via socket is handled by the server emit, 
    // but for local ORD- orders we rely on the setOrders state change.
  }, [activeOrder, isBackendOnline]);

  const reportLoss = useCallback(async (orderId: string) => {
    const orderToMark = orders.find(o => o.id === orderId);
    if (!orderToMark) return;

    // 1. Log event
    const itemsList = orderToMark.items.map(i => `${i.name} x${i.quantity}`).join(', ');
    addEvent(ORDER_EVENT_TYPE.ORDER_WASTED, orderToMark, `FOOD LOSS: ${orderToMark.tableId ? `Table #${orderToMark.tableId}` : 'Takeaway'} left without payment. Items: ${itemsList}`);

    // 2. Update local UI
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: ORDER_STATUS.WASTED } : o));
    if (activeOrder?.id === orderId) {
      setActiveTableId(null);
    }

    // 3. Sync to backend (don't delete, just update status to wasted)
    if (!orderId.startsWith('ORD-') && isBackendOnline) {
      await apiCall(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: ORDER_STATUS.WASTED }),
      });
    }
  }, [orders, activeOrder, isBackendOnline]);
  
  const cancelOrderItem = useCallback(async (orderId: string, itemId: string) => {
    // 1. Update UI locally using functional update to ensure latest state
    setOrders(prev => {
      const order = prev.find(o => o.id === orderId);
      if (!order) return prev;

      const newItems = order.items.filter(i => {
        const isMatch = i.dbId ? (i.dbId === itemId) : (String(i.id) === itemId);
        return !isMatch;
      });
      
      return prev.map(o => o.id === orderId ? { ...o, items: newItems, total: recalculateTotal(newItems) } : o);
    });

    // 2. Log event
    const order = orders.find(o => o.id === orderId);
    if (order) addEvent(ORDER_EVENT_TYPE.ORDER_CANCELLED, order, `Item Removed`);

    // 3. Sync to Backend
    if (!orderId.startsWith('ORD-') && isBackendOnline && itemId.length > 10) {
      await apiCall(`/orders/${orderId}/items/${itemId}`, { method: 'DELETE' });
    }
  }, [orders, isBackendOnline]);

  const reportLossOrderItem = useCallback(async (orderId: string, itemId: string) => {
    // 1. Update UI locally
    setOrders(prev => {
      const order = prev.find(o => o.id === orderId);
      if (!order) return prev;

      const newItems = order.items.map(i => {
        const isMatch = i.dbId ? (i.dbId === itemId) : (String(i.id) === itemId);
        return isMatch ? { ...i, status: ORDER_ITEM_STATUS.WASTED } : i;
      });
      
      return prev.map(o => o.id === orderId ? { ...o, items: newItems, total: recalculateTotal(newItems) } : o);
    });

    // 2. Log event
    const order = orders.find(o => o.id === orderId);
    if (order) addEvent(ORDER_EVENT_TYPE.ORDER_WASTED, order, `Item Loss Reported`);

    // 3. Sync to Backend
    if (!orderId.startsWith('ORD-') && isBackendOnline && itemId.length > 10) {
      await apiCall(`/orders/${orderId}/items/${itemId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: ORDER_ITEM_STATUS.WASTED }),
      });
      await apiCall(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: order?.status || ORDER_STATUS.SENT }),
      });
    }
  }, [orders, isBackendOnline]);

  return (
    <OrderContext.Provider value={{
      orders,
      activeOrder,
      paymentStatus,
      currentPaymentMethod,
      payments,
      events,
      isBackendOnline,
      setActiveTable,
      setActiveOrderId,
      startTakeaway,
      addToCart,
      removeFromCart,
      updateQuantity,
      sendToKitchen,
      initiatePayment,
      confirmPayment,
      cancelPayment,
      updateOrderStatus,
      updateItemStatus,
      cancelOrder,
      reportLoss,
      cancelOrderItem,
      reportLossOrderItem,
      loadFromBackend,
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within an OrderProvider');
  return context;
};
