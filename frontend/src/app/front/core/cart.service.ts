import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
import { CartResponse, CartItemResponse, AddToCartRequest, UpdateCartItemRequest } from '../models/cart.model';
import { OrderResponse, CreateOrderRequest } from '../models/order.model';
import { environment } from '../../../environment';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly apiUrl = `${environment.apiUrl}/cart`;
  private http = inject(HttpClient);

  // Reactive state
  readonly cart = signal<CartResponse | null>(null);
  readonly cartItems = signal<CartItemResponse[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Subject for cart updates (for real-time UI updates)
  private cartUpdateSubject = new BehaviorSubject<boolean>(false);
  readonly cartUpdated$ = this.cartUpdateSubject.asObservable();

  // Computed values
  readonly itemCount = computed(() => {
    const cart = this.cart();
    return cart?.totalQuantity ?? 0;
  });

  readonly cartTotal = computed(() => {
    const cart = this.cart();
    return cart?.total ?? 0;
  });

  readonly subtotal = computed(() => {
    const cart = this.cart();
    return cart?.subtotal ?? 0;
  });

  readonly discountAmount = computed(() => {
    const cart = this.cart();
    return cart?.discountAmount ?? 0;
  });

  readonly taxAmount = computed(() => {
    const cart = this.cart();
    return cart?.taxAmount ?? 0;
  });

  constructor() {
    this.initializeCartSync();
  }

  /**
   * Initialize cart sync on service creation
   */
  private initializeCartSync(): void {
    // Listen for cart updates and refresh data
    this.cartUpdated$.subscribe(() => {
      console.log('🔄 Cart update detected, refreshing data...');
    });
  }

  /**
   * Get current user's cart
   */
  getCart(): Observable<CartResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<CartResponse>(this.apiUrl).pipe(
      tap((cart) => {
        this.cart.set(cart);
        this.isLoading.set(false);
        console.log('🛒 Cart loaded from backend:', cart);
      }),
      catchError((error) => {
        console.error('❌ Failed to load cart:', error);
        this.isLoading.set(false);
        this.error.set(this.getErrorMessage(error));
        return throwError(() => error);
      })
    );
  }

  /**
   * Get current user's cart items
   */
  getCartItems(): Observable<CartItemResponse[]> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<CartItemResponse[]>(`${this.apiUrl}/items`).pipe(
      tap((items) => {
        this.cartItems.set(items);
        this.isLoading.set(false);
        console.log('🛒 Cart items loaded:', items);
      }),
      catchError((error) => {
        console.error('❌ Failed to load cart items:', error);
        this.isLoading.set(false);
        this.error.set(this.getErrorMessage(error));
        return throwError(() => error);
      })
    );
  }

  /**
   * Add an item to the cart
   */
  addItem(request: AddToCartRequest): Observable<CartItemResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    // ✅ ENHANCED VALIDATION: Check for null/undefined values
    if (!request.productId) {
      const error = 'Product ID is required';
      console.error('❌ Cart validation error:', error);
      this.error.set(error);
      this.isLoading.set(false);
      return throwError(() => new Error(error));
    }

    if (!request.quantity || request.quantity <= 0) {
      const error = 'Quantity must be greater than 0';
      console.error('❌ Cart validation error:', error);
      this.error.set(error);
      this.isLoading.set(false);
      return throwError(() => new Error(error));
    }

    // ✅ ENSURE PROPER DATA TYPES — include negotiatedPrice if provided
    const backendRequest: any = {
      productId: String(request.productId).trim(),
      quantity: Number(request.quantity)
    };
    if (request.negotiatedPrice != null && request.negotiatedPrice > 0) {
      backendRequest.negotiatedPrice = request.negotiatedPrice;
    }

    console.log('🛒 Adding item to cart:', backendRequest);

    return this.http.post<CartItemResponse>(`${this.apiUrl}/items`, backendRequest).pipe(
      tap((cartItem) => {
        console.log('✅ Item added to cart:', cartItem);
        // Refresh both cart and cart items to get updated data
        this.refreshCartAndItems();
        this.cartUpdateSubject.next(true);
        this.isLoading.set(false);
      }),
      catchError((error) => {
        console.error('❌ Failed to add item to cart:', error);
        console.error('❌ Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.error?.message,
          fieldErrors: error.error?.fieldErrors,
          fullError: error.error
        });
        
        // ✅ ENHANCED ERROR HANDLING WITH FIELD DETAILS
        if (error.status === 400 && error.error?.fieldErrors) {
          const fieldErrors = error.error.fieldErrors;
          let errorMessage = 'Validation failed:\n';
          
          Object.keys(fieldErrors).forEach(field => {
            errorMessage += `• ${field}: ${fieldErrors[field]}\n`;
          });
          
          console.error('🔍 Field validation errors:', fieldErrors);
          this.error.set(errorMessage);
        } else {
          this.error.set(this.getErrorMessage(error));
        }
        
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update quantity of a cart item
   */
  updateItemQuantity(itemId: string, quantity: number): Observable<CartItemResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    const request: UpdateCartItemRequest = { quantity };

    return this.http.put<CartItemResponse>(`${this.apiUrl}/items/${itemId}`, request).pipe(
      tap((cartItem) => {
        console.log('✅ Cart item quantity updated:', cartItem);
        this.refreshCartAndItems();
        this.cartUpdateSubject.next(true);
        this.isLoading.set(false);
      }),
      catchError((error) => {
        console.error('❌ Failed to update item quantity:', error);
        this.error.set(this.getErrorMessage(error));
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Remove an item from the cart
   */
  removeItem(itemId: string): Observable<void> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.delete<void>(`${this.apiUrl}/items/${itemId}`).pipe(
      tap(() => {
        console.log('✅ Item removed from cart:', itemId);
        this.refreshCartAndItems();
        this.cartUpdateSubject.next(true);
        this.isLoading.set(false);
      }),
      catchError((error) => {
        console.error('❌ Failed to remove item:', error);
        this.error.set(this.getErrorMessage(error));
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Clear all items from the cart
   */
  clearCart(): Observable<void> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.delete<void>(`${this.apiUrl}/clear`).pipe(
      tap(() => {
        console.log('✅ Cart cleared');
        this.cart.set(null);
        this.cartItems.set([]);
        this.cartUpdateSubject.next(true);
        this.isLoading.set(false);
      }),
      catchError((error) => {
        console.error('❌ Failed to clear cart:', error);
        this.error.set(this.getErrorMessage(error));
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Apply a coupon code to the cart
   */
  applyCoupon(couponCode: string): Observable<CartResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    const request = { couponCode };

    return this.http.post<CartResponse>(`${this.apiUrl}/coupon`, request).pipe(
      tap((cart) => {
        console.log('✅ Coupon applied:', cart);
        this.cart.set(cart);
        this.cartUpdateSubject.next(true);
        this.isLoading.set(false);
      }),
      catchError((error) => {
        console.error('❌ Failed to apply coupon:', error);
        this.error.set(this.getErrorMessage(error));
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Remove applied coupon from cart
   */
  removeCoupon(): Observable<CartResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.delete<CartResponse>(`${this.apiUrl}/coupon`).pipe(
      tap((cart) => {
        console.log('✅ Coupon removed:', cart);
        this.cart.set(cart);
        this.cartUpdateSubject.next(true);
        this.isLoading.set(false);
      }),
      catchError((error) => {
        console.error('❌ Failed to remove coupon:', error);
        this.error.set(this.getErrorMessage(error));
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Checkout (convert cart to order)
   * ✅ FIXED: Now returns OrderResponse from new Order entity
   * ✅ FIXED: Use proper /api/orders endpoint instead of deprecated /api/cart/checkout
   */
  checkout(checkoutData: CreateOrderRequest): Observable<OrderResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    // ✅ CRITICAL FIX: Use proper orders endpoint
    const ordersUrl = `${environment.apiUrl}/orders`;

    return this.http.post<OrderResponse>(ordersUrl, checkoutData).pipe(
      tap((order) => {
        console.log('✅ Order created:', order);
        console.log('📦 Order number:', order.orderNumber);
        console.log('💰 Final amount:', order.finalAmount);
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

  /**
   * Confirm payment for an order (reduces product stock)
   */
  confirmPayment(orderId: string, paymentId: string): Observable<OrderResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    const ordersUrl = `${environment.apiUrl}/orders/${orderId}/confirm-payment`;

    return this.http.post<OrderResponse>(ordersUrl, null, {
      params: { paymentId }
    }).pipe(
      tap((order) => {
        console.log('✅ Payment confirmed:', order);
        console.log('📦 Order status:', order.status);
        this.isLoading.set(false);
      }),
      catchError((error) => {
        console.error('❌ Failed to confirm payment:', error);
        this.error.set(this.getErrorMessage(error));
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get user orders
   */
  getOrders(): Observable<CartResponse[]> {
    return this.http.get<CartResponse[]>(`${this.apiUrl}/orders`).pipe(
      catchError((error) => {
        console.error('❌ Failed to get orders:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get purchased items for SAV claims
   * Loads items from completed orders/cart history
   */
  getPurchasedItems(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/purchased-items`).pipe(
      tap((items) => {
        console.log('📦 Purchased items loaded:', items);
      }),
      catchError((error) => {
        console.error('❌ Failed to load purchased items:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh cart data — single request, updates the cart signal
   */
  refreshCart(): void {
    this.getCart().subscribe({ error: () => {} });
  }

  private refreshCartAndItems(): void {
    this.getCart().subscribe({ error: () => {} });
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: any): string {
    if (error.status === 401) {
      return 'Please log in to access your cart';
    } else if (error.status === 403) {
      return 'You do not have permission to perform this action';
    } else if (error.status === 404) {
      return 'Cart or item not found';
    } else if (error.status >= 500) {
      return 'Server error. Please try again later';
    } else {
      return error.error?.message || 'An unexpected error occurred';
    }
  }

  // ==================== CART EXPIRATION ====================

  /**
   * Check if user's cart has an expiration warning.
   * Called on login and periodically.
   */
  checkExpirationWarning(): Observable<CartExpirationWarning> {
    return this.http.get<CartExpirationWarning>(`${this.apiUrl}/check-expiration-warning`).pipe(
      tap((warning) => {
        if (warning.hasWarning) {
          console.log('⏰ Cart expiration warning:', warning);
        }
      }),
      catchError((error) => {
        console.error('❌ Failed to check cart expiration:', error);
        return throwError(() => error);
      })
    );
  }
}

export interface CartExpirationWarning {
  hasWarning: boolean;
  remainingHours?: number;
  remainingMinutes?: number;
  itemCount?: number;
  cartTotal?: number;
  severity?: 'WARNING' | 'URGENT' | 'CRITICAL';
  message?: string;
}
