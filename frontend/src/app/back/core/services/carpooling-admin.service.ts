import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// DTOs matching the Spring Boot backend exactly
export interface AdminRideDTO {
    rideId: string;
    driverProfileId: string;
    driverName: string;
    driverRating?: number;
    vehicleId: string;
    vehicleMake?: string;
    vehicleModel?: string;
    departureLocation: string;
    destinationLocation: string;
    departureTime: string;
    availableSeats: number;
    pricePerSeat: number;
    status: string;
    estimatedDurationMinutes?: number;
    totalSeats?: number;
    bookedSeats?: number;
    paidBookingsCount?: number;
    completedAt?: string;
}

export interface AdminRideRequestDTO {
    id: string;
    passengerProfileId: string;
    passengerName: string;
    departureLocation: string;
    destinationLocation: string;
    departureTime: string;
    requestedSeats: number;
    proposedPrice: number;
    status: string;
    driverId?: string;
    driverName?: string;
    counterPrice?: number;
    counterPriceNote?: string;
}

export interface AdminDriverProfileDTO {
    id: string;
    userId: string;
    fullName: string;
    email: string;
    licenseNumber: string;
    licenseDocument?: string;
    isVerified: boolean;
    averageRating?: number;
    totalRidesCompleted?: number;
    totalEarnings?: number;
    rideIds?: string[];
    vehicleIds?: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface AdminPassengerProfileDTO {
    id: string;
    userId: string;
    fullName: string;
    email: string;
    averageRating?: number;
    preferences?: string;
    bookingIds?: string[];
    totalRidesCompleted?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface AdminPaymentDTO {
    id: string;
    bookingId: string;
    amount: number;
    status: string;
    createdAt: string;
    updatedAt?: string;
}

export interface AdminStatsDTO {
    activeRidesCount: number;
    pendingRequestsCount: number;
    unverifiedDriversCount: number;
    totalRevenue: number;
    activeRidesGrowth: number;
    pendingRequestsGrowth: number;
    unverifiedDriversGrowth: number;
    totalRevenueGrowth: number;
}

@Injectable({ providedIn: 'root' })
export class CarpoolingAdminService {
    private readonly apiUrl = '/api';

    constructor(private http: HttpClient) { }

    // ── Stats ─────────────────────────────────────────────────────────────
    getStats(): Observable<AdminStatsDTO> {
        return this.http.get<AdminStatsDTO>(`${this.apiUrl}/admin/carpooling/stats`).pipe(
            catchError(() => of({
                activeRidesCount: 0, pendingRequestsCount: 0, unverifiedDriversCount: 0, totalRevenue: 0,
                activeRidesGrowth: 0, pendingRequestsGrowth: 0, unverifiedDriversGrowth: 0, totalRevenueGrowth: 0
            }))
        );
    }

    // ── Rides ─────────────────────────────────────────────────────────────
    getAllRides(): Observable<AdminRideDTO[]> {
        return this.http.get<AdminRideDTO[]>(`${this.apiUrl}/rides`).pipe(catchError(() => of([])));
    }

    updateRideStatus(id: string, status: string): Observable<any> {
        return this.http.patch(`${this.apiUrl}/rides/${id}/status`, {}, {
            params: new HttpParams().set('status', status)
        });
    }

    updateRide(id: string, dto: any): Observable<any> {
        return this.http.patch(`${this.apiUrl}/rides/${id}`, dto);
    }

    // ── Ride Requests ─────────────────────────────────────────────────────
    getAllRideRequests(): Observable<AdminRideRequestDTO[]> {
        return this.http.get<AdminRideRequestDTO[]>(`${this.apiUrl}/ride-requests`).pipe(catchError(() => of([])));
    }

    cancelRideRequest(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/ride-requests/${id}/admin`);
    }

    // ── Driver Profiles ───────────────────────────────────────────────────
    getAllDriverProfiles(): Observable<AdminDriverProfileDTO[]> {
        return this.http.get<AdminDriverProfileDTO[]>(`${this.apiUrl}/driver-profiles/all`).pipe(catchError(() => of([])));
    }

    verifyDriver(id: string): Observable<any> {
        return this.http.patch(`${this.apiUrl}/driver-profiles/${id}/verify`, {});
    }

    updateDriver(id: string, dto: any): Observable<any> {
        return this.http.patch(`${this.apiUrl}/driver-profiles/${id}`, dto);
    }

    deleteDriver(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/driver-profiles/${id}`);
    }

    // ── Passenger Profiles ────────────────────────────────────────────────
    getAllPassengerProfiles(): Observable<AdminPassengerProfileDTO[]> {
        return this.http.get<AdminPassengerProfileDTO[]>(`${this.apiUrl}/passenger-profiles`).pipe(catchError(() => of([])));
    }

    updatePassenger(id: string, dto: any): Observable<any> {
        return this.http.patch(`${this.apiUrl}/passenger-profiles/${id}`, dto);
    }

    deletePassenger(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/passenger-profiles/${id}`);
    }

    // ── Payments ──────────────────────────────────────────────────────────
    getAllPayments(): Observable<AdminPaymentDTO[]> {
        return this.http.get<AdminPaymentDTO[]>(`${this.apiUrl}/ride-payments`).pipe(catchError(() => of([])));
    }

    updatePaymentStatus(id: string, status: string): Observable<any> {
        return this.http.patch(`${this.apiUrl}/ride-payments/${id}/status`, {}, {
            params: new HttpParams().set('status', status)
        });
    }
}
