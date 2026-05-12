import React, { createContext, useContext, useState, useCallback } from 'react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  notify: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((message: string, type: NotificationType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      
      {/* Notification Portal / UI */}
      <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-3 pointer-events-none">
        {notifications.map(n => (
          <div 
            key={n.id}
            className={`pointer-events-auto px-6 py-4 rounded-2xl shadow-2xl animate-slide-in flex items-center gap-3 min-w-[300px] border backdrop-blur-md ${
              n.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' :
              n.type === 'error' ? 'bg-red-600/90 border-red-500 text-white' :
              n.type === 'warning' ? 'bg-amber-500/90 border-amber-400 text-white' :
              'bg-slate-800/90 border-slate-700 text-white'
            }`}
          >
            <span className="text-xl">
              {n.type === 'success' ? '✅' : 
               n.type === 'error' ? '🚫' : 
               n.type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <p className="font-bold text-sm tracking-wide">{n.message}</p>
            <button 
              onClick={() => setNotifications(prev => prev.filter(notif => notif.id !== n.id))}
              className="ml-auto opacity-50 hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotify = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotify must be used within a NotificationProvider');
  return context;
};
