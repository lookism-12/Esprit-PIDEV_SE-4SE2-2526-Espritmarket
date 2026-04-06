import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { OrderService, RefundSummaryDTO } from './order.service';
import { CartResponse } from '../models/cart.model';
import { environment } from '../../../environment';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;

  const mockOrder: CartResponse = {
    id: 'order-1',
    userId: 'user-1',
    creationDate: '2024-01-01',
    lastUpdated: '2024-01-01',
    subtotal: 100,
    discountAmount: 10,
    taxAmount: 5,
    total: 95,
    status: 'PENDING',
    items: [],
    totalItems: 1,
    totalQuantity: 1,
    isEmpty: false,
    hasDiscount: true,
    savingsAmount: 10
  };

  const mockRefundSummary: RefundSummaryDTO = {
    orderId: 'order-1',
    orderStatus: 'CANCELLED',
    originalTotal: 100,
    refundedAmount: 100,
    remainingTotal: 0,
    refundedItems: [],
    refundDate: '2024-01-02',
    loyaltyPointsDeducted: 50
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrderService]
    });
    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getMyOrders', () => {
    it('shouldFetchUserOrdersSuccessfully', (done) => {
      const orders = [mockOrder];

      service.getMyOrders().subscribe((result) => {
        expect(result).toEqual(orders);
        expect(service.orders()).toEqual(orders);
        expect(service.isLoading()).toBe(false);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/orders`);
      expect(req.request.method).toBe('GET');
      req.flush(orders);
    });

    it('shouldHandleOrdersFetchError', (done) => {
      service.getMyOrders().subscribe({
        error: () => {
          expect(service.error()).toBe('Failed to load orders');
          expect(service.isLoading()).toBe(false);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/orders`);
      req.error(new ErrorEvent('Network error'));
    });

    it('shouldSetLoadingStateWhileFetching', () => {
      service.getMyOrders().subscribe();
      expect(service.isLoading()).toBe(true);

      const req = httpMock.expectOne(`${environment.apiUrl}/orders`);
      req.flush([]);
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('getOrdersByStatus', () => {
    it('shouldFetchOrdersByStatusSuccessfully', (done) => {
      const orders = [{ ...mockOrder, status: 'CONFIRMED' }];

      service.getOrdersByStatus('CONFIRMED').subscribe((result) => {
        expect(result).toEqual(orders);
        expect(service.orders()).toEqual(orders);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/orders/status/CONFIRMED`);
      expect(req.request.method).toBe('GET');
      req.flush(orders);
    });

    it('shouldHandleStatusFilterError', (done) => {
      service.getOrdersByStatus('INVALID').subscribe({
        error: () => {
          expect(service.error()).toBe('Failed to load orders');
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/orders/status/INVALID`);
      req.error(new ErrorEvent('Invalid status'));
    });
  });

  describe('getOrderById', () => {
    it('shouldFetchOrderByIdSuccessfully', (done) => {
      service.getOrderById('order-1').subscribe((order) => {
        expect(order).toEqual(mockOrder);
        expect(service.selectedOrder()).toEqual(mockOrder);
        expect(service.isLoading()).toBe(false);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/orders/order-1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockOrder);
    });

    it('shouldHandleOrderNotFound', (done) => {
      service.getOrderById('nonexistent').subscribe({
        error: () => {
          expect(service.error()).toBe('Failed to load order');
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/orders/nonexistent`);
      req.error(new ErrorEvent('Not found'));
    });
  });

  describe('markOrderAsPaid', () => {
    it('shouldMarkOrderAsPaidSuccessfully', (done) => {
      const paidOrder = { ...mockOrder, status: 'CONFIRMED' };

      service.markOrderAsPaid('order-1').subscribe((order) => {
        expect(order.status).toBe('CONFIRMED');
        expect(service.selectedOrder()).toEqual(paidOrder);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/orders/order-1/pay`);
      expect(req.request.method).toBe('PUT');
      req.flush(paidOrder);
    });

    it('shouldHandlePaymentError', (done) => {
      service.markOrderAsPaid('order-1').subscribe({
        error: () => {
          expect(service.error()).toBe('Failed to confirm payment');
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/orders/order-1/pay`);
      req.error(new ErrorEvent('Payment failed'));
    });
  });

  describe('updateOrderStatus', () => {
    it('shouldUpdateOrderStatusSuccessfully', (done) => {
      const updatedOrder = { ...mockOrder, status: 'PROCESSING' };

      service.updateOrderStatus('order-1', 'PROCESSING').subscribe((order) => {
        expect(order.status).toBe('PROCESSING');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/orders/order-1/status`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ status: 'PROCESSING' });
      req.flush(updatedOrder);
    });

    it('shouldHandleStatusUpdateError', (done) => {
      service.updateOrderStatus('order-1', 'INVALID').subscribe({
        error: () => {
          expect(service.error()).toBe('Failed to update order status');
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/orders/order-1/status`);
      req.error(new ErrorEvent('Update failed'));
    });
  });

  describe('cancelOrder', () => {
    it('shouldCancelOrderSuccessfully', (done) => {
      service.cancelOrder('order-1', 'Changed my mind').subscribe((refund) => {
        expect(refund.orderId).toBe('order-1');
        expect(refund.orderStatus).toBe('CANCELLED');
        expect(service.isLoading()).toBe(false);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/orders/order-1/cancel`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ reason: 'Changed my mind' });
      req.flush(mockRefundSummary);
    });

    it('shouldHandleCancelOrderError', (done) => {
      service.cancelOrder('order-1', 'reason').subscribe({
        error: () => {
          expect(service.error()).toBe('Failed to cancel order');
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/orders/order-1/cancel`);
      req.error(new ErrorEvent('Cancel failed'));
    });
  });

  describe('processOrder', () => {
    it('shouldProcessOrderSuccessfully', (done) => {
      const processingOrder = { ...mockOrder, status: 'PROCESSING' };

      service.processOrder('order-1').subscribe((order) => {
        expect(order.status).toBe('PROCESSING');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/orders/order-1/status`);
      req.flush(processingOrder);
    });
  });

  describe('shipOrder', () => {
    it('shouldShipOrderSuccessfully', (done) => {
      const shippedOrder = { ...mockOrder, status: 'SHIPPED' };

      service.shipOrder('order-1').subscribe((order) => {
        expect(order.status).toBe('SHIPPED');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/orders/order-1/status`);
      req.flush(shippedOrder);
    });
  });

  describe('deliverOrder', () => {
    it('shouldDeliverOrderSuccessfully', (done) => {
      const deliveredOrder = { ...mockOrder, status: 'DELIVERED' };

      service.deliverOrder('order-1').subscribe((order) => {
        expect(order.status).toBe('DELIVERED');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/orders/order-1/status`);
      req.flush(deliveredOrder);
    });
  });

  describe('getOrderStatusDisplay', () => {
    it('shouldReturnCorrectStatusDisplay', () => {
      expect(service.getOrderStatusDisplay('PENDING')).toBe('Pending Payment');
      expect(service.getOrderStatusDisplay('CONFIRMED')).toBe('Confirmed');
      expect(service.getOrderStatusDisplay('PROCESSING')).toBe('Processing');
      expect(service.getOrderStatusDisplay('SHIPPED')).toBe('Shipped');
      expect(service.getOrderStatusDisplay('DELIVERED')).toBe('Delivered');
      expect(service.getOrderStatusDisplay('CANCELLED')).toBe('Cancelled');
    });

    it('shouldReturnStatusForUnknownStatus', () => {
      expect(service.getOrderStatusDisplay('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('getOrderStatusClass', () => {
    it('shouldReturnCorrectStatusClass', () => {
      expect(service.getOrderStatusClass('PENDING')).toBe('bg-yellow-100 text-yellow-800');
      expect(service.getOrderStatusClass('CONFIRMED')).toBe('bg-blue-100 text-blue-800');
      expect(service.getOrderStatusClass('DELIVERED')).toBe('bg-green-100 text-green-800');
      expect(service.getOrderStatusClass('CANCELLED')).toBe('bg-red-100 text-red-800');
    });

    it('shouldReturnDefaultClassForUnknownStatus', () => {
      expect(service.getOrderStatusClass('UNKNOWN')).toBe('bg-gray-100 text-gray-700');
    });
  });

  describe('canCancelOrder', () => {
    it('shouldReturnTrueForCancellableStatuses', () => {
      expect(service.canCancelOrder({ ...mockOrder, status: 'PENDING' })).toBe(true);
      expect(service.canCancelOrder({ ...mockOrder, status: 'CONFIRMED' })).toBe(true);
      expect(service.canCancelOrder({ ...mockOrder, status: 'PAID' })).toBe(true);
    });

    it('shouldReturnFalseForNonCancellableStatuses', () => {
      expect(service.canCancelOrder({ ...mockOrder, status: 'SHIPPED' })).toBe(false);
      expect(service.canCancelOrder({ ...mockOrder, status: 'DELIVERED' })).toBe(false);
      expect(service.canCancelOrder({ ...mockOrder, status: 'CANCELLED' })).toBe(false);
    });
  });

  describe('canModifyOrder', () => {
    it('shouldReturnTrueForModifiableStatuses', () => {
      expect(service.canModifyOrder({ ...mockOrder, status: 'PENDING' })).toBe(true);
      expect(service.canModifyOrder({ ...mockOrder, status: 'CONFIRMED' })).toBe(true);
    });

    it('shouldReturnFalseForNonModifiableStatuses', () => {
      expect(service.canModifyOrder({ ...mockOrder, status: 'PROCESSING' })).toBe(false);
      expect(service.canModifyOrder({ ...mockOrder, status: 'SHIPPED' })).toBe(false);
      expect(service.canModifyOrder({ ...mockOrder, status: 'DELIVERED' })).toBe(false);
    });
  });
});
