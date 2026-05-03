import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap } from 'rxjs';
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
  /** Keyword-based urgency score computed server-side. Higher = more urgent. */
  priorityScore?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SavClaimService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sav/claims`;
  private uploadUrl = `${environment.apiUrl}/uploads/temp-images`;

  /**
   * Upload image files to Cloudinary and return their secure URLs.
   * If no files are provided, returns an empty array immediately.
   */
  uploadImages(files: File[]): Observable<string[]> {
    if (!files || files.length === 0) return of([]);
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    return this.http.post<{ urls: string[] }>(this.uploadUrl, formData).pipe(
      switchMap(res => of(res.urls ?? []))
    );
  }

  /**
   * Create a new SAV claim.
   * Pass already-resolved Cloudinary URLs in imageUrls — do NOT pass raw File objects here.
   */
  createSavClaim(claim: SavClaim): Observable<any> {
    return this.http.post(`${this.apiUrl}`, this.toPayload(claim));
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
   * Update a SAV claim.
   * Pass already-resolved Cloudinary URLs in imageUrls.
   */
  updateMySavClaim(id: string, claim: SavClaim): Observable<any> {
    return this.http.put(`${this.apiUrl}/my/${id}`, this.toPayload(claim));
  }

  private toPayload(claim: SavClaim): SavClaim {
    return {
      ...claim,
      targetType: claim.targetType || 'PRODUCT',
      rating: claim.rating && claim.rating > 0 ? claim.rating : 1,
      imageUrls: claim.imageUrls ?? []
    };
  }

  /**
   * Delete a SAV claim
   */
  deleteMySavClaim(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/my/${id}`);
  }
}
