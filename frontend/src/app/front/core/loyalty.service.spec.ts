import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyAccount, LoyaltyLevel, LOYALTY_LEVELS } from '../models/loyalty.model';
import { environment } from '../../../environment';

describe('LoyaltyService', () => {
  let service: LoyaltyService;
  let httpMock: HttpTestingController;

  const mockLoyaltyAccount: LoyaltyAccount = {
    id: 'loyalty-1',
    userId: 'user-1',
    points: 500,
    lifetimePoints: 1000,
    level: LoyaltyLevel.BRONZE,
    nextLevelPoints: 1000,
    pointsToNextLevel: 500,
    benefits: [],
    history: [],
    memberSince: new Date('2024-01-01'),
    updatedAt: new Date()
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LoyaltyService]
    });
    service = TestBed.inject(LoyaltyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAccount', () => {
    it('shouldFetchLoyaltyAccountSuccessfully', (done) => {
      const mockResponse = {
        id: 'loyalty-1',
        userId: 'user-1',
        points: 500,
        totalPointsEarned: 1000,
        level: 'BRONZE',
        pointsExpireAt: '2024-01-01'
      };

      service.getAccount().subscribe((account) => {
        expect(account.userId).toBe('user-1');
        expect(account.points).toBe(500);
        expect(service.isLoading()).toBe(false);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/loyalty-card`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('shouldHandleAccountFetchError', (done) => {
      service.getAccount().subscribe((account) => {
        expect(account.points).toBe(0);
        expect(service.error()).toBe('Failed to load loyalty account');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/loyalty-card`);
      req.error(new ErrorEvent('Network error'));
    });

    it('shouldSetLoadingStateWhileFetching', () => {
      service.getAccount().subscribe();
      expect(service.isLoading()).toBe(true);

      const req = httpMock.expectOne(`${environment.apiUrl}/loyalty-card`);
      req.flush({});
      expect(service.isLoading()).toBe(false);
    });

    it('shouldMapBackendLevelCorrectly', (done) => {
      const mockResponse = {
        id: 'loyalty-1',
        userId: 'user-1',
        points: 5000,
        totalPointsEarned: 5000,
        level: 'GOLD',
        pointsExpireAt: '2024-01-01'
      };

      service.getAccount().subscribe((account) => {
        expect(account.level).toBe(LoyaltyLevel.GOLD);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/loyalty-card`);
      req.flush(mockResponse);
    });
  });

  describe('redeemPoints', () => {
    it('shouldRedeemPointsSuccessfully', (done) => {
      service.account.set(mockLoyaltyAccount);

      const mockResponse = {
        success: true,
        points: 400
      };

      service.redeemPoints({ points: 100, orderId: 'order-1' }).subscribe((result) => {
        expect(result.success).toBe(true);
        expect(service.isLoading()).toBe(false);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/loyalty-card/convert`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ points: 100 });
      req.flush(mockResponse);
    });

    it('shouldHandleRedeemPointsError', (done) => {
      service.redeemPoints({ points: 100, orderId: 'order-1' }).subscribe((result) => {
        expect(result.success).toBe(false);
        expect(service.error()).toBe('Failed to redeem points');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/loyalty-card/convert`);
      req.error(new ErrorEvent('Redeem failed'));
    });

    it('shouldUpdateAccountPointsAfterRedemption', (done) => {
      service.account.set(mockLoyaltyAccount);

      const mockResponse = {
        success: true,
        points: 400
      };

      service.redeemPoints({ points: 100, orderId: 'order-1' }).subscribe(() => {
        expect(service.account()?.points).toBe(400);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/loyalty-card/convert`);
      req.flush(mockResponse);
    });
  });

  describe('calculatePointsValue', () => {
    it('shouldCalculatePointsValueCorrectly', () => {
      expect(service.calculatePointsValue(100)).toBe(1);
      expect(service.calculatePointsValue(1000)).toBe(10);
      expect(service.calculatePointsValue(50)).toBe(0.5);
    });

    it('shouldHandleZeroPoints', () => {
      expect(service.calculatePointsValue(0)).toBe(0);
    });
  });

  describe('calculatePointsForPurchase', () => {
    it('shouldCalculatePointsForBronzeLevel', () => {
      service.account.set({ ...mockLoyaltyAccount, level: LoyaltyLevel.BRONZE });
      expect(service.calculatePointsForPurchase(100)).toBe(1000);
    });

    it('shouldCalculatePointsForSilverLevel', () => {
      service.account.set({ ...mockLoyaltyAccount, level: LoyaltyLevel.SILVER });
      expect(service.calculatePointsForPurchase(100)).toBe(1500);
    });

    it('shouldCalculatePointsForGoldLevel', () => {
      service.account.set({ ...mockLoyaltyAccount, level: LoyaltyLevel.GOLD });
      expect(service.calculatePointsForPurchase(100)).toBe(2000);
    });

    it('shouldCalculatePointsForPlatinumLevel', () => {
      service.account.set({ ...mockLoyaltyAccount, level: LoyaltyLevel.PLATINUM });
      expect(service.calculatePointsForPurchase(100)).toBe(3000);
    });

    it('shouldHandleZeroPurchaseAmount', () => {
      service.account.set(mockLoyaltyAccount);
      expect(service.calculatePointsForPurchase(0)).toBe(0);
    });

    it('shouldHandleDecimalPurchaseAmount', () => {
      service.account.set(mockLoyaltyAccount);
      expect(service.calculatePointsForPurchase(10.5)).toBe(105);
    });
  });

  describe('getLevelBenefits', () => {
    it('shouldReturnBronzeBenefits', () => {
      const benefits = service.getLevelBenefits(LoyaltyLevel.BRONZE);
      expect(benefits).toContain('10 points per TND');
      expect(benefits).toContain('Basic support');
    });

    it('shouldReturnSilverBenefits', () => {
      const benefits = service.getLevelBenefits(LoyaltyLevel.SILVER);
      expect(benefits).toContain('15 points per TND');
      expect(benefits).toContain('Priority support');
    });

    it('shouldReturnGoldBenefits', () => {
      const benefits = service.getLevelBenefits(LoyaltyLevel.GOLD);
      expect(benefits).toContain('20 points per TND');
      expect(benefits).toContain('Free delivery');
    });

    it('shouldReturnPlatinumBenefits', () => {
      const benefits = service.getLevelBenefits(LoyaltyLevel.PLATINUM);
      expect(benefits).toContain('30 points per TND');
      expect(benefits).toContain('VIP support');
    });
  });

  describe('getLevelThreshold', () => {
    it('shouldReturnBronzeThreshold', () => {
      const threshold = service.getLevelThreshold(LoyaltyLevel.BRONZE);
      expect(threshold.min).toBe(0);
      expect(threshold.max).toBe(999);
    });

    it('shouldReturnSilverThreshold', () => {
      const threshold = service.getLevelThreshold(LoyaltyLevel.SILVER);
      expect(threshold.min).toBe(1000);
      expect(threshold.max).toBe(4999);
    });

    it('shouldReturnGoldThreshold', () => {
      const threshold = service.getLevelThreshold(LoyaltyLevel.GOLD);
      expect(threshold.min).toBe(5000);
      expect(threshold.max).toBe(9999);
    });

    it('shouldReturnPlatinumThreshold', () => {
      const threshold = service.getLevelThreshold(LoyaltyLevel.PLATINUM);
      expect(threshold.min).toBe(10000);
      expect(threshold.max).toBe(Infinity);
    });
  });

  describe('computed properties', () => {
    it('shouldComputeCurrentPoints', () => {
      service.account.set(mockLoyaltyAccount);
      expect(service.currentPoints()).toBe(500);
    });

    it('shouldComputeCurrentLevel', () => {
      service.account.set(mockLoyaltyAccount);
      expect(service.currentLevel()).toBe(LoyaltyLevel.BRONZE);
    });

    it('shouldComputeProgressToNextLevel', () => {
      service.account.set(mockLoyaltyAccount);
      const progress = service.progressToNextLevel();
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
    });

    it('shouldReturnZeroProgressForPlatinumLevel', () => {
      service.account.set({
        ...mockLoyaltyAccount,
        level: LoyaltyLevel.PLATINUM,
        points: 10000
      });
      expect(service.progressToNextLevel()).toBe(100);
    });

    it('shouldReturnNullPointsWhenNoAccount', () => {
      service.account.set(null);
      expect(service.currentPoints()).toBe(0);
    });
  });

  describe('state management', () => {
    it('shouldInitializeWithNullAccount', () => {
      expect(service.account()).toBeNull();
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('shouldUpdateAccountSignal', () => {
      service.account.set(mockLoyaltyAccount);
      expect(service.account()).toEqual(mockLoyaltyAccount);
    });

    it('shouldUpdateLoadingSignal', () => {
      service.isLoading.set(true);
      expect(service.isLoading()).toBe(true);
    });

    it('shouldUpdateErrorSignal', () => {
      service.error.set('Test error');
      expect(service.error()).toBe('Test error');
    });
  });

  describe('getHistory', () => {
    it('shouldReturnEmptyHistoryByDefault', (done) => {
      service.getHistory().subscribe((result) => {
        expect(result.transactions).toEqual([]);
        expect(result.total).toBe(0);
        done();
      });
    });

    it('shouldAcceptPaginationParameters', (done) => {
      service.getHistory(2, 50).subscribe((result) => {
        expect(result.transactions).toEqual([]);
        done();
      });
    });
  });
});
