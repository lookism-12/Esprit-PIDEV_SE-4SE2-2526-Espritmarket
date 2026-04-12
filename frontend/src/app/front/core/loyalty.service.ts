import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError } from 'rxjs';
import {
  LoyaltyAccount,
  LoyaltyLevel,
  LoyaltyBenefit,
  PointsTransaction,
  RedeemPointsRequest,
  LOYALTY_LEVELS
} from '../models/loyalty.model';
import { environment } from '../../../environment';

@Injectable({
  providedIn: 'root'
})
export class LoyaltyService {
  private readonly apiUrl = `${environment.apiUrl}/loyalty`;
  private http = inject(HttpClient);

  readonly account = signal<LoyaltyAccount | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly currentPoints = computed(() => this.account()?.points ?? 0);
  readonly currentLevel = computed(() => this.account()?.level ?? LoyaltyLevel.BRONZE);
  readonly progressToNextLevel = computed(() => {
    const account = this.account();
    if (!account) return 0;
    const currentLevelInfo = LOYALTY_LEVELS.find(l => l.level === account.level);
    if (!currentLevelInfo || currentLevelInfo.maxPoints === Infinity) return 100;
    const pointsInLevel = account.points - currentLevelInfo.minPoints;
    const levelRange = currentLevelInfo.maxPoints - currentLevelInfo.minPoints;
    return Math.min(100, Math.round((pointsInLevel / levelRange) * 100));
  });

  /**
   * Get user's loyalty account from backend
   */
  getAccount(): Observable<LoyaltyAccount> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<any>(`${environment.apiUrl}/loyalty-card`).pipe(
      tap((response) => {
        // Map backend LoyaltyCardResponse to frontend LoyaltyAccount
        const account: LoyaltyAccount = {
          id: response.id,
          userId: response.userId,
          points: response.points || 0,
          lifetimePoints: response.totalPointsEarned || 0,
          level: this.mapBackendLevel(response.level),
          nextLevelPoints: this.calculateNextLevelPoints(response.totalPointsEarned || 0),
          pointsToNextLevel: this.calculatePointsToNextLevel(response.totalPointsEarned || 0),
          benefits: this.getLevelBenefitsAsObjects(this.mapBackendLevel(response.level)),
          history: [], // TODO: Implement history endpoint
          memberSince: new Date(response.pointsExpireAt || Date.now()),
          updatedAt: new Date()
        };
        
        this.account.set(account);
        this.isLoading.set(false);
        console.log('✅ Loyalty account loaded:', account);
      }),
      catchError((error) => {
        console.error('❌ Failed to load loyalty account:', error);
        this.error.set('Failed to load loyalty account');
        this.isLoading.set(false);
        
        // Return mock account as fallback
        const mockAccount: LoyaltyAccount = {
          id: 'mock',
          userId: 'mock',
          points: 0,
          lifetimePoints: 0,
          level: LoyaltyLevel.BRONZE,
          nextLevelPoints: 1000,
          pointsToNextLevel: 1000,
          benefits: [],
          history: [],
          memberSince: new Date(),
          updatedAt: new Date()
        };
        
        this.account.set(mockAccount);
        return of(mockAccount);
      })
    );
  }

  /**
   * Get transaction history (placeholder for future implementation)
   */
  getHistory(page = 1, limit = 20): Observable<{ transactions: PointsTransaction[]; total: number }> {
    console.log('LoyaltyService.getHistory() - Backend endpoint not implemented yet');
    return of({ transactions: [], total: 0 });
  }

  /**
   * Redeem points for discount
   */
  redeemPoints(request: RedeemPointsRequest): Observable<{ success: boolean; newBalance: number }> {
    this.isLoading.set(true);
    
    return this.http.post<any>(`${environment.apiUrl}/loyalty-card/convert`, {
      points: request.points
    }).pipe(
      tap((response) => {
        console.log('✅ Points redeemed:', response);
        // Update local account
        const currentAccount = this.account();
        if (currentAccount) {
          currentAccount.points = response.points || 0;
          this.account.set({ ...currentAccount });
        }
        this.isLoading.set(false);
      }),
      catchError((error) => {
        console.error('❌ Failed to redeem points:', error);
        this.error.set('Failed to redeem points');
        this.isLoading.set(false);
        return of({ success: false, newBalance: this.currentPoints() });
      })
    );
  }

  /**
   * Calculate points value in currency
   */
  calculatePointsValue(points: number): number {
    // 100 points = 1 TND (matches backend POINTS_TO_DISCOUNT_RATIO)
    return points / 100;
  }

  /**
   * Calculate points for purchase amount
   * 
   * ⚠️ IMPORTANT: This is for DISPLAY ONLY (estimates)
   * Actual points are calculated by backend using:
   * - Product-level formula: sum(price * quantity * 0.01) [1% instead of 10%]
   * - Tier multiplier (1.0x to 1.5x instead of 1.0x to 2.0x)
   * - Quantity bonus (>= 10 items → +5% instead of >= 5 items → +10%)
   * - Price bonus (> $500 → +5 flat points instead of > $200 → +20 points)
   * 
   * Frontend should NEVER calculate actual points to award.
   * Always use backend-calculated values from API responses.
   */
  calculatePointsForPurchase(amount: number): number {
    const account = this.account();
    const level = account?.level ?? LoyaltyLevel.BRONZE;
    const levelInfo = LOYALTY_LEVELS.find(l => l.level === level);
    const multiplier = levelInfo?.multiplier ?? 1;
    
    // Realistic estimate: amount * 0.01 * multiplier (1% base rate)
    return Math.floor(amount * 0.01 * multiplier);
  }

  /**
   * Get benefits for a loyalty level as objects
   */
  private getLevelBenefitsAsObjects(level: LoyaltyLevel): LoyaltyBenefit[] {
    const benefits = this.getLevelBenefits(level);
    return benefits.map((benefit, index) => ({
      id: `${level.toLowerCase()}_${index}`,
      level: level,
      name: benefit,
      description: benefit,
      icon: '⭐',
      isActive: true
    }));
  }

  /**
   * Get benefits for a loyalty level as strings
   */
  getLevelBenefits(level: LoyaltyLevel): string[] {
    return LOYALTY_LEVELS.find(l => l.level === level)?.benefits ?? [];
  }

  /**
   * Get level threshold
   */
  getLevelThreshold(level: LoyaltyLevel): { min: number; max: number } {
    const levelInfo = LOYALTY_LEVELS.find(l => l.level === level);
    return { min: levelInfo?.minPoints ?? 0, max: levelInfo?.maxPoints ?? 0 };
  }

  /**
   * Map backend level string to frontend enum
   */
  private mapBackendLevel(backendLevel: string): LoyaltyLevel {
    switch (backendLevel?.toUpperCase()) {
      case 'SILVER': return LoyaltyLevel.SILVER;
      case 'GOLD': return LoyaltyLevel.GOLD;
      case 'PLATINUM': return LoyaltyLevel.PLATINUM;
      default: return LoyaltyLevel.BRONZE;
    }
  }

  /**
   * Calculate points needed for next level
   */
  private calculateNextLevelPoints(totalPoints: number): number {
    // Realistic thresholds: BRONZE=0-4999, SILVER=5000-19999, GOLD=20000-49999, PLATINUM=50000+
    if (totalPoints < 5000) return 5000;
    if (totalPoints < 20000) return 20000;
    if (totalPoints < 50000) return 50000;
    return 50000; // Already at max level
  }

  /**
   * Calculate points to next level
   */
  private calculatePointsToNextLevel(totalPoints: number): number {
    const nextLevel = this.calculateNextLevelPoints(totalPoints);
    return Math.max(0, nextLevel - totalPoints);
  }
}
