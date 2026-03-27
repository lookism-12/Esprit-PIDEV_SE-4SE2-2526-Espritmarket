# 🚀 CRITICAL FIX #1: PORT MISMATCH + CART SERVICE - COMPLETE CODE GUIDE

**Priority:** 🔴 CRITICAL - Blocks Everything  
**Time to Fix:** 2.5 hours  
**Impact:** Unlocks 80% of functionality

---

## PART 1: FIX PORT MISMATCH (5 MINUTES)

### Current Problem
```
Frontend is looking for: http://localhost:8090/api
Backend is running on: http://localhost:8089
Result: All API calls fail with 404
```

### Step 1: Fix Environment Configuration

**File:** `frontend/src/environment.ts`

```typescript
// ❌ BEFORE (WRONG)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8090/api'
};

// ✅ AFTER (FIXED)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8089/api'
};
```

### Step 2: Verify Backend is Running on 8089

**File:** `backend/src/main/resources/application.properties`

```properties
# Verify this line exists:
server.port=8089

# If it's different, change it:
server.port=${SERVER_PORT:8089}
```

### Step 3: Test Connection

```bash
# Test backend is responding
curl http://localhost:8089/api/products

# Expected output:
# [{"id":"...","name":"...","price":...}, ...]

# If error, check:
# 1. Backend is running: curl http://localhost:8089/actuator/health
# 2. Frontend environment: cat frontend/src/environment.ts
```

---

## PART 2: IMPLEMENT CART SERVICE (2 HOURS)

### Current Problem
```typescript
// ❌ BROKEN: All methods return empty objects
getCart(): Observable<Cart> {
  return of({} as Cart);  // Empty object!
}
```

### Complete Fixed Service

**File:** `frontend/src/app/front/core/cart.service.ts`

```typescript
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { Cart, CartItem, CartSummary, AddToCartRequest, UpdateCartItemRequest } from '../models/cart.model';
import { environment } from '../../../environment';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly apiUrl = `${environment.apiUrl}/cart`;

  // Reactive state
  readonly cart = signal<Cart | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Computed values
  readonly itemCount = computed(() => {
    const cart = this.cart();
    return cart?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) ?? 0;
  });

  readonly cartTotal = computed(() => {
    const cart = this.cart();
    if (!cart) return 0;
    
    const itemsTotal = cart.items?.reduce((sum, item) => 
      sum + ((item.productPrice || 0) * (item.quantity || 0)), 0) ?? 0;
    
    const discount = cart.totalDiscount || 0;
    const tax = cart.tax || 0;
    
    return itemsTotal - discount + tax;
  });

  readonly itemsTotal = computed(() => {
    const cart = this.cart();
    return cart?.items?.reduce((sum, item) => 
      sum + ((item.productPrice || 0) * (item.quantity || 0)), 0) ?? 0;
  });

  constructor(private http: HttpClient) {
    this.initializeCart();
  }

  /**
   * Initialize cart on service creation
   */
  private initializeCart(): void {
    this.getCart().subscribe({
      next: (cart) => {
        console.log('✅ Cart initialized:', cart);
        this.cart.set(cart);
      },
      error: (err) => {
        console.warn('⚠️ Failed to initialize cart:', err);
        // Set empty cart if retrieval fails
        this.cart.set({ id: '', items: [], total: 0 } as Cart);
      }
    });
  }

  /**
   * Get current user's cart
   * @returns Observable with cart data
   */
  getCart(): Observable<Cart> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<Cart>(`${this.apiUrl}`).pipe(
      tap((cart) => {
        console.log('✅ Fetched cart:', cart);
        this.cart.set(cart);
      }),
      catchError((err) => {
        console.error('❌ Error fetching cart:', err);
        const errorMsg = err.error?.message || 'Failed to fetch cart';
        this.error.set(errorMsg);
        return throwError(() => new Error(errorMsg));
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  /**
   * Add an item to the cart
   * @param request - Add to cart request with productId and quantity
   * @returns Observable with updated cart
   */
  addItem(request: AddToCartRequest): Observable<Cart> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.post<Cart>(`${this.apiUrl}/items`, request).pipe(
      tap((updatedCart) => {
        console.log('✅ Item added to cart:', updatedCart);
        this.cart.set(updatedCart);
      }),
      catchError((err) => {
        console.error('❌ Error adding item to cart:', err);
        const errorMsg = err.error?.message || 'Failed to add item to cart';
        this.error.set(errorMsg);
        return throwError(() => new Error(errorMsg));
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  /**
   * Remove an item from the cart
   * @param itemId - Cart item ID to remove
   * @returns Observable with updated cart
   */
  removeItem(itemId: string): Observable<void> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.delete<void>(`${this.apiUrl}/items/${itemId}`).pipe(
      tap(() => {
        console.log('✅ Item removed from cart');
        // Refetch cart after deletion
        this.getCart().subscribe();
      }),
      catchError((err) => {
        console.error('❌ Error removing item from cart:', err);
        const errorMsg = err.error?.message || 'Failed to remove item';
        this.error.set(errorMsg);
        return throwError(() => new Error(errorMsg));
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  /**
   * Update quantity of a cart item
   * @param itemId - Cart item ID
   * @param quantity - New quantity
   * @returns Observable with updated cart
   */
  updateQuantity(itemId: string, quantity: number): Observable<Cart> {
    this.isLoading.set(true);
    this.error.set(null);

    const request: UpdateCartItemRequest = { quantity };

    return this.http.put<Cart>(`${this.apiUrl}/items/${itemId}`, request).pipe(
      tap((updatedCart) => {
        console.log('✅ Item quantity updated:', updatedCart);
        this.cart.set(updatedCart);
      }),
      catchError((err) => {
        console.error('❌ Error updating quantity:', err);
        const errorMsg = err.error?.message || 'Failed to update quantity';
        this.error.set(errorMsg);
        return throwError(() => new Error(errorMsg));
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  /**
   * Clear all items from the cart
   * @returns Observable with empty cart
   */
  clearCart(): Observable<void> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.delete<void>(`${this.apiUrl}/clear`).pipe(
      tap(() => {
        console.log('✅ Cart cleared');
        this.cart.set({ id: '', items: [], total: 0 } as Cart);
      }),
      catchError((err) => {
        console.error('❌ Error clearing cart:', err);
        const errorMsg = err.error?.message || 'Failed to clear cart';
        this.error.set(errorMsg);
        return throwError(() => new Error(errorMsg));
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  /**
   * Apply a coupon to the cart
   * @param couponCode - Coupon code to apply
   * @returns Observable with updated cart including discount
   */
  applyCoupon(couponCode: string): Observable<Cart> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.post<Cart>(`${this.apiUrl}/coupon`, { code: couponCode }).pipe(
      tap((updatedCart) => {
        console.log('✅ Coupon applied:', updatedCart);
        this.cart.set(updatedCart);
      }),
      catchError((err) => {
        console.error('❌ Error applying coupon:', err);
        const errorMsg = err.error?.message || 'Failed to apply coupon';
        this.error.set(errorMsg);
        return throwError(() => new Error(errorMsg));
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  /**
   * Remove coupon from cart
   * @returns Observable with updated cart
   */
  removeCoupon(): Observable<Cart> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.delete<Cart>(`${this.apiUrl}/coupon`).pipe(
      tap((updatedCart) => {
        console.log('✅ Coupon removed:', updatedCart);
        this.cart.set(updatedCart);
      }),
      catchError((err) => {
        console.error('❌ Error removing coupon:', err);
        const errorMsg = err.error?.message || 'Failed to remove coupon';
        this.error.set(errorMsg);
        return throwError(() => new Error(errorMsg));
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  /**
   * Apply a discount to the cart
   * @param discountId - Discount ID to apply
   * @returns Observable with updated cart
   */
  applyDiscount(discountId: string): Observable<Cart> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.post<Cart>(`${this.apiUrl}/discount/${discountId}`, {}).pipe(
      tap((updatedCart) => {
        console.log('✅ Discount applied:', updatedCart);
        this.cart.set(updatedCart);
      }),
      catchError((err) => {
        console.error('❌ Error applying discount:', err);
        const errorMsg = err.error?.message || 'Failed to apply discount';
        this.error.set(errorMsg);
        return throwError(() => new Error(errorMsg));
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  /**
   * Checkout and create order from cart
   * @param shippingAddress - Shipping address
   * @param paymentMethod - Payment method
   * @returns Observable with checkout response
   */
  checkout(shippingAddress: string, paymentMethod: string): Observable<any> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.post<any>(`${this.apiUrl}/checkout`, {
      shippingAddress,
      paymentMethod
    }).pipe(
      tap((response) => {
        console.log('✅ Checkout successful:', response);
        // Clear cart after successful checkout
        this.cart.set({ id: '', items: [], total: 0 } as Cart);
      }),
      catchError((err) => {
        console.error('❌ Checkout failed:', err);
        const errorMsg = err.error?.message || 'Checkout failed';
        this.error.set(errorMsg);
        return throwError(() => new Error(errorMsg));
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  /**
   * Get cart summary (totals, discounts, etc)
   * @returns Observable with summary
   */
  getCartSummary(): Observable<CartSummary> {
    const cart = this.cart();
    if (!cart) {
      return throwError(() => new Error('Cart not loaded'));
    }

    return of({
      itemCount: this.itemCount(),
      itemsTotal: this.itemsTotal(),
      discount: cart.totalDiscount || 0,
      tax: cart.tax || 0,
      total: this.cartTotal(),
      couponApplied: cart.couponApplied || false
    } as CartSummary);
  }

  /**
   * Check if cart is empty
   * @returns Boolean
   */
  isCartEmpty(): boolean {
    const cart = this.cart();
    return !cart || !cart.items || cart.items.length === 0;
  }

  /**
   * Get cart as observable (useful for templates)
   * @returns Observable of current cart
   */
  getCartObservable(): Observable<Cart | null> {
    return of(this.cart());
  }
}
```

### Step 1: Replace Old Service File

```bash
# Backup old service
cp frontend/src/app/front/core/cart.service.ts frontend/src/app/front/core/cart.service.ts.backup

# Replace with fixed version (paste code above)
```

### Step 2: Update Cart Models (If Needed)

**File:** `frontend/src/app/front/core/models/cart.model.ts`

```typescript
export interface Cart {
  id: string;
  userId?: string;
  items: CartItem[];
  total: number;
  totalDiscount?: number;
  tax?: number;
  couponApplied?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  imageUrl?: string;
  total?: number;
}

export interface CartSummary {
  itemCount: number;
  itemsTotal: number;
  discount: number;
  tax: number;
  total: number;
  couponApplied: boolean;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
```

### Step 3: Hook Up to Component

**File:** `frontend/src/app/front/pages/cart/cart.component.ts`

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { CartService } from '../../core/cart.service';
import { Cart, CartItem } from '../../core/models/cart.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  private cartService = inject(CartService);
  private router = inject(Router);

  // Expose service signals to template
  cart = this.cartService.cart;
  isLoading = this.cartService.isLoading;
  error = this.cartService.error;
  itemCount = this.cartService.itemCount;
  cartTotal = this.cartService.cartTotal;

  ngOnInit(): void {
    // Cart auto-initializes in service constructor
    // but you can manually refresh:
    this.refreshCart();
  }

  refreshCart(): void {
    this.cartService.getCart().subscribe({
      error: (err) => console.error('Failed to load cart:', err)
    });
  }

  removeItem(itemId: string): void {
    this.cartService.removeItem(itemId).subscribe({
      next: () => console.log('Item removed'),
      error: (err) => alert('Error: ' + err.message)
    });
  }

  updateQuantity(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(itemId);
      return;
    }
    this.cartService.updateQuantity(itemId, quantity).subscribe({
      error: (err) => alert('Error: ' + err.message)
    });
  }

  applyCoupon(couponCode: string): void {
    if (!couponCode.trim()) {
      alert('Please enter a coupon code');
      return;
    }
    this.cartService.applyCoupon(couponCode).subscribe({
      next: () => console.log('Coupon applied'),
      error: (err) => alert('Invalid coupon: ' + err.message)
    });
  }

  clearCart(): void {
    if (confirm('Are you sure you want to clear your cart?')) {
      this.cartService.clearCart().subscribe({
        next: () => console.log('Cart cleared'),
        error: (err) => alert('Error: ' + err.message)
      });
    }
  }

  proceedToCheckout(): void {
    if (this.cartService.isCartEmpty()) {
      alert('Cart is empty');
      return;
    }
    this.router.navigate(['/checkout']);
  }
}
```

### Step 4: Update Template

**File:** `frontend/src/app/front/pages/cart/cart.component.html`

```html
<div class="container mx-auto p-4">
  <h1 class="text-3xl font-bold mb-6">Shopping Cart</h1>

  <!-- Loading State -->
  @if (isLoading()) {
    <div class="flex justify-center p-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  }

  <!-- Error State -->
  @if (error()) {
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {{ error() }}
    </div>
  }

  <!-- Empty Cart -->
  @if (cart()?.items?.length === 0) {
    <div class="text-center py-12">
      <p class="text-gray-500 text-xl mb-4">Your cart is empty</p>
      <a href="/products" class="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
        Continue Shopping
      </a>
    </div>
  }

  <!-- Cart Items -->
  @if ((cart()?.items?.length ?? 0) > 0) {
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Items List -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-lg shadow">
          @for (item of cart()!.items; track item.id) {
            <div class="border-b p-4 flex items-center gap-4">
              <!-- Product Image -->
              <img [src]="item.imageUrl" 
                   [alt]="item.productName"
                   class="w-20 h-20 object-cover rounded">

              <!-- Product Info -->
              <div class="flex-1">
                <h3 class="font-semibold">{{ item.productName }}</h3>
                <p class="text-gray-500">${{ item.productPrice?.toFixed(2) }}</p>
              </div>

              <!-- Quantity -->
              <div class="flex items-center gap-2">
                <button (click)="updateQuantity(item.id, item.quantity - 1)"
                        class="px-2 py-1 border rounded hover:bg-gray-100">-</button>
                <span class="px-4">{{ item.quantity }}</span>
                <button (click)="updateQuantity(item.id, item.quantity + 1)"
                        class="px-2 py-1 border rounded hover:bg-gray-100">+</button>
              </div>

              <!-- Total -->
              <div class="text-right">
                <p class="font-semibold">${{ (item.total ?? 0)?.toFixed(2) }}</p>
              </div>

              <!-- Remove -->
              <button (click)="removeItem(item.id)"
                      class="text-red-500 hover:text-red-700 font-semibold">×</button>
            </div>
          }
        </div>
      </div>

      <!-- Cart Summary -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg shadow p-6 sticky top-20">
          <h3 class="text-xl font-bold mb-4">Order Summary</h3>

          <div class="space-y-2 mb-4 border-b pb-4">
            <div class="flex justify-between">
              <span>Subtotal:</span>
              <span>${{ (cart()?.items?.reduce((sum, item) => sum + (item.productPrice * item.quantity), 0) ?? 0)?.toFixed(2) }}</span>
            </div>
            @if ((cart()?.totalDiscount ?? 0) > 0) {
              <div class="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-${{ cart()?.totalDiscount?.toFixed(2) }}</span>
              </div>
            }
            @if ((cart()?.tax ?? 0) > 0) {
              <div class="flex justify-between">
                <span>Tax:</span>
                <span>${{ cart()?.tax?.toFixed(2) }}</span>
              </div>
            }
          </div>

          <div class="flex justify-between text-lg font-bold mb-6 border-b pb-4">
            <span>Total:</span>
            <span>${{ cartTotal()?.toFixed(2) }}</span>
          </div>

          <!-- Coupon Input -->
          <div class="mb-4">
            <input type="text" 
                   #couponInput
                   placeholder="Enter coupon code"
                   class="w-full px-3 py-2 border rounded mb-2">
            <button (click)="applyCoupon(couponInput.value)"
                    class="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">
              Apply Coupon
            </button>
          </div>

          <!-- Checkout Button -->
          <button (click)="proceedToCheckout()"
                  [disabled]="isLoading()"
                  class="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed">
            @if (isLoading()) {
              <span>Processing...</span>
            } @else {
              <span>Proceed to Checkout</span>
            }
          </button>

          <button (click)="clearCart()"
                  class="w-full mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  }
</div>
```

---

## PART 3: VERIFICATION & TESTING

### Test 1: Port Connection
```bash
# Verify backend is responding
curl -X GET http://localhost:8089/api/products \
  -H "Content-Type: application/json"

# Expected: Array of products (even if empty)
```

### Test 2: Frontend Build
```bash
cd frontend
npm run build

# Expected: Build successful, no errors
```

### Test 3: Manual Test in Browser

```javascript
// Open browser console (F12) and run:

// Check environment
ng.probe(document.body).injector.get('environment')

// Test API call
import { HttpClient } from '@angular/common/http';
const http = ng.probe(document.body).injector.get(HttpClient);
http.get('http://localhost:8089/api/products').subscribe(data => console.log(data));

// Expected: See products array in console
```

### Test 4: Full Flow Test

1. Open `http://localhost:4200`
2. Login with test user
3. Navigate to Products
4. Add item to cart (click "Add to Cart")
5. Verify item appears in cart
6. Update quantity
7. Remove item
8. Apply coupon (test code)
9. Proceed to checkout

---

## TROUBLESHOOTING

### Issue: "Cannot GET /api/cart"
**Solution:** 
- Verify backend port is 8089: `lsof -i :8089`
- Verify environment.ts has correct port
- Restart both frontend and backend

### Issue: "OPTIONS 404 Error"
**Solution:**
- CORS issue on backend
- Check CorsConfig.java has correct origins
- Restart backend

### Issue: "Unauthorized 401"
**Solution:**
- Token not being sent
- Check Authorization header in HttpInterceptor
- Verify token is valid
- Re-login

### Issue: Cart stays empty
**Solution:**
- Check network requests (F12 → Network)
- Verify API returns data: `curl http://localhost:8089/api/cart -H "Authorization: Bearer TOKEN"`
- Check MongoDB connection

---

## FINAL CHECKLIST

- [ ] Port fixed to 8089
- [ ] Cart service implemented with HTTP calls
- [ ] Cart component updated with new service
- [ ] Frontend builds without errors
- [ ] Backend compiles and runs
- [ ] Manual tests pass
- [ ] Network requests show real data (no mock data)
- [ ] Loading states work
- [ ] Error states work
- [ ] Cart persists after page refresh

**After completing this guide, run:**
```bash
npm run test  # Run unit tests
npm run build # Build for production
```

---

**Time to implement:** 2.5 hours  
**Difficulty:** Medium  
**Impact:** 80% features now working

