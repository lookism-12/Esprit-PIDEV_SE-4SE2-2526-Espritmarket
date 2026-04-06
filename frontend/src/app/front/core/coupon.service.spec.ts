import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { CouponService, CreateCouponRequest } from './coupon.service';
import { Coupon, PromotionType, CouponValidationResult } from '../models/promotion.model';
import { TestBed } from '@angular/core/testing';

describe('CouponService', () => {
  let service: CouponService;

  const mockCoupon: Coupon = {
    id: 'coupon-1',
    code: 'SAVE20',
    name: 'Save 20%',
    description: 'Save 20% on all products',
    type: PromotionType.PERCENTAGE,
    value: 20,
    minCartAmount: 50,
    maxDiscount: 100,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2025-12-31'),
    usageLimit: 100,
    usageCount: 10,
    isActive: true,
    isPublic: true,
    isSingleUse: false,
    eligibleProducts: [],
    eligibleCategories: []
  };

  beforeEach(() => {
    service = new CouponService(null as any);
  });

  describe('validateCouponClient', () => {
    it('shouldValidateActiveCoupon', () => {
      const result = service.validateCouponClient(mockCoupon, 100);
      expect(result.isValid).toBe(true);
      expect(result.coupon).toEqual(mockCoupon);
    });

    it('shouldRejectInactiveCoupon', () => {
      const inactiveCoupon = { ...mockCoupon, isActive: false };
      const result = service.validateCouponClient(inactiveCoupon, 100);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('no longer active');
    });

    it('shouldRejectExpiredCoupon', () => {
      const expiredCoupon = {
        ...mockCoupon,
        endDate: new Date('2020-01-01')
      };
      const result = service.validateCouponClient(expiredCoupon, 100);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('expired');
    });

    it('shouldRejectNotYetValidCoupon', () => {
      const futureCoupon = {
        ...mockCoupon,
        startDate: new Date('2099-01-01')
      };
      const result = service.validateCouponClient(futureCoupon, 100);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('not yet valid');
    });

    it('shouldRejectCouponWithExceededUsageLimit', () => {
      const limitedCoupon = {
        ...mockCoupon,
        usageLimit: 10,
        usageCount: 10
      };
      const result = service.validateCouponClient(limitedCoupon, 100);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('usage limit');
    });

    it('shouldRejectCouponBelowMinimumCartAmount', () => {
      const result = service.validateCouponClient(mockCoupon, 30);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('Minimum cart amount');
    });

    it('shouldCalculatePercentageDiscount', () => {
      const result = service.validateCouponClient(mockCoupon, 100);
      expect(result.isValid).toBe(true);
      expect(result.discount).toBe(20);
    });

    it('shouldCapPercentageDiscountAtMaxDiscount', () => {
      const result = service.validateCouponClient(mockCoupon, 1000);
      expect(result.isValid).toBe(true);
      expect(result.discount).toBe(100);
    });

    it('shouldCalculateFixedAmountDiscount', () => {
      const fixedCoupon = {
        ...mockCoupon,
        type: PromotionType.FIXED_AMOUNT,
        value: 15
      };
      const result = service.validateCouponClient(fixedCoupon, 100);
      expect(result.isValid).toBe(true);
      expect(result.discount).toBe(15);
    });

    it('shouldValidateCouponWithoutMinimumAmount', () => {
      const couponNoMin = { ...mockCoupon, minCartAmount: undefined };
      const result = service.validateCouponClient(couponNoMin, 10);
      expect(result.isValid).toBe(true);
    });

    it('shouldValidateCouponWithoutUsageLimit', () => {
      const couponNoLimit = {
        ...mockCoupon,
        usageLimit: undefined,
        usageCount: 1000
      };
      const result = service.validateCouponClient(couponNoLimit, 100);
      expect(result.isValid).toBe(true);
    });
  });

  describe('state management', () => {
    it('shouldInitializeWithEmptyState', () => {
      expect(service.coupons()).toEqual([]);
      expect(service.appliedCoupon()).toBeNull();
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('shouldUpdateAppliedCouponSignal', () => {
      service.appliedCoupon.set(mockCoupon);
      expect(service.appliedCoupon()).toEqual(mockCoupon);
    });

    it('shouldUpdateLoadingSignal', () => {
      service.isLoading.set(true);
      expect(service.isLoading()).toBe(true);
      service.isLoading.set(false);
      expect(service.isLoading()).toBe(false);
    });

    it('shouldUpdateErrorSignal', () => {
      service.error.set('Test error');
      expect(service.error()).toBe('Test error');
      service.error.set(null);
      expect(service.error()).toBeNull();
    });
  });

  describe('removeCoupon', () => {
    it('shouldClearAppliedCoupon', (done) => {
      service.appliedCoupon.set(mockCoupon);
      service.removeCoupon('cart-1').subscribe(() => {
        expect(service.appliedCoupon()).toBeNull();
        done();
      });
    });
  });

  describe('edge cases', () => {
    it('shouldHandleCouponWithZeroValue', () => {
      const zeroCoupon = { ...mockCoupon, value: 0 };
      const result = service.validateCouponClient(zeroCoupon, 100);
      expect(result.isValid).toBe(true);
      expect(result.discount).toBe(0);
    });

    it('shouldHandleCouponWithNegativeValue', () => {
      const negativeCoupon = { ...mockCoupon, value: -20 };
      const result = service.validateCouponClient(negativeCoupon, 100);
      expect(result.isValid).toBe(true);
      expect(result.discount).toBe(-20);
    });

    it('shouldHandleVeryLargeCartAmount', () => {
      const result = service.validateCouponClient(mockCoupon, 1000000);
      expect(result.isValid).toBe(true);
      expect(result.discount).toBe(100);
    });

    it('shouldHandleZeroCartAmount', () => {
      const result = service.validateCouponClient(mockCoupon, 0);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('Minimum cart amount');
    });
  });
});
