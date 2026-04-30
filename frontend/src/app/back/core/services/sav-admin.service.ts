import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environment';

export interface SavClaim {
  id?: string;
  type: string;
  message: string;
  rating?: number;
  reason: string;
  problemNature: string;
  desiredSolution: string;
  priority?: string;
  status?: string;
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
export class SavAdminService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/sav/claims`;

  /**
   * Get all SAV claims
   */
  getAllSavClaims(): Observable<SavClaim[]> {
    return this.http.get<SavClaim[]>(this.apiUrl);
  }

  /**
   * Get SAV claim by ID
   */
  getSavClaimById(id: string): Observable<SavClaim> {
    return this.http.get<SavClaim>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get SAV claims by status
   */
  getSavClaimsByStatus(status: string): Observable<SavClaim[]> {
    return this.http.get<SavClaim[]>(`${this.apiUrl}/status/${status}`);
  }

  /**
   * Get unread SAV claims
   */
  getUnreadSavClaims(): Observable<SavClaim[]> {
    return this.http.get<SavClaim[]>(`${this.apiUrl}/unread`);
  }

  /**
   * Update SAV claim status
   */
  updateClaimStatus(id: string, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/status`, null, {
      params: { status }
    });
  }

  /**
   * Send admin response
   */
  sendAdminResponse(id: string, response: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/response`, null, {
      params: { response }
    });
  }

  /**
   * Update AI verification
   */
  updateAiVerification(id: string, similarityScore: number, decision: string, recommendation?: string): Observable<any> {
    const params: any = {
      similarityScore: similarityScore.toString(),
      decision
    };
    if (recommendation) params.recommendation = recommendation;
    
    return this.http.put(`${this.apiUrl}/${id}/ai-verification`, null, { params });
  }

  /**
   * Delete SAV claim
   */
  deleteClaim(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /**
   * Get AI verification cases
   */
  getAiVerificationCases(): Observable<SavClaim[]> {
    return this.http.get<SavClaim[]>(`${this.apiUrl}/ai-verification/cases`);
  }
}
