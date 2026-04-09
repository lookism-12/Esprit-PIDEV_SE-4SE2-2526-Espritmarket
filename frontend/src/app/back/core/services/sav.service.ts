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

  // ── Deliveries ─────────────────────────────────────────────────────────────

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
}
