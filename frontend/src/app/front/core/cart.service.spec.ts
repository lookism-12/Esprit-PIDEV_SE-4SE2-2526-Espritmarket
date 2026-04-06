import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { CartResponse, CartItemResponse, AddToCartRequest } from '../models/cart.model';
import { environment } from '../../../environment';

describe('CartService', () => {
  let service: CartService;
  let httpMock: HttpTestingController;

  const mockCartResponse: CartResponse = {
    id: 'cart-1',
    userId: 'user-1',
    creationDate: '2024-01-01',
    lastUpdated: '2024-01-01',
    subtotal: 100,
    discountAmount: 10,
    taxAmount: 5,
    total: 95,
    status: 'DRAFT',
    items: [],
    totalItems: 0,
    totalQuantity: 0,
    isEmpty: true,
    hasDiscount: false,
    savingsAmount: 10
  };

  const mockCartItem: CartItemResponse = {
    id: 'item-1',
    cartId: 'cart-1',
    productId: 'prod-1',
    productName: 'Test Product',
    quantity: 2,
    unitPrice: 50,
    subTotal: 100,
    discountApplied: 0,
    status: 'ACTIVE',
    availableQuantity: 10,
    isPartiallyRefunded: false,
    isFullyRefunded: false
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CartService]
    });
    service = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getCart', () => {
    it('shouldFetchCartSuccessfully', (done) => {
      service.getCart().subscribe((cart) => {
        expect(cart).toEqual(mockCartResponse);
        expect(service.isLoading()).toBe(false);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/cart`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCartResponse);
    });

    it('shouldHandleCartFetchError', (done) => {
      service.getCart().subscribe({
        error: () => {
          expect(service.error()).toBe('Failed to load cart');
          expect(service.isLoading()).toBe(false);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/cart`);
      req.error(new ErrorEvent('Network error'));
    });

    it('shouldSetLoadingStateWhileFetching', () => {
      service.getCart().subscribe();
      expect(service.isLoading()).toBe(true);

      const req = httpMock.expectOne(`${environment.apiUrl}/cart`);
      req.flush(mockCartResponse);
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('getCartItems', () => {
    it('shouldFetchCartItemsSuccessfully', (done) => {
      const items = [mockCartItem];
      service.getCartItems().subscribe((result) => {
        expect(result).toEqual(items);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/cart/items`);
      expect(req.request.method).toBe('GET');
      req.flush(items);
    });

    it('shouldHandleEmptyCartItems', (done) => {
      service.getCartItems().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/cart/items`);
      req.flush([]);
    });
  });

  describe('addItem', () => {
    it('shouldAddItemToCartSuccessfully', (done) => {
      const request: AddToCartRequest = {
        productId: 'prod-1',
        quantity: 2
      };

      service.addItem(request).subscribe((item) => {
        expect(item).toEqual(mockCartItem);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/cart/items`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockCartItem);
    });

    it('shouldHandleAddItemError', (done) => {
      const request: AddToCartRequest = {
        productId: 'prod-1',
        quantity: 2
      };

      service.addItem(request).subscribe({
        error: () => {
          expect(service.error()).toContain('Failed');
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/cart/items`);
      req.error(new ErrorEvent('Add item failed'));
    });
  });

  describe('updateItemQuantity', () => {
    it('shouldUpdateItemQuantitySuccessfully', (done) => {
      const updatedItem = { ...mockCartItem, quantity: 5 };

      service.updateItemQuantity('item-1', 5).subscribe((item) => {
        expect(item.quantity).toBe(5);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/cart/items/item-1`);
      expect(req.request.method).toBe('PUT');
      req.flush(updatedItem);
    });

    it('shouldHandleUpdateQuantityError', (done) => {
      service.updateItemQuantity('item-1', 5).subscribe({
        error: () => {
          expect(service.error()).toContain('Failed');
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/cart/items/item-1`);
      req.error(new ErrorEvent('Update failed'));
    });
  });

  describe('removeItem', () => {
    it('shouldRemoveItemSuccessfully', (done) => {
      service.removeItem('item-1').subscribe(() => {
        expect(service.error()).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/cart/items/item-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('shouldHandleRemoveItemError', (done) => {
      service.removeItem('item-1').subscribe({
        error: () => {
          expect(service.error()).toContain('Failed');
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/cart/items/item-1`);
      req.error(new ErrorEvent('Remove failed'));
    });
  });

  describe('clearCart', () => {
    it('shouldClearCartSuccessfully', (done) => {
      service.clearCart().subscribe(() => {
        expect(service.error()).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/cart`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('applyCoupon', () => {
    it('shouldApplyCouponSuccessfully', (done) => {
      const updatedCart = { ...mockCartResponse, discountAmount: 20 };

      service.applyCoupon('SAVE20').subscribe((cart) => {
        expect(cart.discountAmount).toBe(20);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/cart/coupon`);
      expect(req.request.method).toBe('POST');
      req.flush(updatedCart);
    });

    it('shouldHandleInvalidCoupon', (done) => {
      service.applyCoupon('INVALID').subscribe({
        error: () => {
          expect(service.error()).toContain('Failed');
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/cart/coupon`);
      req.error(new ErrorEvent('Invalid coupon'));
    });
  });

  describe('removeCoupon', () => {
    it('shouldRemoveCouponSuccessfully', (done) => {
      service.removeCoupon().subscribe((cart) => {
        expect(cart.discountAmount).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/cart/coupon`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockCartResponse);
    });
  });

  describe('checkout', () => {
    it('shouldCheckoutSuccessfully', (done) => {
      const checkoutData = {
        shippingAddress: '123 Main St',
        billingAddress: '123 Main St'
      };

      const confirmedCart = { ...mockCartResponse, status: 'PENDING' };

      service.checkout(checkoutData).subscribe((cart) => {
        expect(cart.status).toBe('PENDING');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/cart/checkout`);
      expect(req.request.method).toBe('POST');
      req.flush(confirmedCart);
    });

    it('shouldHandleCheckoutError', (done) => {
      service.checkout({}).subscribe({
        error: () => {
          expect(service.error()).toContain('Failed');
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/cart/checkout`);
      req.error(new ErrorEvent('Checkout failed'));
    });
  });

  describe('getOrders', () => {
    it('shouldFetchOrdersSuccessfully', (done) => {
      const orders = [mockCartResponse];

      service.getOrders().subscribe((result) => {
        expect(result).toEqual(orders);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/orders`);
      expect(req.request.method).toBe('GET');
      req.flush(orders);
    });
  });

  describe('refreshCart', () => {
    it('shouldRefreshCartData', () => {
      service.refreshCart();
      
      const cartReq = httpMock.expectOne(`${environment.apiUrl}/cart`);
      cartReq.flush(mockCartResponse);

      const itemsReq = httpMock.expectOne(`${environment.apiUrl}/cart/items`);
      itemsReq.flush([mockCartItem]);
    });
  });
});
