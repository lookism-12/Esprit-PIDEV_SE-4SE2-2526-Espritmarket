# Frontend Implementation Plan - Order System Integration

## Current State Analysis

### ✅ Backend Status (COMPLETE)
- Order/OrderItem entities created
- OrderService fully implemented  
- Checkout creates Order entities in MongoDB
- Provider dashboard reads from Order collection
- All backend endpoints working

### ⚠️ Frontend Status (NEEDS IMPLEMENTATION)
- Cart service uses old CartResponse for checkout
- Order service needs OrderResponse type
- Profile page has tab structure but Orders tab incomplete
- Order deletion not implemented
- Loyalty integration incomplete

---

## Implementation Tasks

### PHASE 1: Create Order Models ✅ PRIORITY

**File**: `frontend/src/app/front/models/order.model.ts` (NEW)

```typescript
export interface OrderResponse {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: OrderStatus;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  couponCode?: string;
  discountId?: string;
  shippingAddress: string;
  paymentMethod: string;
  paymentId?: string;
  orderNumber: string;
  createdAt: string;
  paidAt?: string;
  lastUpdated: string;
  cancellationReason?: string;
  cancelledAt?: string;
  items: OrderItemResponse[];
}

export interface OrderItemResponse {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
  status: OrderItemStatus;
  cancelledQuantity?: number;
  refundedAmount?: number;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  PARTIALLY_CANCELLED = 'PARTIALLY_CANCELLED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  REFUNDED = 'REFUNDED'
}

export enum OrderItemStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  PARTIALLY_CANCELLED = 'PARTIALLY_CANCELLED',
  REFUNDED = 'REFUNDED'
}

export interface CreateOrderRequest {
  shippingAddress: string;
  paymentMethod: string;
}

export interface ConfirmPaymentRequest {
  paymentId: string;
}

export interface CancelOrderRequest {
  reason: string;
}
```

---

### PHASE 2: Update Cart Service ✅ PRIORITY

**File**: `frontend/src/app/front/core/cart.service.ts` (MODIFY)

**Changes**:
1. Update checkout() to return `OrderResponse`
2. Import new order models
3. Update error handling

```typescript
import { OrderResponse, CreateOrderRequest } from '../models/order.model';

/**
 * Checkout (convert cart to order)
 * Returns OrderResponse from new Order entity
 */
checkout(checkoutData: CreateOrderRequest): Observable<OrderResponse> {
  this.isLoading.set(true);
  this.error.set(null);

  return this.http.post<OrderResponse>(`${this.apiUrl}/checkout`, checkoutData).pipe(
    tap((order) => {
      console.log('✅ Order created:', order);
      // Clear cart state after successful checkout
      this.cart.set(null);
      this.cartItems.set([]);
      this.cartUpdateSubject.next(true);
      this.isLoading.set(false);
    }),
    catchError((error) => {
      console.error('❌ Failed to checkout:', error);
      this.error.set(this.getErrorMessage(error));
      this.isLoading.set(false);
      return throwError(() => error);
    })
  );
}
```

---

### PHASE 3: Update Order Service ✅ PRIORITY

**File**: `frontend/src/app/front/core/order.service.ts` (MODIFY)

**Changes**:
1. Replace `CartResponse` with `OrderResponse`
2. Add new methods for order management
3. Update status handling

```typescript
import { OrderResponse, OrderItemResponse, OrderStatus, CreateOrderRequest, ConfirmPaymentRequest, CancelOrderRequest } from '../models/order.model';

/**
 * Get all orders for the current user
 */
getMyOrders(): Observable<OrderResponse[]> {
  this.isLoading.set(true);
  this.error.set(null);

  return this.http.get<OrderResponse[]>(this.apiUrl).pipe(
    tap(orders => {
      this.orders.set(orders);
      this.isLoading.set(false);
    }),
    catchError(error => {
      this.error.set('Failed to load orders');
      this.isLoading.set(false);
      return throwError(() => error);
    })
  );
}

/**
 * Get specific order by ID
 */
getOrderById(orderId: string): Observable<OrderResponse> {
  this.isLoading.set(true);
  
  return this.http.get<OrderResponse>(`${this.apiUrl}/${orderId}`).pipe(
    tap(order => {
      this.selectedOrder.set(order);
      this.isLoading.set(false);
    }),
    catchError(error => {
      this.error.set('Failed to load order');
      this.isLoading.set(false);
      return throwError(() => error);
    })
  );
}

/**
 * Confirm payment for order (PENDING → PAID)
 */
confirmPayment(orderId: string, paymentId: string): Observable<OrderResponse> {
  this.isLoading.set(true);
  
  const request: ConfirmPaymentRequest = { paymentId };
  
  return this.http.post<OrderResponse>(`${this.apiUrl}/${orderId}/confirm-payment`, request).pipe(
    tap(order => {
      this.selectedOrder.set(order);
      this.isLoading.set(false);
      console.log('✅ Payment confirmed:', order);
    }),
    catchError(error => {
      this.error.set('Failed to confirm payment');
      this.isLoading.set(false);
      return throwError(() => error);
    })
  );
}

/**
 * Cancel order - ONLY if status = PENDING
 * Backend will set status to CANCELLED and restore stock
 */
cancelOrder(orderId: string, reason: string): Observable<RefundSummaryDTO> {
  this.isLoading.set(true);
  
  const request: CancelOrderRequest = { reason };
  
  return this.http.post<RefundSummaryDTO>(`${this.apiUrl}/${orderId}/cancel`, request).pipe(
    tap(refundSummary => {
      this.isLoading.set(false);
      console.log('✅ Order cancelled, stock restored:', refundSummary);
    }),
    catchError(error => {
      this.error.set('Failed to cancel order');
      this.isLoading.set(false);
      return throwError(() => error);
    })
  );
}

/**
 * Check if order can be cancelled (ONLY PENDING status)
 */
canCancelOrder(order: OrderResponse): boolean {
  return order.status === OrderStatus.PENDING;
}
```

---

### PHASE 4: Update Profile Component ✅ PRIORITY

**File**: `frontend/src/app/front/pages/profile/profile.ts` (MODIFY)

**Changes**:
1. Import `OrderResponse` instead of `CartResponse`
2. Update order loading logic
3. Add order cancellation method

```typescript
import { OrderResponse } from '../../models/order.model';

// Update signal type
realOrders = signal<OrderResponse[]>([]);
shopOrders = signal<OrderResponse[]>([]);

// Update loadCommon method
private loadCommon(): void {
  this.isLoading.set(true);
  forkJoin({
    orders:  this.orderService.getMyOrders().pipe(catchError(() => of([]))),
    notifs:  this.notificationService.getMy().pipe(catchError(() => of([]))),
    loyalty: this.loyaltyService.getAccount().pipe(catchError(() => of(null)))
  }).subscribe(({ orders, notifs, loyalty }) => {
    this.realOrders.set(orders as OrderResponse[]);
    this.notifications.set(notifs as any[]);
    if (loyalty) this.loyaltyAccount.set(loyalty as LoyaltyAccount);
    this.isLoading.set(false);
  });
  this.favoriteService.loadMyFavorites();
}

// Add order cancellation method
cancelOrder(orderId: string): void {
  const order = this.realOrders().find(o => o.id === orderId);
  if (!order) return;
  
  // Check if order can be cancelled (ONLY PENDING)
  if (order.status !== 'PENDING') {
    alert('Only pending orders can be cancelled');
    return;
  }
  
  const reason = prompt('Please provide a reason for cancellation:');
  if (!reason) return;
  
  if (!confirm(`Cancel order ${order.orderNumber}? Stock will be restored.`)) return;
  
  this.orderService.cancelOrder(orderId, reason).subscribe({
    next: (refundSummary) => {
      console.log('✅ Order cancelled:', refundSummary);
      // Refresh orders list
      this.loadCommon();
      alert('Order cancelled successfully. Stock has been restored.');
    },
    error: (error) => {
      console.error('❌ Failed to cancel order:', error);
      alert('Failed to cancel order. Please try again.');
    }
  });
}
```

---

### PHASE 5: Update Profile HTML Template ✅ PRIORITY

**File**: `frontend/src/app/front/pages/profile/profile.html` (MODIFY)

**Add Orders Tab Content** (after the existing tabs section):

```html
<!-- ORDERS TAB -->
@if (activeTab() === 'orders') {
  <div class="rounded-2xl p-6" style="background-color:var(--card-bg);border:1px solid var(--border)">
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-xl font-black" style="color:var(--text-color)">🛍️ My Orders</h2>
      <span class="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
        {{ realOrders().length }} orders
      </span>
    </div>

    @if (isLoading()) {
      <div class="text-center py-12" style="color:var(--muted)">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading orders...</p>
      </div>
    } @else if (realOrders().length === 0) {
      <div class="text-center py-12" style="color:var(--muted)">
        <p class="text-4xl mb-3">📦</p>
        <p class="font-semibold">No orders yet</p>
        <p class="text-sm mt-1">Start shopping to see your orders here</p>
        <a routerLink="/products" class="inline-block mt-4 px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all">
          Browse Products
        </a>
      </div>
    } @else {
      <div class="space-y-3">
        @for (order of realOrders(); track order.id) {
          <div class="rounded-xl p-4 transition-all hover:shadow-md" style="background-color:var(--subtle);border:1px solid var(--border)">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-black text-sm" style="color:var(--text-color)">{{ order.orderNumber }}</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" [ngClass]="getStatusClass(order.status)">
                    {{ order.status }}
                  </span>
                </div>
                <p class="text-xs" style="color:var(--muted)">{{ formatDate(order.createdAt) }}</p>
              </div>
              <div class="flex items-center gap-3">
                <div class="text-right">
                  <p class="text-xs font-semibold" style="color:var(--muted)">Total</p>
                  <p class="text-lg font-black text-primary">${{ order.finalAmount.toFixed(2) }}</p>
                </div>
                @if (order.status === 'PENDING') {
                  <button (click)="cancelOrder(order.id)" 
                    class="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all">
                    ❌ Cancel
                  </button>
                }
              </div>
            </div>

            <!-- Order Items -->
            <div class="space-y-2 mt-3 pt-3" style="border-top:1px solid var(--border)">
              @for (item of order.items; track item.id) {
                <div class="flex items-center justify-between text-sm">
                  <div class="flex-1">
                    <p class="font-semibold" style="color:var(--text-color)">{{ item.productName }}</p>
                    <p class="text-xs" style="color:var(--muted)">Qty: {{ item.quantity }} × ${{ item.productPrice.toFixed(2) }}</p>
                  </div>
                  <p class="font-bold" style="color:var(--text-color)">${{ item.subtotal.toFixed(2) }}</p>
                </div>
              }
            </div>

            <!-- Shipping Address -->
            @if (order.shippingAddress) {
              <div class="mt-3 pt-3 text-xs" style="border-top:1px solid var(--border);color:var(--muted)">
                <span class="font-semibold">📍 Shipping:</span> {{ order.shippingAddress }}
              </div>
            }
          </div>
        }
      </div>
    }
  </div>
}
```

---

### PHASE 6: Update Loyalty Service Integration

**File**: `frontend/src/app/front/core/loyalty.service.ts` (VERIFY)

**Ensure**:
- Loyalty points are fetched from backend
- NO frontend calculation of points
- Points display only

---

## Testing Checklist

### Backend Testing
- [ ] Checkout creates Order in MongoDB
- [ ] Order has correct status (PENDING)
- [ ] OrderItems are created
- [ ] Cart is cleared after checkout
- [ ] Provider dashboard shows orders
- [ ] Statistics are correct

### Frontend Testing
- [ ] Cart checkout returns OrderResponse
- [ ] Orders tab displays orders correctly
- [ ] Order status badges show correct colors
- [ ] Cancel button only shows for PENDING orders
- [ ] Cancel order restores stock
- [ ] Loyalty points display correctly
- [ ] Order items display correctly
- [ ] Shipping address displays
- [ ] Order number displays

### Integration Testing
- [ ] End-to-end: Add to cart → Checkout → View in Orders tab
- [ ] Cancel PENDING order → Verify stock restored
- [ ] Try to cancel PAID order → Should fail
- [ ] Provider sees order in dashboard
- [ ] Loyalty points update after order

---

## Implementation Order

1. ✅ Create `order.model.ts` (NEW FILE)
2. ✅ Update `cart.service.ts` checkout method
3. ✅ Update `order.service.ts` methods and types
4. ✅ Update `profile.ts` component logic
5. ✅ Update `profile.html` Orders tab UI
6. ✅ Test end-to-end flow
7. ✅ Fix any compilation errors
8. ✅ Test in browser

---

## Design System Compliance

### Colors (USE EXISTING ONLY)
- Primary: `var(--primary)` (red/maroon)
- Background: `var(--bg-color)`
- Card: `var(--card-bg)`
- Border: `var(--border)`
- Text: `var(--text-color)`
- Muted: `var(--muted)`
- Subtle: `var(--subtle)`

### Status Colors (EXISTING)
- PENDING: `bg-yellow-100 text-yellow-800`
- PAID: `bg-green-100 text-green-800`
- PROCESSING: `bg-purple-100 text-purple-800`
- SHIPPED: `bg-indigo-100 text-indigo-800`
- DELIVERED: `bg-green-100 text-green-800`
- CANCELLED: `bg-red-100 text-red-800`

### Typography
- Use existing font weights and sizes
- Maintain consistent spacing
- Follow existing component patterns

---

## Success Criteria

### Must Have
- [ ] Orders tab shows real orders from backend
- [ ] Order cancellation works (PENDING only)
- [ ] Stock restored on cancellation
- [ ] Loyalty points display correctly
- [ ] No new colors introduced
- [ ] Dark mode works
- [ ] Responsive design maintained

### Nice to Have
- [ ] Order tracking timeline
- [ ] Order search/filter
- [ ] Order details modal
- [ ] Print order receipt
- [ ] Email order confirmation

---

**Status**: Ready for Implementation
**Priority**: HIGH
**Estimated Time**: 2-3 hours
**Dependencies**: Backend Order system (COMPLETE ✅)
