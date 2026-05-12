# Transaction Loop: Technical Walkthrough

We have successfully transitioned the POS system from a "static shell" to a functional "business tool." The system now handles the full transaction lifecycle.

## 1. The Core: Order Engine (`OrderContext.tsx`)
The `OrderContext` acts as the single source of truth for all transactions. It manages:
- **Draft State**: Orders currently being built at the table.
- **Sent State**: Orders submitted to the kitchen.
- **Ready State**: Orders cooked and waiting for the waiter.
- **Paid State**: Finalized transactions.

## 2. Order Flow in Action
### Step A: Table Selection & Cart
When a waiter selects a table, the system checks for an existing `draft` order.
- **Task 1 (Cart)**: Functions like `addToCart`, `updateQuantity`, and `removeFromCart` instantly update the global state.
- **Live Calculation**: The `total` is computed in real-time, including local Kazakhstani Tenge (₸) formatting.

### Step B: Kitchen Integration (`KDSModule.tsx`)
- **Task 2 (Send to Kitchen)**: Clicking "Send" moves the order from `draft` to `sent`.
- **Task 3 (KDS Display)**: The Kitchen Screen automatically picks up `sent` orders.
- **Elapsed Time**: A real-time timer tracks how long the kitchen has been working on the order.
- **State Transition**: Chefs click "Mark as Ready" to move orders to the "Ready to Serve" column.

### Step C: Payment Loop
- **Task 4 (Payment)**: The "Cash" and "Kaspi" buttons mark orders as `paid`. 
- **MVP Strategy**: As per your recommendation, we use a manual confirmation flow which is highly effective for local Almaty restaurants.

## 3. Project Structure Refactor
The project is now organized by business domain:
```text
/src
  /modules
    /order
      OrderContext.tsx  <-- The Brain
    KDSModule.tsx       <-- Kitchen Display
    MenuModule.tsx      <-- Menu Management
```

---

> [!TIP]
> The system is now ready for a **Live Demo**. You can select a table, add items, see them appear in the Kitchen tab, mark them as ready, and complete the payment.

**Would you like me to implement the Kaspi QR Modal next to make the payment flow even more realistic?**
