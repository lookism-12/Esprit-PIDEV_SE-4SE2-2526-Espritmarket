import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  label: string;
}

export interface BookingRequest {
  serviceId: string;
  bookingDate: string;
  startTime: string;
  notes?: string;
}

export interface BookingResponse {
  id: string;
  serviceId: string;
  serviceName: string;
  userId: string;
  userName: string;
  shopId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  createdAt: string;
  notes?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  rejectionReason?: string;
  rejectedAt?: string;
  approvedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = `${environment.apiUrl}/service-bookings`;

  constructor(private http: HttpClient) {}

  /**
   * Get available time slots for a service on a specific date
   */
  getAvailableTimeSlots(serviceId: string, date: string): Observable<TimeSlot[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<TimeSlot[]>(`${this.apiUrl}/services/${serviceId}/available-slots`, { params });
  }

  /**
   * Create a new booking
   */
  createBooking(request: BookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(this.apiUrl, request);
  }

  /**
   * Get all bookings for current user
   */
  getMyBookings(): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.apiUrl}/my-bookings`);
  }

  /**
   * Get all bookings for a service
   */
  getServiceBookings(serviceId: string): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.apiUrl}/services/${serviceId}`);
  }

  /**
   * Cancel a booking
   */
  cancelBooking(bookingId: string, reason?: string): Observable<BookingResponse> {
    const body = reason ? { reason } : {};
    return this.http.delete<BookingResponse>(`${this.apiUrl}/${bookingId}`, { body });
  }
  
  /**
   * Approve a booking (provider only)
   */
  approveBooking(bookingId: string): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.apiUrl}/${bookingId}/approve`, {});
  }
  
  /**
   * Reject a booking (provider only)
   */
  rejectBooking(bookingId: string, reason: string): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.apiUrl}/${bookingId}/reject`, { reason });
  }
  
  /**
   * Get pending bookings for provider
   */
  getPendingBookings(): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.apiUrl}/pending`);
  }
}
