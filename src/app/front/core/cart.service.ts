import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Cart, CartItem, CartSummary, AddToCartRequest, UpdateCartItemRequest } from '../models/cart.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly apiUrl = '/api/cart'; // TODO: Configure environment

  // Reactive state
  readonly cart = signal<Cart | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Computed values
  readonly itemCount = computed(() => {
    const cart = this.cart();
    return cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  });

  readonly cartTotal = computed(() => {
    const cart = this.cart();
    return cart?.total ?? 0;
  });

  constructor(private http: HttpClient) {
    // TODO: Load cart from localStorage or fetch from API on init
  }

  /**
   * Get current user's cart
   * @returns Observable with cart data
   */
  getCart(): Observable<Cart> {
    // TODO: Implement actual HTTP call
    // return this.http.get<Cart>(this.apiUrl);
    console.log('CartService.getCart() called');
    return of({} as Cart);
  }

  /**
   * Add an item to the cart
   * @param request - Add to cart request with productId and quantity
   * @returns Observable with updated cart
   */
  addItem(request: AddToCartRequest): Observable<Cart> {
    // TODO: Implement actual HTTP call
    // return this.http.post<Cart>(`${this.apiUrl}/items`, request);
    console.log('CartService.addItem() called with:', request);
    return of({} as Cart);
  }

  /**
   * Remove an item from the cart
   * @param itemId - Cart item ID to remove
   * @returns Observable with updated cart
   */
  removeItem(itemId: string): Observable<Cart> {
    // TODO: Implement actual HTTP call
    // return this.http.delete<Cart>(`${this.apiUrl}/items/${itemId}`);
    console.log('CartService.removeItem() called with itemId:', itemId);
    return of({} as Cart);
  }

  /**
   * Update quantity of a cart item
   * @param request - Update request with itemId and new quantity
   * @returns Observable with updated cart
   */
  updateQuantity(request: UpdateCartItemRequest): Observable<Cart> {
    // TODO: Implement actual HTTP call
    // return this.http.patch<Cart>(`${this.apiUrl}/items/${request.itemId}`, { quantity: request.quantity });
    console.log('CartService.updateQuantity() called with:', request);
    return of({} as Cart);
  }

  /**
   * Clear all items from the cart
   * @returns Observable with empty cart
   */
  clearCart(): Observable<Cart> {
    // TODO: Implement actual HTTP call
    // return this.http.delete<Cart>(`${this.apiUrl}/clear`);
    console.log('CartService.clearCart() called');
    return of({} as Cart);
  }

  /**
   * Apply a coupon code to the cart
   * @param couponCode - Coupon code to apply
   * @returns Observable with updated cart including discount
   */
  applyCoupon(couponCode: string): Observable<Cart> {
    // TODO: Implement actual HTTP call
    // return this.http.post<Cart>(`${this.apiUrl}/coupon`, { couponCode });
    console.log('CartService.applyCoupon() called with:', couponCode);
    return of({} as Cart);
  }

  /**
   * Remove applied coupon from cart
   * @returns Observable with updated cart
   */
  removeCoupon(): Observable<Cart> {
    // TODO: Implement actual HTTP call
    // return this.http.delete<Cart>(`${this.apiUrl}/coupon`);
    console.log('CartService.removeCoupon() called');
    return of({} as Cart);
  }

  /**
   * Get cart summary (for checkout preview)
   * @returns Observable with cart summary
   */
  getCartSummary(): Observable<CartSummary> {
    // TODO: Implement actual HTTP call
    // return this.http.get<CartSummary>(`${this.apiUrl}/summary`);
    console.log('CartService.getCartSummary() called');
    return of({} as CartSummary);
  }
}
