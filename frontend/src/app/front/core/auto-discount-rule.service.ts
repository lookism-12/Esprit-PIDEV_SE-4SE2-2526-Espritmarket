import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

export interface AutoDiscountRuleRequest {
  ruleName: string;
  triggerType: 'CART_TOTAL_THRESHOLD' | 'QUANTITY_THRESHOLD' | 'GROUPED_PRODUCT_OFFER';
  thresholdValue: number;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maximumDiscount?: number;
  priority?: number;
  isActive: boolean;
  validFrom?: string;
  validUntil?: string;
  description?: string;
}

export interface AutoDiscountRuleResponse {
  id: string;
  providerId: string;
  shopId: string;
  ruleName: string;
  triggerType: 'CART_TOTAL_THRESHOLD' | 'QUANTITY_THRESHOLD' | 'GROUPED_PRODUCT_OFFER';
  thresholdValue: number;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maximumDiscount?: number;
  priority: number;
  isActive: boolean;
  validFrom?: string;
  validUntil?: string;
  description?: string;
  triggerDescription: string;
  discountDescription: string;
  isCurrentlyValid: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AutoDiscountRuleService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/provider/discount-rules`;

  /**
   * Get all discount rules for the authenticated provider
   */
  getMyRules(): Observable<AutoDiscountRuleResponse[]> {
    return this.http.get<AutoDiscountRuleResponse[]>(this.apiUrl);
  }

  /**
   * Get a specific rule by ID
   */
  getRuleById(id: string): Observable<AutoDiscountRuleResponse> {
    return this.http.get<AutoDiscountRuleResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new discount rule
   */
  createRule(request: AutoDiscountRuleRequest): Observable<AutoDiscountRuleResponse> {
    return this.http.post<AutoDiscountRuleResponse>(this.apiUrl, request);
  }

  /**
   * Update an existing discount rule
   */
  updateRule(id: string, request: AutoDiscountRuleRequest): Observable<AutoDiscountRuleResponse> {
    return this.http.put<AutoDiscountRuleResponse>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Toggle rule active status
   */
  toggleRuleStatus(id: string, isActive: boolean): Observable<AutoDiscountRuleResponse> {
    const params = new HttpParams().set('isActive', isActive.toString());
    return this.http.patch<AutoDiscountRuleResponse>(`${this.apiUrl}/${id}/status`, null, { params });
  }

  /**
   * Delete a discount rule
   */
  deleteRule(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
