import { describe, it, expect } from 'vitest';
import { CartResponse, CartItemResponse, Cart, CartItem, CartSummary, AddToCartRequest, UpdateCartItemRequest } from './cart.model';

describe('Cart Models', () => {
  describe('CartResponse', () => {
    it('shouldCreateValidCartResponse', () => {
      const cart: CartResponse = {
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

      expect(cart.id).toBe('cart-1');
      expect(cart.total).toBe(95);
      expect(cart.isEmpty).toBe(true);
    });

    it('shouldHandleOptionalFields', () => {
      const cart: CartResponse = {
        id: 'cart-1',
        userId: 'user-1',
        creationDate: '2024-01-01',
        lastUpdated: '2024-01-01',
        subtotal: 100,
        discountAmount: 0,
        taxAmount: 0,
        total: 100,
        status: 'DRAFT',
        items: [],
        totalItems: 0,
        totalQuantity: 0,
        isEmpty: false,
        hasDiscount: false,
        savingsAmount: 0,
        appliedCouponCode: 'SAVE20',
        shippingAddress: '123 Main St'
      };

      expect(cart.appliedCouponCode).toBe('SAVE20');
      expect(cart.shippingAddress).toBe('123 Main St');
    });
  });

  describe('CartItemResponse', () => {
    it('shouldCreateValidCartItem', () => {
      const item: CartItemResponse = {
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

      expect(item.quantity).toBe(2);
      expect(item.subTotal).toBe(100);
      expect(item.status).toBe('ACTIVE');
    });

    it('shouldHandleEnrichedProductFields', () => {
      const item: CartItemResponse = {
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'prod-1',
        productName: 'Test Product',
        quantity: 1,
        unitPrice: 100,
        subTotal: 100,
        discountApplied: 0,
        status: 'ACTIVE',
        availableQuantity: 5,
        isPartiallyRefunded: false,
        isFullyRefunded: false,
        imageUrl: 'https://example.com/image.jpg',
        category: 'Electronics',
        sellerName: 'Test Seller',
        stock: 50,
        stockStatus: 'IN_STOCK'
      };

      expect(item.imageUrl).toBe('https://example.com/image.jpg');
      expect(item.category).toBe('Electronics');
      expect(item.sellerName).toBe('Test Seller');
    });

    it('shouldHandleRefundedItems', () => {
      const item: CartItemResponse = {
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'prod-1',
        productName: 'Test Product',
        quantity: 2,
        unitPrice: 50,
        subTotal: 100,
        discountApplied: 0,
        status: 'REFUNDED',
        cancelledQuantity: 1,
        refundAmount: 50,
        cancellationReason: 'Defective',
        availableQuantity: 10,
        isPartiallyRefunded: true,
        isFullyRefunded: false
      };

      expect(item.isPartiallyRefunded).toBe(true);
      expect(item.refundAmount).toBe(50);
      expect(item.cancellationReason).toBe('Defective');
    });
  });

  describe('Cart (Legacy)', () => {
    it('shouldCreateValidLegacyCart', () => {
      const cart: Cart = {
        id: 'cart-1',
        userId: 'user-1',
        items: [],
        subtotal: 100,
        tax: 5,
        discount: 10,
        total: 95,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      };

      expect(cart.id).toBe('cart-1');
      expect(cart.total).toBe(95);
      expect(cart.items).toEqual([]);
    });

    it('shouldHandleOptionalCoupon', () => {
      const cart: Cart = {
        id: 'cart-1',
        userId: 'user-1',
        items: [],
        subtotal: 100,
        tax: 5,
        discount: 10,
        total: 95,
        appliedCoupon: 'SAVE20',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(cart.appliedCoupon).toBe('SAVE20');
    });
  });

  describe('CartItem (Legacy)', () => {
    it('shouldCreateValidLegacyCartItem', () => {
      const item: CartItem = {
        id: 'item-1',
        productId: 'prod-1',
        quantity: 2,
        unitPrice: 50,
        totalPrice: 100,
        addedAt: new Date('2024-01-01')
      };

      expect(item.quantity).toBe(2);
      expect(item.totalPrice).toBe(100);
    });

    it('shouldHandleOptionalProduct', () => {
      const item: CartItem = {
        id: 'item-1',
        productId: 'prod-1',
        quantity: 1,
        unitPrice: 100,
        totalPrice: 100,
        product: {
          id: 'prod-1',
          name: 'Test',
          price: 100,
          stock: 10,
          description: 'Test product'
        },
        addedAt: new Date()
      };

      expect(item.product?.name).toBe('Test');
    });

    it('shouldHandleOptionalNotes', () => {
      const item: CartItem = {
        id: 'item-1',
        productId: 'prod-1',
        quantity: 1,
        unitPrice: 100,
        totalPrice: 100,
        notes: 'Special request',
        addedAt: new Date()
      };

      expect(item.notes).toBe('Special request');
    });
  });

  describe('CartSummary', () => {
    it('shouldCreateValidCartSummary', () => {
      const summary: CartSummary = {
        itemCount: 3,
        subtotal: 300,
        tax: 15,
        taxRate: 0.05,
        discount: 30,
        shipping: 10,
        total: 295,
        savings: 30
      };

      expect(summary.itemCount).toBe(3);
      expect(summary.total).toBe(295);
      expect(summary.savings).toBe(30);
    });

    it('shouldCalculateTotalsCorrectly', () => {
      const summary: CartSummary = {
        itemCount: 1,
        subtotal: 100,
        tax: 5,
        taxRate: 0.05,
        discount: 10,
        shipping: 5,
        total: 100,
        savings: 10
      };

      expect(summary.subtotal + summary.tax + summary.shipping - summary.discount).toBe(100);
    });
  });

  describe('AddToCartRequest', () => {
    it('shouldCreateValidAddToCartRequest', () => {
      const request: AddToCartRequest = {
        productId: 'prod-1',
        quantity: 2
      };

      expect(request.productId).toBe('prod-1');
      expect(request.quantity).toBe(2);
    });

    it('shouldHandleOptionalNotes', () => {
      const request: AddToCartRequest = {
        productId: 'prod-1',
        quantity: 1,
        notes: 'Gift wrap please'
      };

      expect(request.notes).toBe('Gift wrap please');
    });
  });

  describe('UpdateCartItemRequest', () => {
    it('shouldCreateValidUpdateRequest', () => {
      const request: UpdateCartItemRequest = {
        quantity: 5
      };

      expect(request.quantity).toBe(5);
    });

    it('shouldHandleZeroQuantity', () => {
      const request: UpdateCartItemRequest = {
        quantity: 0
      };

      expect(request.quantity).toBe(0);
    });

    it('shouldHandleLargeQuantity', () => {
      const request: UpdateCartItemRequest = {
        quantity: 1000
      };

      expect(request.quantity).toBe(1000);
    });
  });

  describe('type compatibility', () => {
    it('shouldAssignCartResponseToVariable', () => {
      const cart: CartResponse = {
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

      const cartCopy: CartResponse = cart;
      expect(cartCopy.id).toBe(cart.id);
    });

    it('shouldAssignCartItemResponseToVariable', () => {
      const item: CartItemResponse = {
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'prod-1',
        productName: 'Test',
        quantity: 1,
        unitPrice: 100,
        subTotal: 100,
        discountApplied: 0,
        status: 'ACTIVE',
        availableQuantity: 10,
        isPartiallyRefunded: false,
        isFullyRefunded: false
      };

      const itemCopy: CartItemResponse = item;
      expect(itemCopy.productName).toBe(item.productName);
    });
  });

  describe('array operations', () => {
    it('shouldCreateArrayOfCartItems', () => {
      const items: CartItemResponse[] = [
        {
          id: 'item-1',
          cartId: 'cart-1',
          productId: 'prod-1',
          productName: 'Product 1',
          quantity: 1,
          unitPrice: 100,
          subTotal: 100,
          discountApplied: 0,
          status: 'ACTIVE',
          availableQuantity: 10,
          isPartiallyRefunded: false,
          isFullyRefunded: false
        },
        {
          id: 'item-2',
          cartId: 'cart-1',
          productId: 'prod-2',
          productName: 'Product 2',
          quantity: 2,
          unitPrice: 50,
          subTotal: 100,
          discountApplied: 0,
          status: 'ACTIVE',
          availableQuantity: 20,
          isPartiallyRefunded: false,
          isFullyRefunded: false
        }
      ];

      expect(items.length).toBe(2);
      expect(items[0].productName).toBe('Product 1');
      expect(items[1].quantity).toBe(2);
    });
  });
});
