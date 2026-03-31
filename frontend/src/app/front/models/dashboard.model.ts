// Dashboard Models & Interfaces

export interface DashboardData {
  completedRides: number;
  averageRating: number;
  earningsThisMonth: number;
  activeRides: number;
  totalEarnings: number;
  scheduledRides: ScheduledRide[];
  pendingBookings: BookingRequest[];
  currentVehicle: Vehicle | null;
  recentActivities: Activity[];
  earningsHistory: number[];
  earningsLabels: string[];
  driverName: string;
  isVerified: boolean;
  totalBalance?: number;
  recentReviews: Review[];
}

export interface Review {
  id: string;
  passengerName: string;
  passengerAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ScheduledRide {
  rideId: string;
  departureLocation: string;
  destinationLocation: string;
  departureTime: string;
  availableSeats: number;
  pricePerSeat: number;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  passengerName?: string;
  passengerCount?: number;
}

export interface BookingRequest {
  bookingId: string;
  rideId: string;
  passengerName: string;
  passengerAvatar?: string;
  seatsRequested: number;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt?: number;
}

export interface Vehicle {
  vehicleId: string;
  registrationNumber: string;
  make: string;
  model: string;
  color: string;
  seatingCapacity: number;
  imageUrl?: string;
  isActive: boolean;
}

export interface Activity {
  activityId?: string;
  type: 'BOOKING_REQUEST' | 'RIDE_COMPLETED' | 'REVIEW_RECEIVED' | 'PAYMENT_RECEIVED';
  message: string;
  passengerName?: string;
  passengerAvatar?: string;
  timestamp: number;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED';
}

export interface PerformanceStats {
  completedRides: number;
  averageRating: number;
  totalEarnings: number;
  activeRides: number;
}

export interface QuickAction {
  title: string;
  value: string;
  icon: string;
  color: string;
  path?: string;
}
