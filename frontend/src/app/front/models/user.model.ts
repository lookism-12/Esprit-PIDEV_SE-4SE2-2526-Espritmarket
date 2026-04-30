export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  deliveryZone?: string;
  vehicleType?: string;
  drivingLicenseNumber?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdatedAt?: string;
  isAvailableForDelivery?: boolean;
  roles: UserRole[]; // ✅ Primary roles array (matches backend)
  role: UserRole; // ✅ Keep for backward compatibility (first role)
  isVerified: boolean;
  academicInfo?: AcademicInfo;
  reputation?: ReputationInfo;
  preferences?: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface AcademicInfo {
  studentId: string;
  department: string;
  level: string;
  specialization?: string;
}

export interface ReputationInfo {
  score: number;
  level: ReputationLevel;
  badges: Badge[];
  totalReviews: number;
  averageRating: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
}

export interface UserPreferences {
  notifications: NotificationPreferences;
  language: string;
  theme: 'light' | 'dark' | 'system';
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  internal: boolean;
  external: boolean;
}

// Backend Role enum - matches Spring Boot
export enum UserRole {
  CLIENT = 'CLIENT',
  PROVIDER = 'PROVIDER',
  DRIVER = 'DRIVER',
  PASSENGER = 'PASSENGER',
  DELIVERY = 'DELIVERY',
  ADMIN = 'ADMIN',
  SELLER = 'SELLER' // ✅ Added SELLER role
}

// Frontend role groups for registration UI
export type RoleGroup = 'client' | 'provider' | 'logistics';
export type ClientSubRole = 'CLIENT' | 'PASSENGER';
export type LogisticsSubRole = 'DRIVER' | 'DELIVERY';

export enum ReputationLevel {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM'
}
