import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface VehicleDTO {
  id: string; make: string; model: string; licensePlate: string;
  numberOfSeats: number; driverProfileId: string;
}

export interface RideResponseDTO {
  rideId: string; driverProfileId: string; driverName: string; driverRating?: number;
  vehicleId: string; departureLocation: string; destinationLocation: string;
  departureTime: string; availableSeats: number; pricePerSeat: number;
  status: string; estimatedDurationMinutes?: number;
  createdAt?: string;
}

export interface DriverProfileDTO {
  id: string;
  driverName: string;
  licenseNumber: string;
  isVerified: boolean;
  averageRating: number;
  totalRidesCompleted: number;
  totalEarnings: number;
  createdAt?: string;
}

export interface MonthlyEarningDTO {
  month: string;
  earnings: number;
}

export interface DriverStatsDTO {
  totalRidesCreated: number;
  totalRidesCompleted: number;
  totalEarnings: number;
  monthlyEarnings: number;
  pendingRequests: number;
  acceptanceRate: number;
  averageRating: number;
  driverScore: number;
  badge: 'BRONZE' | 'SILVER' | 'GOLD';
  monthlyEarningsTrend: MonthlyEarningDTO[];
}

export interface PassengerProfileDTO {
  id: string; passengerName: string; averageRating: number; totalRidesCompleted: number;
}

export interface BookingResponseDTO {
  bookingId: string; rideId: string; passengerProfileId: string; passengerName: string;
  numberOfSeats: number; pickupLocation: string; dropoffLocation: string;
  status: string; totalPrice: number;
}

export interface RideRequestResponseDTO {
  id: string; passengerProfileId: string; passengerName: string;
  departureLocation: string; destinationLocation: string; departureTime: string;
  requestedSeats: number; proposedPrice: number; status: string;
  rideId?: string; counterPrice?: number; counterPriceNote?: string;
}

export interface PassengerDashboardDTO {
  passengerName: string; averageRating: number; totalRidesCompleted: number;
  totalSpent: number; pendingRequests: number; activeBookings: number;
  recentBookings: BookingResponseDTO[]; myRideRequests: RideRequestResponseDTO[];
}

@Injectable({ providedIn: 'root' })
export class CarpoolingService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly availableRideRequests = signal<RideRequestResponseDTO[]>([]);

  getAllRides(): Observable<RideResponseDTO[]> {
    return this.http.get<RideResponseDTO[]>(`${this.base}/rides`);
  }

  searchRides(from?: string, to?: string, date?: string, seats?: number, postedSince?: string): Observable<any> {
    let params = new HttpParams();
    if (from?.trim())  params = params.set('departureLocation', from.trim());
    if (to?.trim())    params = params.set('destinationLocation', to.trim());
    if (date?.trim())  params = params.set('departureTime', new Date(date).toISOString().slice(0, 19));
    if (seats && seats > 0) params = params.set('requestedSeats', seats.toString());
    if (postedSince)   params = params.set('postedSince', postedSince);
    return this.http.get<any>(`${this.base}/rides/search`, { params });
  }

  getMyRides(): Observable<RideResponseDTO[]> {
    return this.http.get<RideResponseDTO[]>(`${this.base}/rides/my`);
  }

  createRide(payload: any): Observable<RideResponseDTO> {
    this.isLoading.set(true);
    return this.http.post<RideResponseDTO>(`${this.base}/rides`, payload).pipe(
      tap({ next: () => this.isLoading.set(false), error: () => this.isLoading.set(false) })
    );
  }

  cancelRide(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/rides/${id}`);
  }

  getMyVehicles(): Observable<VehicleDTO[]> {
    return this.http.get<VehicleDTO[]>(`${this.base}/vehicles/my`);
  }

  addVehicle(payload: any): Observable<VehicleDTO> {
    this.isLoading.set(true);
    return this.http.post<VehicleDTO>(`${this.base}/vehicles`, payload).pipe(
      tap({ next: () => this.isLoading.set(false), error: () => this.isLoading.set(false) })
    );
  }

  getDriverProfile(): Observable<DriverProfileDTO> {
    return this.http.get<DriverProfileDTO>(`${this.base}/driver-profiles/me`);
  }

  getDriverProfileByUserId(userId: string): Observable<DriverProfileDTO> {
    return this.http.get<DriverProfileDTO>(`${this.base}/driver-profiles/user/${userId}`);
  }

  registerAsDriver(payload: any): Observable<DriverProfileDTO> {
    this.isLoading.set(true);
    return this.http.post<DriverProfileDTO>(`${this.base}/driver-profiles`, payload).pipe(
      tap({ next: () => this.isLoading.set(false), error: () => this.isLoading.set(false) })
    );
  }

  getMyDriverStats(): Observable<DriverStatsDTO> {
    return this.http.get<DriverStatsDTO>(`${this.base}/driver-profiles/me/stats`);
  }

  getDriverDashboard(userId: string): Observable<DriverStatsDTO> {
     return this.http.get<DriverStatsDTO>(`${this.base}/driver-dashboard/${userId}`);
  }

  getPassengerProfile(): Observable<PassengerProfileDTO> {
    return this.http.get<PassengerProfileDTO>(`${this.base}/passenger-profiles/me`);
  }

  registerAsPassenger(): Observable<PassengerProfileDTO> {
    return this.http.post<PassengerProfileDTO>(`${this.base}/passenger-profiles`, {});
  }

  createBooking(payload: any): Observable<BookingResponseDTO> {
    this.isLoading.set(true);
    return this.http.post<BookingResponseDTO>(`${this.base}/bookings`, payload).pipe(
      tap({ next: () => this.isLoading.set(false), error: () => this.isLoading.set(false) })
    );
  }

  getMyBookings(): Observable<BookingResponseDTO[]> {
    return this.http.get<BookingResponseDTO[]>(`${this.base}/bookings/my`);
  }

  getBookingsForRide(rideId: string): Observable<BookingResponseDTO[]> {
    return this.http.get<BookingResponseDTO[]>(`${this.base}/bookings/ride/${rideId}`);
  }

  acceptBooking(bookingId: string): Observable<BookingResponseDTO> {
    return this.http.patch<BookingResponseDTO>(`${this.base}/bookings/${bookingId}/accept`, {});
  }

  rejectBooking(bookingId: string): Observable<BookingResponseDTO> {
    return this.http.patch<BookingResponseDTO>(`${this.base}/bookings/${bookingId}/reject`, {});
  }

  cancelBooking(bookingId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/bookings/${bookingId}`);
  }

  getAvailableRideRequests(): Observable<RideRequestResponseDTO[]> {
    return this.http.get<RideRequestResponseDTO[]>(`${this.base}/ride-requests/available`).pipe(
      tap(reqs => this.availableRideRequests.set(reqs))
    );
  }

  createRideRequest(payload: any): Observable<RideRequestResponseDTO> {
    this.isLoading.set(true);
    return this.http.post<RideRequestResponseDTO>(`${this.base}/ride-requests`, payload).pipe(
      tap({ next: () => this.isLoading.set(false), error: () => this.isLoading.set(false) })
    );
  }

  acceptRideRequest(requestId: string, vehicleId: string): Observable<RideRequestResponseDTO> {
    this.isLoading.set(true);
    return this.http.post<RideRequestResponseDTO>(
      `${this.base}/ride-requests/${requestId}/accept`, { vehicleId }
    ).pipe(tap({ next: () => this.isLoading.set(false), error: () => this.isLoading.set(false) }));
  }

  counterPrice(requestId: string, price: number, note?: string): Observable<RideRequestResponseDTO> {
    this.isLoading.set(true);
    let params = new HttpParams().set('price', price.toString());
    if (note) params = params.set('note', note);
    return this.http.patch<RideRequestResponseDTO>(
      `${this.base}/ride-requests/${requestId}/counter`, {}, { params }
    ).pipe(tap({ next: () => this.isLoading.set(false), error: () => this.isLoading.set(false) }));
  }

  cancelRideRequest(requestId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/ride-requests/${requestId}`);
  }

  getMyRideRequests(): Observable<RideRequestResponseDTO[]> {
    return this.http.get<RideRequestResponseDTO[]>(`${this.base}/ride-requests/my`);
  }

  getPassengerDashboard(): Observable<PassengerDashboardDTO> {
    return this.http.get<PassengerDashboardDTO>(`${this.base}/passenger/dashboard`);
  }
}
