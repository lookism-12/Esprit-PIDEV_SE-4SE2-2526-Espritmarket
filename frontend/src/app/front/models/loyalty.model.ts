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

export const LOYALTY_LEVELS: LoyaltyLevelThreshold[] = [
  {
    level: LoyaltyLevel.BRONZE,
    minPoints: 0,
    maxPoints: 999,
    benefits: ['10 points per TND', 'Basic support'],
    multiplier: 1
  },
  {
    level: LoyaltyLevel.SILVER,
    minPoints: 1000,
    maxPoints: 4999,
    benefits: ['15 points per TND', 'Priority support', 'Exclusive deals'],
    multiplier: 1.5
  },
  {
    level: LoyaltyLevel.GOLD,
    minPoints: 5000,
    maxPoints: 9999,
    benefits: ['20 points per TND', 'Free delivery', 'Early access to sales'],
    multiplier: 2
  },
  {
    level: LoyaltyLevel.PLATINUM,
    minPoints: 10000,
    maxPoints: Infinity,
    benefits: ['30 points per TND', 'Free express delivery', 'VIP support', 'Exclusive events'],
    multiplier: 3
  }
];
