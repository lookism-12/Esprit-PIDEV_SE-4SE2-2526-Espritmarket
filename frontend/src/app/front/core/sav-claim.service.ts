import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

export interface SavClaim {
  id?: string;
  type: string; // 'SAV'
  message: string;
  rating?: number;
  reason: string;
  problemNature: string;
  desiredSolution: string; // refund, exchange, repair, support, other
  priority?: string;
  status?: string; // PENDING, INVESTIGATING, RESOLVED, REJECTED, ARCHIVED
  adminResponse?: string;
  readByAdmin?: boolean;
  imageUrls?: string[];
  cartItemId: string;
  targetType?: 'PRODUCT' | 'DELIVERY_AGENT';
  deliveryAgentId?: string;
  deliveryAgentName?: string;
  userId?: string;
  userName?: string;
  creationDate?: Date;
  lastUpdatedDate?: Date;
  resolvedDate?: Date;
  aiSimilarityScore?: number;
  aiDecision?: string;
  aiRecommendation?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SavClaimService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sav/claims`;

  /**
   * Create a new SAV claim
   */
  createSavClaim(claim: SavClaim, images?: File[]): Observable<any> {
    return this.http.post(`${this.apiUrl}`, this.toPayload(claim, images));
  }

  /**
   * Get all SAV claims for current user
   */
  getMySavClaims(): Observable<SavClaim[]> {
    return this.http.get<SavClaim[]>(`${this.apiUrl}/my`);
  }

  /**
   * Get a specific SAV claim by ID
   */
  getMySavClaimById(id: string): Observable<SavClaim> {
    return this.http.get<SavClaim>(`${this.apiUrl}/my/${id}`);
  }

  /**
   * Update a SAV claim
   */
  updateMySavClaim(id: string, claim: SavClaim, images?: File[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/my/${id}`, this.toPayload(claim, images));
  }

  private toPayload(claim: SavClaim, images?: File[]): SavClaim {
    return {
      ...claim,
      targetType: claim.targetType || 'PRODUCT',
      rating: claim.rating && claim.rating > 0 ? claim.rating : 1,
      imageUrls: images?.map(image => image.name) || claim.imageUrls || []
    };
  }

  /**
   * Delete a SAV claim
   */
  deleteMySavClaim(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/my/${id}`);
  }
}
