import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

export interface EventPromotionRequest {
  holidayEnabled: boolean;
  holidayDiscountPercentage?: number;
  holidayMinOrderAmount?: number;
  holidayMaxDiscount?: number;
  birthdayEnabled: boolean;
  birthdayDiscountPercentage?: number;
  birthdayMinOrderAmount?: number;
  birthdayMaxDiscount?: number;
}

export interface EventPromotionResponse {
  id?: string;
  providerId: string;
  shopId?: string;
  holidayEnabled: boolean;
  holidayDiscountPercentage?: number;
  holidayMinOrderAmount?: number;
  holidayMaxDiscount?: number;
  holidayDescription: string;
  birthdayEnabled: boolean;
  birthdayDiscountPercentage?: number;
  birthdayMinOrderAmount?: number;
  birthdayMaxDiscount?: number;
  birthdayDescription: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EventPromotionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/provider/event-promotions`;

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Configure event promotions for provider's shop
   */
  configureEventPromotion(request: EventPromotionRequest): Observable<EventPromotionResponse> {
    return this.http.post<EventPromotionResponse>(
      `${this.apiUrl}/configure`,
      request,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get current event promotion configuration
   */
  getEventPromotion(): Observable<EventPromotionResponse> {
    return this.http.get<EventPromotionResponse>(
      this.apiUrl,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get event promotion by shop ID
   */
  getShopEventPromotion(shopId: string): Observable<EventPromotionResponse> {
    return this.http.get<EventPromotionResponse>(
      `${this.apiUrl}/shop/${shopId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Check if today is a holiday
   */
  isTodayHoliday(): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.apiUrl}/holiday-check`,
      { headers: this.getHeaders() }
    );
  }
}
