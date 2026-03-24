import { User } from './user.model';

// Carpooling Core Models
export interface Ride {
  id: string;
  driverId: string;
  driver: Driver;
  vehicle: Vehicle;
  departure: RideLocation;
  destination: RideLocation;
  departureTime: Date;
  estimatedArrivalTime: Date;
  availableSeats: number;
  totalSeats: number;
  pricePerSeat: number;
  status: RideStatus;
  preferences: RidePreferences;
  bookings: Booking[];
  route?: RouteInfo;
  isRecurring: boolean;
  recurringDays?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Driver {
  id: string;
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar' | 'phone'>;
  licenseNumber: string;
  licenseExpiry: Date;
  licenseImage?: string;
  isVerified: boolean;
  rating: number;
  totalRides: number;
  totalReviews: number;
  memberSince: Date;
}

export interface Vehicle {
  id: string;
  driverId: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  type: VehicleType;
  features: VehicleFeature[];
  images?: string[];
  isActive: boolean;
  createdAt: Date;
}

export enum VehicleType {
  CAR = 'CAR',
  SUV = 'SUV',
  VAN = 'VAN',
  MOTORCYCLE = 'MOTORCYCLE'
}

export enum VehicleFeature {
  AIR_CONDITIONING = 'AIR_CONDITIONING',
  MUSIC = 'MUSIC',
  USB_CHARGER = 'USB_CHARGER',
  WIFI = 'WIFI',
  PET_FRIENDLY = 'PET_FRIENDLY',
  LUGGAGE_SPACE = 'LUGGAGE_SPACE',
  CHILD_SEAT = 'CHILD_SEAT'
}

export interface RideLocation {
  address: string;
  city: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  landmark?: string;
  isOnCampus: boolean;
  campusGate?: string;
}

export interface RidePreferences {
  smokingAllowed: boolean;
  petsAllowed: boolean;
  musicAllowed: boolean;
  chattinessLevel: 'quiet' | 'moderate' | 'chatty';
  luggageSize: 'small' | 'medium' | 'large';
  genderPreference?: 'same' | 'any';
}

export interface RouteInfo {
  distance: number;
  duration: number;
  polyline?: string;
  stops?: RideLocation[];
}

export enum RideStatus {
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FULL = 'FULL'
}

// Booking Models
export interface Booking {
  id: string;
  rideId: string;
  passengerId: string;
  passenger: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar' | 'phone'>;
  seatsBooked: number;
  pickupLocation?: RideLocation;
  dropoffLocation?: RideLocation;
  status: BookingStatus;
  totalPrice: number;
  paymentStatus: BookingPaymentStatus;
  bookedAt: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  CANCELLED_BY_PASSENGER = 'CANCELLED_BY_PASSENGER',
  CANCELLED_BY_DRIVER = 'CANCELLED_BY_DRIVER',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW'
}

export enum BookingPaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED'
}

// Ride Rating & Review
export interface RideReview {
  id: string;
  rideId: string;
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  reviewerRole: 'driver' | 'passenger';
  rating: number;
  comment?: string;
  criteria: RideReviewCriteria;
  createdAt: Date;
}

export interface RideReviewCriteria {
  punctuality: number;
  safety: number;
  communication: number;
  cleanliness?: number;
  comfort?: number;
}

// Request DTOs
export interface CreateRideRequest {
  vehicleId: string;
  departure: RideLocation;
  destination: RideLocation;
  departureTime: Date;
  availableSeats: number;
  pricePerSeat: number;
  preferences: RidePreferences;
  isRecurring?: boolean;
  recurringDays?: number[];
}

export interface SearchRideRequest {
  from: string;
  to: string;
  date: Date;
  seats?: number;
  maxPrice?: number;
  preferences?: Partial<RidePreferences>;
}

export interface CreateBookingRequest {
  rideId: string;
  seatsBooked: number;
  pickupLocation?: RideLocation;
  dropoffLocation?: RideLocation;
  message?: string;
}

export interface CreateVehicleRequest {
  brand: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  type: VehicleType;
  features: VehicleFeature[];
  images?: string[];
}

export interface CreateRideReviewRequest {
  rideId: string;
  bookingId: string;
  rating: number;
  comment?: string;
  criteria: RideReviewCriteria;
}

// Filter & Response Types
export interface RideFilter {
  from?: string;
  to?: string;
  date?: Date;
  minSeats?: number;
  maxPrice?: number;
  status?: RideStatus;
  driverId?: string;
  page?: number;
  limit?: number;
}

export interface RideListResponse {
  rides: Ride[];
  total: number;
  page: number;
  totalPages: number;
}

export interface BookingFilter {
  status?: BookingStatus;
  rideId?: string;
  passengerId?: string;
  page?: number;
  limit?: number;
}

export interface BookingListResponse {
  bookings: Booking[];
  total: number;
  page: number;
  totalPages: number;
}

// Smart Matching (placeholder for AI)
export interface SmartMatchRecommendation {
  ride: Ride;
  matchScore: number;
  matchReasons: string[];
  estimatedPickupTime?: Date;
}
