import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

export interface FavorisResponse {
  id: string;
  userId: string;
  productId?: string;
  serviceId?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class FavorisService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/favoris`;

  // Toggle product favorite (add if not exists, remove if exists)
  toggleProductFavorite(productId: string): Observable<FavorisResponse | null> {
    return this.http.post<FavorisResponse | null>(`${this.apiUrl}/toggle/product/${productId}`, {});
  }

  // Toggle service favorite (add if not exists, remove if exists)
  toggleServiceFavorite(serviceId: string): Observable<FavorisResponse | null> {
    return this.http.post<FavorisResponse | null>(`${this.apiUrl}/toggle/service/${serviceId}`, {});
  }

  // Get all favorites for current user
  getMyFavorites(): Observable<FavorisResponse[]> {
    return this.http.get<FavorisResponse[]>(`${this.apiUrl}/my`);
  }

  // Check if product is favorited
  isProductFavorited(productId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/check/product/${productId}`);
  }

  // Check if service is favorited
  isServiceFavorited(serviceId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/check/service/${serviceId}`);
  }
}
