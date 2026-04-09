import { User } from './user.model';

export enum RideStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export enum RideRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  CANCELLED = 'CANCELLED'
}

export enum VehicleType {
  CAR = 'CAR', SUV = 'SUV', VAN = 'VAN', MOTORCYCLE = 'MOTORCYCLE'
}

export enum VehicleFeature {
  AIR_CONDITIONING = 'AIR_CONDITIONING', MUSIC = 'MUSIC', USB_CHARGER = 'USB_CHARGER',
  WIFI = 'WIFI', PET_FRIENDLY = 'PET_FRIENDLY', LUGGAGE_SPACE = 'LUGGAGE_SPACE', CHILD_SEAT = 'CHILD_SEAT'
}

export interface Ride {
  rideId: string; driverProfileId: string; driverName: string; driverRating: number;
  vehicleId: string; vehicleMake: string; vehicleModel: string;
  departureLocation: string; destinationLocation: string; departureTime: string;
  availableSeats: number; pricePerSeat: number; status: RideStatus;
  estimatedDurationMinutes: number; totalSeats: number; bookedSeats: number;
  paidBookingsCount: number; completedAt?: string;
}

export interface RideRequest {
  id: string; passengerProfileId: string; passengerName: string;
  departureLocation: string; destinationLocation: string; departureTime: string;
  requestedSeats: number; proposedPrice: number; status: RideRequestStatus;
  driverId?: string; driverName?: string;
}

export interface DriverProfile {
  id: string; userId: string; fullName: string; email: string;
  licenseNumber: string; licenseDocument: string; isVerified: boolean;
  averageRating: number; totalRidesCompleted: number; totalEarnings: number;
  rideIds: string[]; vehicleIds: string[]; createdAt: string; updatedAt: string;
}

export interface Driver {
  id: string;
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar' | 'phone'>;
  licenseNumber: string; isVerified: boolean; rating: number; memberSince: string;
}

export interface PassengerProfile {
  id: string; userId: string; fullName: string; email: string;
  averageRating: number; preferences: string; bookingIds: string[];
  totalRidesCompleted: number; createdAt: string; updatedAt: string;
}

export interface Vehicle {
  id: string; driverId: string; brand: string; model: string; year: number;
  color: string; licensePlate: string; type: VehicleType; features: VehicleFeature[];
  images?: string[]; isActive: boolean;
}

export interface Booking {
  id: string; rideId: string; passengerId: string; seatsBooked: number;
  status: BookingStatus; totalPrice: number; bookedAt: string;
}

export interface RidePayment {
  id: string; bookingId: string; amount: number; status: string;
  createdAt: string; updatedAt?: string;
}

export interface CreateRideRequest {
  vehicleId: string; departureLocation: string; destinationLocation: string;
  departureTime: string; availableSeats: number; pricePerSeat: number;
}

export interface SearchRideRequest { from: string; to: string; date: string; seats?: number; }

export interface CreateBookingRequest {
  rideId: string; seatsBooked: number; pickupLocation?: string; dropoffLocation?: string;
}

export interface CreateVehicleRequest {
  brand: string; model: string; year: number; color: string;
  licensePlate: string; type: VehicleType; features: VehicleFeature[];
}

export interface RideReview {
  id: string; rideId: string; bookingId: string; rating: number; comment?: string; createdAt: string;
}

export interface CreateRideReviewRequest { rideId: string; bookingId: string; rating: number; comment?: string; }

export interface RideListResponse { rides: Ride[]; total: number; page: number; totalPages: number; }
export interface BookingListResponse { bookings: Booking[]; total: number; page: number; totalPages: number; }
export interface RideFilter { from?: string; to?: string; status?: string; }
export interface BookingFilter { status?: string; }

export interface SmartMatchRecommendation { ride: Ride; matchScore: number; matchReasons: string[]; }

export interface AdminDashboardStats {
  activeRidesCount: number; pendingRequestsCount: number; unverifiedDriversCount: number; totalRevenue: number;
  activeRidesGrowth: number; pendingRequestsGrowth: number; unverifiedDriversGrowth: number; totalRevenueGrowth: number;
}

// Dashboard Models
export interface DashboardData {
  completedRides: number; averageRating: number; earningsThisMonth: number; activeRides: number;
  totalEarnings: number; scheduledRides: ScheduledRide[]; pendingBookings: BookingRequest[];
  currentVehicle: Vehicle | null; recentActivities: Activity[]; earningsHistory: number[];
  earningsLabels: string[]; driverName: string; isVerified: boolean; totalBalance?: number; recentReviews: Review[];
}

export interface Review {
  id: string; passengerName: string; passengerAvatar?: string; rating: number; comment: string; createdAt: string;
}

export interface ScheduledRide {
  rideId: string; departureLocation: string; destinationLocation: string; departureTime: string;
  availableSeats: number; pricePerSeat: number;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  passengerName?: string; passengerCount?: number;
}

export interface BookingRequest {
  bookingId: string; rideId: string; passengerName: string; passengerAvatar?: string;
  seatsRequested: number; status: 'PENDING' | 'ACCEPTED' | 'DECLINED'; createdAt?: number;
}

export interface Activity {
  activityId?: string;
  type: 'BOOKING_REQUEST' | 'RIDE_COMPLETED' | 'REVIEW_RECEIVED' | 'PAYMENT_RECEIVED';
  message: string; passengerName?: string; passengerAvatar?: string; timestamp: number;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED';
}

export interface PerformanceStats {
  completedRides: number; averageRating: number; totalEarnings: number; activeRides: number;
}

export interface QuickAction {
  title: string; value: string; icon: string; color: string; path?: string;
}
