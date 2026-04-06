import { describe, it, expect } from 'vitest';
import {
  Order,
  OrderItem,
  OrderStatusHistory,
  PaymentInfo,
  ShippingInfo,
  ShippingAddress,
  OrderStatus,
  OrderItemStatus,
  PaymentMethod,
  PaymentStatus,
  ShippingMethod,
  CreateOrderRequest
} from './order.model';

describe('Order Models', () => {
  describe('Order', () => {
    it('shouldCreateValidOrder', () => {
      const order: Order = {
        id: 'order-1',
        orderNumber: 'ORD-2024-001',
        userId: 'user-1',
        buyer: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '123456789'
        },
        sellerId: 'seller-1',
        seller: {
          id: 'seller-1',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com'
        },
        items: [],
        status: OrderStatus.PENDING,
        statusHistory: [],
        subtotal: 100,
        tax: 5,
        discount: 10,
        shippingCost: 5,
        total: 100,
        payment: {
          method: PaymentMethod.CASH_ON_DELIVERY,
          status: PaymentStatus.PENDING,
          amount: 100
        },
        shipping: {
          method: ShippingMethod.HOME_DELIVERY,
          address: {
            fullName: 'John Doe',
            phone: '123456789',
            address: '123 Main St',
            city: 'Tunis',
            isOnCampus: false
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(order.id).toBe('order-1');
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.total).toBe(100);
    });

    it('shouldHandleOptionalFields', () => {
      const order: Order = {
        id: 'order-1',
        orderNumber: 'ORD-2024-001',
        userId: 'user-1',
        buyer: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '123456789'
        },
        sellerId: 'seller-1',
        seller: {
          id: 'seller-1',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com'
        },
        items: [],
        status: OrderStatus.DELIVERED,
        statusHistory: [],
        subtotal: 100,
        tax: 5,
        discount: 0,
        shippingCost: 5,
        total: 110,
        payment: {
          method: PaymentMethod.FLOUCI,
          status: PaymentStatus.COMPLETED,
          transactionId: 'TXN-123',
          paidAt: new Date(),
          amount: 110
        },
        shipping: {
          method: ShippingMethod.HOME_DELIVERY,
          address: {
            fullName: 'John Doe',
            phone: '123456789',
            address: '123 Main St',
            city: 'Tunis',
            postalCode: '1000',
            notes: 'Leave at door',
            isOnCampus: false
          },
          trackingNumber: 'TRACK-123',
          deliveredAt: new Date()
        },
        notes: 'Special handling',
        completedAt: new Date()
      };

      expect(order.notes).toBe('Special handling');
      expect(order.completedAt).toBeDefined();
      expect(order.payment.transactionId).toBe('TXN-123');
    });
  });

  describe('OrderItem', () => {
    it('shouldCreateValidOrderItem', () => {
      const item: OrderItem = {
        id: 'item-1',
        orderId: 'order-1',
        productId: 'prod-1',
        quantity: 2,
        unitPrice: 50,
        totalPrice: 100,
        status: OrderItemStatus.PENDING
      };

      expect(item.orderId).toBe('order-1');
      expect(item.quantity).toBe(2);
      expect(item.status).toBe(OrderItemStatus.PENDING);
    });

    it('shouldHandleOptionalFields', () => {
      const item: OrderItem = {
        id: 'item-1',
        orderId: 'order-1',
        productId: 'prod-1',
        quantity: 1,
        unitPrice: 100,
        totalPrice: 100,
        notes: 'Gift wrap',
        status: OrderItemStatus.DELIVERED
      };

      expect(item.notes).toBe('Gift wrap');
    });
  });

  describe('OrderStatusHistory', () => {
    it('shouldCreateValidStatusHistory', () => {
      const history: OrderStatusHistory = {
        status: OrderStatus.CONFIRMED,
        timestamp: new Date()
      };

      expect(history.status).toBe(OrderStatus.CONFIRMED);
      expect(history.timestamp).toBeDefined();
    });

    it('shouldHandleOptionalFields', () => {
      const history: OrderStatusHistory = {
        status: OrderStatus.SHIPPED,
        timestamp: new Date(),
        note: 'Shipped via DHL',
        updatedBy: 'admin-1'
      };

      expect(history.note).toBe('Shipped via DHL');
      expect(history.updatedBy).toBe('admin-1');
    });
  });

  describe('PaymentInfo', () => {
    it('shouldCreateValidPaymentInfo', () => {
      const payment: PaymentInfo = {
        method: PaymentMethod.CASH_ON_DELIVERY,
        status: PaymentStatus.PENDING,
        amount: 100
      };

      expect(payment.method).toBe(PaymentMethod.CASH_ON_DELIVERY);
      expect(payment.status).toBe(PaymentStatus.PENDING);
      expect(payment.amount).toBe(100);
    });

    it('shouldHandleOptionalFields', () => {
      const payment: PaymentInfo = {
        method: PaymentMethod.FLOUCI,
        status: PaymentStatus.COMPLETED,
        transactionId: 'TXN-123',
        paidAt: new Date(),
        amount: 100
      };

      expect(payment.transactionId).toBe('TXN-123');
      expect(payment.paidAt).toBeDefined();
    });

    it('shouldHandleAllPaymentMethods', () => {
      const methods = [
        PaymentMethod.CASH_ON_DELIVERY,
        PaymentMethod.FLOUCI,
        PaymentMethod.D17,
        PaymentMethod.BANK_TRANSFER,
        PaymentMethod.LOYALTY_POINTS
      ];

      expect(methods.length).toBe(5);
      expect(methods).toContain(PaymentMethod.FLOUCI);
    });

    it('shouldHandleAllPaymentStatuses', () => {
      const statuses = [
        PaymentStatus.PENDING,
        PaymentStatus.PROCESSING,
        PaymentStatus.COMPLETED,
        PaymentStatus.FAILED,
        PaymentStatus.REFUNDED
      ];

      expect(statuses.length).toBe(5);
      expect(statuses).toContain(PaymentStatus.COMPLETED);
    });
  });

  describe('ShippingInfo', () => {
    it('shouldCreateValidShippingInfo', () => {
      const shipping: ShippingInfo = {
        method: ShippingMethod.HOME_DELIVERY,
        address: {
          fullName: 'John Doe',
          phone: '123456789',
          address: '123 Main St',
          city: 'Tunis',
          isOnCampus: false
        }
      };

      expect(shipping.method).toBe(ShippingMethod.HOME_DELIVERY);
      expect(shipping.address.fullName).toBe('John Doe');
    });

    it('shouldHandleOptionalFields', () => {
      const shipping: ShippingInfo = {
        method: ShippingMethod.CAMPUS_PICKUP,
        address: {
          fullName: 'John Doe',
          phone: '123456789',
          address: '123 Main St',
          city: 'Tunis',
          postalCode: '1000',
          notes: 'Leave at reception',
          isOnCampus: true,
          campusLocation: 'Building A'
        },
        estimatedDelivery: new Date(),
        trackingNumber: 'TRACK-123',
        deliveredAt: new Date()
      };

      expect(shipping.trackingNumber).toBe('TRACK-123');
      expect(shipping.address.campusLocation).toBe('Building A');
    });

    it('shouldHandleAllShippingMethods', () => {
      const methods = [
        ShippingMethod.CAMPUS_PICKUP,
        ShippingMethod.CAMPUS_DELIVERY,
        ShippingMethod.HOME_DELIVERY
      ];

      expect(methods.length).toBe(3);
      expect(methods).toContain(ShippingMethod.HOME_DELIVERY);
    });
  });

  describe('ShippingAddress', () => {
    it('shouldCreateValidShippingAddress', () => {
      const address: ShippingAddress = {
        fullName: 'John Doe',
        phone: '123456789',
        address: '123 Main St',
        city: 'Tunis',
        isOnCampus: false
      };

      expect(address.fullName).toBe('John Doe');
      expect(address.city).toBe('Tunis');
      expect(address.isOnCampus).toBe(false);
    });

    it('shouldHandleOptionalFields', () => {
      const address: ShippingAddress = {
        fullName: 'John Doe',
        phone: '123456789',
        address: '123 Main St',
        city: 'Tunis',
        postalCode: '1000',
        notes: 'Ring doorbell twice',
        isOnCampus: true,
        campusLocation: 'Building A, Room 101'
      };

      expect(address.postalCode).toBe('1000');
      expect(address.notes).toBe('Ring doorbell twice');
      expect(address.campusLocation).toBe('Building A, Room 101');
    });
  });

  describe('OrderStatus Enum', () => {
    it('shouldHaveAllOrderStatuses', () => {
      const statuses = [
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PROCESSING,
        OrderStatus.SHIPPED,
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.DELIVERED,
        OrderStatus.COMPLETED,
        OrderStatus.CANCELLED,
        OrderStatus.REFUNDED
      ];

      expect(statuses.length).toBe(9);
    });
  });

  describe('OrderItemStatus Enum', () => {
    it('shouldHaveAllOrderItemStatuses', () => {
      const statuses = [
        OrderItemStatus.PENDING,
        OrderItemStatus.CONFIRMED,
        OrderItemStatus.SHIPPED,
        OrderItemStatus.DELIVERED,
        OrderItemStatus.RETURNED,
        OrderItemStatus.REFUNDED
      ];

      expect(statuses.length).toBe(6);
    });
  });

  describe('CreateOrderRequest', () => {
    it('shouldCreateValidCreateOrderRequest', () => {
      const request: CreateOrderRequest = {
        cartId: 'cart-1',
        shippingAddress: {
          fullName: 'John Doe',
          phone: '123456789',
          address: '123 Main St',
          city: 'Tunis',
          isOnCampus: false
        },
        paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
        shippingMethod: ShippingMethod.HOME_DELIVERY
      };

      expect(request.cartId).toBe('cart-1');
      expect(request.paymentMethod).toBe(PaymentMethod.CASH_ON_DELIVERY);
    });

    it('shouldHandleOptionalFields', () => {
      const request: CreateOrderRequest = {
        cartId: 'cart-1',
        shippingAddress: {
          fullName: 'John Doe',
          phone: '123456789',
          address: '123 Main St',
          city: 'Tunis',
          isOnCampus: false
        },
        paymentMethod: PaymentMethod.FLOUCI,
        shippingMethod: ShippingMethod.HOME_DELIVERY,
        notes: 'Handle with care',
        couponCode: 'SAVE20'
      };

      expect(request.notes).toBe('Handle with care');
      expect(request.couponCode).toBe('SAVE20');
    });
  });

  describe('type compatibility', () => {
    it('shouldAssignOrderToVariable', () => {
      const order: Order = {
        id: 'order-1',
        orderNumber: 'ORD-2024-001',
        userId: 'user-1',
        buyer: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '123456789'
        },
        sellerId: 'seller-1',
        seller: {
          id: 'seller-1',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com'
        },
        items: [],
        status: OrderStatus.PENDING,
        statusHistory: [],
        subtotal: 100,
        tax: 5,
        discount: 0,
        shippingCost: 5,
        total: 110,
        payment: {
          method: PaymentMethod.CASH_ON_DELIVERY,
          status: PaymentStatus.PENDING,
          amount: 110
        },
        shipping: {
          method: ShippingMethod.HOME_DELIVERY,
          address: {
            fullName: 'John Doe',
            phone: '123456789',
            address: '123 Main St',
            city: 'Tunis',
            isOnCampus: false
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const orderCopy: Order = order;
      expect(orderCopy.id).toBe(order.id);
    });
  });

  describe('array operations', () => {
    it('shouldCreateArrayOfOrders', () => {
      const orders: Order[] = [];
      expect(orders.length).toBe(0);
    });

    it('shouldCreateArrayOfOrderItems', () => {
      const items: OrderItem[] = [];
      expect(items.length).toBe(0);
    });

    it('shouldCreateArrayOfStatusHistory', () => {
      const history: OrderStatusHistory[] = [];
      expect(history.length).toBe(0);
    });
  });
});
