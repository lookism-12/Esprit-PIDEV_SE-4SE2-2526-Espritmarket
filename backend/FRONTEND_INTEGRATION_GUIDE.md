# Frontend Integration Guide - Order Workflow

## Quick Reference for Frontend Developers

---

## 1. Order Status Enum (TypeScript)

```typescript
export enum OrderStatus {
  PENDING = 'PENDING',           // Awaiting provider confirmation
  CONFIRMED = 'CONFIRMED',       // Provider accepted
  PREPARING = 'PREPARING',       // Delivery preparing package
  IN_TRANSIT = 'IN_TRANSIT',     // Out for delivery
  DELIVERED = 'DELIVERED',       // Successfully delivered
  RETURNED = 'RETURNED',         // Returned to shop (failed delivery)
  CANCELLED = 'CANCELLED'        // Cancelled before shipping
}

export enum PaymentStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',  // Cash not yet collected
  PAID = 'PAID',                        // Payment completed
  FAILED = 'FAILED'                     // Payment failed
}
```

---

## 2. Provider Dashboard Updates

### Remove These Status Options:
❌ PAID (this is PaymentStatus, not OrderStatus)
❌ OUT_FOR_DELIVERY (replaced by IN_TRANSIT)
❌ ACCEPTED (replaced by CONFIRMED)
❌ PROCESSING (replaced by PREPARING)
❌ DECLINED (replaced by CANCELLED)
❌ SHIPPED (replaced by IN_TRANSIT)

### Provider Can Only:
```typescript
// From PENDING status
confirmOrder(orderId: string): Observable<OrderResponse>
cancelOrder(orderId: string, reason: string): Observable<OrderResponse>

// Status dropdown should show:
getAvailableProviderActions(order: Order): string[] {
  if (order.status === 'PENDING') {
    return ['CONFIRMED', 'CANCELLED'];
  }
  return []; // No actions available for other statuses
}
```

### Provider Dashboard Filters:
```typescript
const statusFilters = [
  { value: 'ALL', label: 'All Orders' },
  { value: 'PENDING', label: 'Pending Confirmation' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PREPARING', label: 'Being Prepared' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'RETURNED', label: 'Returned' },
  { value: 'CANCELLED', label: 'Cancelled' }
];
```

---

## 3. Delivery Dashboard Updates

### Delivery Can:
```typescript
// From CONFIRMED status
acceptOrder(orderId: string): Observable<OrderResponse> {
  return this.http.put(`/api/delivery/orders/${orderId}/status`, {
    status: 'PREPARING',
    actor: 'DELIVERY'
  });
}

// From PREPARING status
startDelivery(orderId: string): Observable<OrderResponse> {
  return this.http.put(`/api/delivery/orders/${orderId}/status`, {
    status: 'IN_TRANSIT',
    actor: 'DELIVERY'
  });
}

// From IN_TRANSIT status
markDelivered(orderId: string): Observable<OrderResponse> {
  return this.http.put(`/api/delivery/orders/${orderId}/status`, {
    status: 'DELIVERED',
    actor: 'DELIVERY'
  });
}

markReturned(orderId: string, reason: string): Observable<OrderResponse> {
  return this.http.put(`/api/delivery/orders/${orderId}/status`, {
    status: 'RETURNED',
    actor: 'DELIVERY',
    reason: reason
  });
}
```

---

## 4. Status Badge Colors

```typescript
getStatusBadgeClass(status: OrderStatus): string {
  const statusColors = {
    'PENDING': 'badge-warning',        // Yellow
    'CONFIRMED': 'badge-info',         // Blue
    'PREPARING': 'badge-purple',       // Purple
    'IN_TRANSIT': 'badge-primary',     // Orange
    'DELIVERED': 'badge-success',      // Green
    'RETURNED': 'badge-danger',        // Red
    'CANCELLED': 'badge-secondary'     // Gray
  };
  return statusColors[status] || 'badge-secondary';
}

getStatusIcon(status: OrderStatus): string {
  const statusIcons = {
    'PENDING': 'clock',
    'CONFIRMED': 'check-circle',
    'PREPARING': 'box',
    'IN_TRANSIT': 'truck',
    'DELIVERED': 'check-double',
    'RETURNED': 'undo',
    'CANCELLED': 'times-circle'
  };
  return statusIcons[status] || 'question';
}
```

---

## 5. Order Timeline Component

```typescript
getOrderTimeline(order: Order): TimelineEvent[] {
  const timeline: TimelineEvent[] = [];
  
  if (order.createdAt) {
    timeline.push({
      status: 'PENDING',
      label: 'Order Placed',
      timestamp: order.createdAt,
      icon: 'shopping-cart',
      color: 'warning'
    });
  }
  
  if (order.confirmedAt) {
    timeline.push({
      status: 'CONFIRMED',
      label: 'Confirmed by Provider',
      timestamp: order.confirmedAt,
      icon: 'check-circle',
      color: 'info'
    });
  }
  
  if (order.preparingAt) {
    timeline.push({
      status: 'PREPARING',
      label: 'Preparing Package',
      timestamp: order.preparingAt,
      icon: 'box',
      color: 'purple'
    });
  }
  
  if (order.deliveryStartedAt) {
    timeline.push({
      status: 'IN_TRANSIT',
      label: 'Out for Delivery',
      timestamp: order.deliveryStartedAt,
      icon: 'truck',
      color: 'primary'
    });
  }
  
  if (order.deliveredAt) {
    timeline.push({
      status: 'DELIVERED',
      label: 'Delivered Successfully',
      timestamp: order.deliveredAt,
      icon: 'check-double',
      color: 'success'
    });
  }
  
  if (order.returnedAt) {
    timeline.push({
      status: 'RETURNED',
      label: 'Returned to Shop',
      timestamp: order.returnedAt,
      icon: 'undo',
      color: 'danger'
    });
  }
  
  if (order.cancelledAt) {
    timeline.push({
      status: 'CANCELLED',
      label: 'Order Cancelled',
      timestamp: order.cancelledAt,
      icon: 'times-circle',
      color: 'secondary'
    });
  }
  
  return timeline;
}
```

---

## 6. Order Model Updates

```typescript
export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  
  // Amounts
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  
  // Payment & Shipping
  paymentMethod: 'CARD' | 'CASH';
  shippingAddress: string;
  
  // Timestamps
  createdAt: Date;
  paidAt?: Date;
  confirmedAt?: Date;
  preparingAt?: Date;          // NEW
  deliveryStartedAt?: Date;
  deliveredAt?: Date;
  returnedAt?: Date;           // NEW
  cancelledAt?: Date;
  
  // Items
  items: OrderItem[];
  
  // User
  user: User;
}
```

---

## 7. Client Order Actions

```typescript
// Client can cancel within 7 days
canClientCancel(order: Order): boolean {
  if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
    return false;
  }
  
  const orderDate = new Date(order.createdAt);
  const now = new Date();
  const daysSinceOrder = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysSinceOrder <= 7;
}

cancelOrder(orderId: string, reason: string): Observable<RefundSummary> {
  return this.http.post(`/api/orders/${orderId}/cancel`, {
    reason: reason
  });
}
```

---

## 8. Payment Status Display

```typescript
getPaymentStatusLabel(order: Order): string {
  if (order.paymentStatus === 'PAID') {
    return 'Paid';
  }
  
  if (order.paymentStatus === 'PENDING_PAYMENT') {
    if (order.paymentMethod === 'CASH') {
      return 'Cash on Delivery';
    }
    return 'Payment Pending';
  }
  
  return 'Payment Failed';
}

getPaymentStatusBadge(paymentStatus: PaymentStatus): string {
  const badges = {
    'PAID': 'badge-success',
    'PENDING_PAYMENT': 'badge-warning',
    'FAILED': 'badge-danger'
  };
  return badges[paymentStatus] || 'badge-secondary';
}
```

---

## 9. Statistics Updates

### Provider Dashboard Statistics:
```typescript
interface ProviderStats {
  pendingOrders: number;        // PENDING status
  confirmedOrders: number;      // CONFIRMED status
  preparingOrders: number;      // PREPARING status
  inTransitOrders: number;      // IN_TRANSIT status
  deliveredOrders: number;      // DELIVERED status
  returnedOrders: number;       // RETURNED status (NEW)
  cancelledOrders: number;      // CANCELLED status
  totalRevenue: number;         // Sum of DELIVERED orders with PAID status
}
```

### Remove These Stats:
❌ `paidOrders` (use `deliveredOrders` instead)
❌ `outForDeliveryOrders` (use `inTransitOrders` instead)

---

## 10. API Endpoints

### Provider Endpoints:
```
GET    /api/provider/dashboard/orders          - Get all provider orders
GET    /api/provider/dashboard/statistics      - Get provider statistics
PUT    /api/provider/orders/{id}/confirm       - Confirm order (PENDING → CONFIRMED)
PUT    /api/provider/orders/{id}/cancel        - Cancel order (PENDING → CANCELLED)
```

### Delivery Endpoints:
```
GET    /api/delivery/orders                    - Get delivery orders
PUT    /api/delivery/orders/{id}/accept        - Accept order (CONFIRMED → PREPARING)
PUT    /api/delivery/orders/{id}/start         - Start delivery (PREPARING → IN_TRANSIT)
PUT    /api/delivery/orders/{id}/deliver       - Mark delivered (IN_TRANSIT → DELIVERED)
PUT    /api/delivery/orders/{id}/return        - Mark returned (IN_TRANSIT → RETURNED)
```

### Client Endpoints:
```
GET    /api/orders                             - Get user orders
GET    /api/orders/paginated                   - Get paginated orders
GET    /api/orders/{id}                        - Get order details
POST   /api/orders/{id}/cancel                 - Cancel order (within 7 days)
```

---

## 11. Error Handling

```typescript
handleOrderStatusUpdate(orderId: string, newStatus: OrderStatus) {
  this.orderService.updateOrderStatus(orderId, newStatus).subscribe({
    next: (order) => {
      this.showSuccess(`Order ${order.orderNumber} updated to ${newStatus}`);
      this.loadOrders(); // Refresh list
    },
    error: (error) => {
      if (error.status === 400) {
        // Invalid transition
        this.showError(error.error.message || 'Invalid status transition');
      } else if (error.status === 403) {
        // Permission denied
        this.showError('You do not have permission to perform this action');
      } else {
        this.showError('Failed to update order status');
      }
    }
  });
}
```

---

## 12. Migration Notes

### Handling Old Orders:
The backend automatically normalizes old statuses. Frontend should:

1. **Display normalized statuses** - Backend returns current statuses
2. **Remove old status filters** - Don't filter by PAID, ACCEPTED, etc.
3. **Update status dropdowns** - Only show current statuses
4. **Test with old data** - Verify old orders display correctly

### Testing Checklist:
- [ ] Provider can confirm/cancel PENDING orders
- [ ] Provider cannot change CONFIRMED orders (only delivery can)
- [ ] Delivery can move through PREPARING → IN_TRANSIT → DELIVERED/RETURNED
- [ ] Client can cancel within 7 days
- [ ] Status badges show correct colors
- [ ] Timeline shows all status changes
- [ ] Statistics calculate correctly
- [ ] Old orders display with normalized statuses

---

## 13. Common Mistakes to Avoid

❌ **DON'T** use PAID as an OrderStatus
✅ **DO** use PaymentStatus.PAID

❌ **DON'T** allow provider to change to DELIVERED
✅ **DO** only allow delivery to mark DELIVERED

❌ **DON'T** show OUT_FOR_DELIVERY status
✅ **DO** use IN_TRANSIT instead

❌ **DON'T** allow cancellation after PREPARING
✅ **DO** only allow cancellation from PENDING/CONFIRMED

❌ **DON'T** forget to refresh order list after status update
✅ **DO** call `loadOrders()` after every status change

---

## Need Help?

Refer to:
- `ORDER_WORKFLOW_REFACTOR_SUMMARY.md` - Complete backend implementation details
- Backend logs - Show detailed status transitions and stock operations
- API documentation - Swagger UI at `/swagger-ui.html`
