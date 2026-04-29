import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environment';
import {
  SavFeedback,
  SavFeedbackRequest,
  Delivery,
  DeliveryRequest,
  DeliveryStatus
} from '../models/sav.models';

@Injectable({ providedIn: 'root' })
export class SavService {
  private readonly feedbackUrl = `${environment.apiUrl}/sav-feedbacks`;
  private readonly deliveryUrl = `${environment.apiUrl}/deliveries`;

  constructor(private http: HttpClient) {}

  // ── Feedbacks ──────────────────────────────────────────────────────────────

  createFeedback(request: SavFeedbackRequest): Observable<SavFeedback> {
    return this.http.post<SavFeedback>(this.feedbackUrl, request);
  }

  getAllFeedbacks(): Observable<SavFeedback[]> {
    return this.http.get<SavFeedback[]>(this.feedbackUrl);
  }

  getFeedbackById(id: string): Observable<SavFeedback> {
    return this.http.get<SavFeedback>(`${this.feedbackUrl}/${id}`);
  }

  getFeedbacksByCartItem(cartItemId: string): Observable<SavFeedback[]> {
    return this.http.get<SavFeedback[]>(`${this.feedbackUrl}/cart-item/${cartItemId}`);
  }

  getFeedbacksByProductId(productId: string): Observable<SavFeedback[]> {
    return this.http.get<SavFeedback[]>(`${this.feedbackUrl}/product/${productId}`);
  }

  getFeedbacksByType(type: string): Observable<SavFeedback[]> {
    return this.http.get<SavFeedback[]>(`${this.feedbackUrl}/type/${type}`);
  }

  updateFeedback(id: string, request: SavFeedbackRequest): Observable<SavFeedback> {
    return this.http.put<SavFeedback>(`${this.feedbackUrl}/${id}`, request);
  }

  updateFeedbackStatus(id: string, status: string): Observable<SavFeedback> {
    return this.http.patch<SavFeedback>(`${this.feedbackUrl}/${id}/status`, null, {
      params: { status }
    });
  }

  updateAdminResponse(id: string, response: string): Observable<SavFeedback> {
    return this.http.patch<SavFeedback>(`${this.feedbackUrl}/${id}/admin-response`, null, {
      params: { response }
    });
  }

  deleteFeedback(id: string): Observable<void> {
    return this.http.delete<void>(`${this.feedbackUrl}/${id}`);
  }

  // ── Deliveries — Base CRUD ──────────────────────────────────────────────────

  createDelivery(request: DeliveryRequest): Observable<Delivery> {
    return this.http.post<Delivery>(this.deliveryUrl, request);
  }

  getAllDeliveries(): Observable<Delivery[]> {
    return this.http.get<Delivery[]>(this.deliveryUrl);
  }

  getDeliveryById(id: string): Observable<Delivery> {
    return this.http.get<Delivery>(`${this.deliveryUrl}/${id}`);
  }

  getDeliveriesByUser(userId: string): Observable<Delivery[]> {
    return this.http.get<Delivery[]>(`${this.deliveryUrl}/user/${userId}`);
  }

  getDeliveriesByCart(cartId: string): Observable<Delivery[]> {
    return this.http.get<Delivery[]>(`${this.deliveryUrl}/cart/${cartId}`);
  }

  getDeliveriesByStatus(status: DeliveryStatus): Observable<Delivery[]> {
    return this.http.get<Delivery[]>(`${this.deliveryUrl}/status/${status}`);
  }

  updateDelivery(id: string, request: DeliveryRequest): Observable<Delivery> {
    return this.http.put<Delivery>(`${this.deliveryUrl}/${id}`, request);
  }

  updateDeliveryStatus(id: string, status: DeliveryStatus): Observable<Delivery> {
    return this.http.patch<Delivery>(`${this.deliveryUrl}/${id}/status`, null, {
      params: { status }
    });
  }

  deleteDelivery(id: string): Observable<void> {
    return this.http.delete<void>(`${this.deliveryUrl}/${id}`);
  }

  // ── Deliveries — Driver Workflow (FR-DEL5) ─────────────────────────────────

  /** Admin assigns a driver — sends notification to driver automatically */
  assignDriver(deliveryId: string, driverId: string): Observable<Delivery> {
    return this.http.patch<Delivery>(`${this.deliveryUrl}/${deliveryId}/assign`, null, {
      params: { driverId }
    });
  }

  /** Driver accepts or declines a delivery assignment */
  respondToDelivery(deliveryId: string, driverId: string, accepted: boolean, declineReason: string = ''): Observable<Delivery> {
    return this.http.patch<Delivery>(`${this.deliveryUrl}/${deliveryId}/respond`, null, {
      params: { driverId, accepted: String(accepted), declineReason }
    });
  }

  /** Driver marks delivery as completed */
  markAsDelivered(deliveryId: string, driverId: string): Observable<Delivery> {
    return this.http.patch<Delivery>(`${this.deliveryUrl}/${deliveryId}/mark-delivered`, null, {
      params: { driverId }
    });
  }

  /** Driver marks delivery as returned (failed delivery) */
  markAsReturned(deliveryId: string, driverId: string, reason: string = 'Delivery failed'): Observable<Delivery> {
    return this.http.patch<Delivery>(`${this.deliveryUrl}/${deliveryId}/mark-returned`, null, {
      params: { driverId, reason }
    });
  }

  /** Get deliveries pending response for a specific driver */
  getPendingForDriver(driverId: string): Observable<Delivery[]> {
    return this.http.get<Delivery[]>(`${this.deliveryUrl}/pending-driver/${driverId}`);
  }
}
