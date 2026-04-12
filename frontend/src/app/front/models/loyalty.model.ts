export interface LoyaltyAccount {
  id: string;
  userId: string;
  points: number;
  lifetimePoints: number;
  level: LoyaltyLevel;
  nextLevelPoints: number;
  pointsToNextLevel: number;
  benefits: LoyaltyBenefit[];
  history: PointsTransaction[];
  memberSince: Date;
  updatedAt: Date;
}

export enum LoyaltyLevel {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM'
}

export interface LoyaltyBenefit {
  id: string;
  level: LoyaltyLevel;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
}

export interface PointsTransaction {
  id: string;
  userId: string;
  type: PointsTransactionType;
  points: number;
  description: string;
  referenceId?: string;
  referenceType?: 'order' | 'review' | 'referral' | 'promotion';
  createdAt: Date;
  expiresAt?: Date;
}

export enum PointsTransactionType {
  EARNED = 'EARNED',
  REDEEMED = 'REDEEMED',
  EXPIRED = 'EXPIRED',
  BONUS = 'BONUS',
  ADJUSTMENT = 'ADJUSTMENT'
}

export interface RedeemPointsRequest {
  points: number;
  orderId: string;
}

export interface LoyaltyLevelThreshold {
  level: LoyaltyLevel;
  minPoints: number;
  maxPoints: number;
  benefits: string[];
  multiplier: number;
}

/**
 * Loyalty level thresholds and benefits
 * 
 * REALISTIC E-COMMERCE THRESHOLDS:
 * - BRONZE: 0-4,999 total points (1% of purchases)
 * - SILVER: 5,000-19,999 total points (1.1x multiplier)
 * - GOLD: 20,000-49,999 total points (1.25x multiplier)
 * - PLATINUM: 50,000+ total points (1.5x multiplier)
 * 
 * Example: $1750 iPhone = 17.5 base points × 1.5 (Platinum) = 26 points
 * To reach Platinum: Need ~$33,333 in total purchases (realistic for VIP customers)
 */
export const LOYALTY_LEVELS: LoyaltyLevelThreshold[] = [
  {
    level: LoyaltyLevel.BRONZE,
    minPoints: 0,
    maxPoints: 4999,
    benefits: ['1% points rate', 'Standard support'],
    multiplier: 1.0
  },
  {
    level: LoyaltyLevel.SILVER,
    minPoints: 5000,
    maxPoints: 19999,
    benefits: ['1.1x points multiplier', 'Priority support', 'Exclusive deals'],
    multiplier: 1.1
  },
  {
    level: LoyaltyLevel.GOLD,
    minPoints: 20000,
    maxPoints: 49999,
    benefits: ['1.25x points multiplier', 'Free delivery', 'Early access to sales'],
    multiplier: 1.25
  },
  {
    level: LoyaltyLevel.PLATINUM,
    minPoints: 50000,
    maxPoints: Infinity,
    benefits: ['1.5x points multiplier', 'Free express delivery', 'VIP support', 'Exclusive events'],
    multiplier: 1.5
  }
];
