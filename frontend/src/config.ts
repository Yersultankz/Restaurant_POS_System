/**
 * Global Configuration for Restaurant POS
 */

export const CONFIG = {
  // Backend API URL. VITE_API_URL is preferred; VITE_API_BASE_URL is kept for compatibility.
  API_BASE: import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:4000/api`,
  
  // Table Management
  TABLE_COUNT: parseInt(import.meta.env.VITE_TABLE_COUNT || '16'),
  
  // Billing & Finance
  VAT_RATE: parseFloat(import.meta.env.VITE_VAT_RATE || '0.16'), // 16%
  DISCOUNT_OPTIONS: [0, 5, 10, 15, 20], // Percentage discount options
  
  // KDS Configuration
  GHOST_ITEM_TIMEOUT: 5000, // 5 seconds for cancelled items to fade out
  
  // Roles & Permissions
  ROLES: {
    WAITER: 'waiter',
    CASHIER: 'cashier',
    CHEF: 'chef',
    BOSS: 'boss'
  } as const
};
