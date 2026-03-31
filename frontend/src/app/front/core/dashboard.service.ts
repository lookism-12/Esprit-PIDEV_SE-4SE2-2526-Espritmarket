import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { DashboardData, Activity, BookingRequest } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly apiUrl = '/api/driver';
  private readonly http = inject(HttpClient);

  // Signals for reactive state management
  readonly dashboardData = signal<DashboardData | null>(null);
  readonly isLoadingDashboard = signal<boolean>(false);
  readonly dashboardError = signal<string | null>(null);
  readonly pendingBookings = signal<BookingRequest[]>([]);
  readonly recentActivities = signal<Activity[]>([]);
  readonly earningsHistory = signal<number[]>([]);

  /**
   * Load complete driver dashboard data
   * Includes: stats, rides, bookings, vehicle, activities, earnings
   */
  getDashboard(driverId: string): Observable<DashboardData> {
    this.isLoadingDashboard.set(true);
    this.dashboardError.set(null);

    return this.http.get<DashboardData>(`${this.apiUrl}/dashboard`, {
      headers: { 'X-Driver-Id': driverId }
    }).pipe(
      tap(data => {
        this.dashboardData.set(data);
        this.isLoadingDashboard.set(false);
      }),
      catchError(error => {
        const errorMsg = error.error?.message || 'Failed to load dashboard';
        this.dashboardError.set(errorMsg);
        this.isLoadingDashboard.set(false);
        console.error('Dashboard error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Load pending booking requests for driver's rides
   */
  getPendingBookings(driverId: string): Observable<BookingRequest[]> {
    return this.http.get<BookingRequest[]>(`${this.apiUrl}/pending-bookings`, {
      headers: { 'X-Driver-Id': driverId }
    }).pipe(
      tap(bookings => this.pendingBookings.set(bookings)),
      catchError(error => {
        console.error('Failed to load pending bookings:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Load recent activities (bookings, completions, reviews)
   */
  getRecentActivities(driverId: string, limit: number = 10): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.apiUrl}/activities?limit=${limit}`, {
      headers: { 'X-Driver-Id': driverId }
    }).pipe(
      tap(activities => this.recentActivities.set(activities)),
      catchError(error => {
        console.error('Failed to load activities:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Load earnings history for charts (last 12 months)
   */
  getEarningsHistory(driverId: string): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/earnings-history`, {
      headers: { 'X-Driver-Id': driverId }
    }).pipe(
      tap(history => this.earningsHistory.set(history)),
      catchError(error => {
        console.error('Failed to load earnings history:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Accept a booking request
   */
  acceptBooking(driverId: string, bookingId: string): Observable<any> {
    return this.http.put(
      `/api/bookings/${bookingId}/accept`,
      {},
      { headers: { 'X-Driver-Id': driverId } }
    ).pipe(
      catchError(error => {
        console.error('Failed to accept booking:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Decline/reject a booking request
   */
  declineBooking(driverId: string, bookingId: string): Observable<any> {
    return this.http.put(
      `/api/bookings/${bookingId}/decline`,
      {},
      { headers: { 'X-Driver-Id': driverId } }
    ).pipe(
      catchError(error => {
        console.error('Failed to decline booking:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh all dashboard data
   */
  refreshDashboard(driverId: string): Observable<DashboardData> {
    return this.getDashboard(driverId);
  }

  /**
   * Clear dashboard state
   */
  clearDashboard(): void {
    this.dashboardData.set(null);
    this.pendingBookings.set([]);
    this.recentActivities.set([]);
    this.earningsHistory.set([]);
    this.dashboardError.set(null);
  }
}
