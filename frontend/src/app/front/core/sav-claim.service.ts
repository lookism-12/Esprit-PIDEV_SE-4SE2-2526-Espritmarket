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
  userId?: string;
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
    const formData = new FormData();
    
    // Add claim data
    formData.append('type', claim.type);
    formData.append('message', claim.message);
    formData.append('reason', claim.reason);
    formData.append('problemNature', claim.problemNature);
    formData.append('desiredSolution', claim.desiredSolution);
    formData.append('cartItemId', claim.cartItemId);
    
    if (claim.rating) formData.append('rating', claim.rating.toString());
    if (claim.priority) formData.append('priority', claim.priority);
    
    // Add images
    if (images && images.length > 0) {
      images.forEach((image, index) => {
        formData.append(`images`, image, image.name);
      });
    }
    
    return this.http.post(`${this.apiUrl}`, formData);
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
    const formData = new FormData();
    
    formData.append('type', claim.type);
    formData.append('message', claim.message);
    formData.append('reason', claim.reason);
    formData.append('problemNature', claim.problemNature);
    formData.append('desiredSolution', claim.desiredSolution);
    formData.append('cartItemId', claim.cartItemId);
    
    if (claim.rating) formData.append('rating', claim.rating.toString());
    if (claim.priority) formData.append('priority', claim.priority);
    
    if (images && images.length > 0) {
      images.forEach((image) => {
        formData.append(`images`, image, image.name);
      });
    }
    
    return this.http.put(`${this.apiUrl}/my/${id}`, formData);
  }

  /**
   * Delete a SAV claim
   */
  deleteMySavClaim(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/my/${id}`);
  }
}