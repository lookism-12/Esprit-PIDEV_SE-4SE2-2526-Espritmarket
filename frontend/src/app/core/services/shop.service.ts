import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

export interface ShopDto {
  id: string;
  name: string;
  description: string;
  address?: string;
  phone?: string;
  logo?: string;
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  productCount?: number;
  createdAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}`;

  // Get all shops
  getAll(): Observable<ShopDto[]> {
    return this.http.get<ShopDto[]>(`${this.apiUrl}/api/shops`);
  }

  // Get shop by ID
  getById(id: string): Observable<ShopDto> {
    return this.http.get<ShopDto>(`${this.apiUrl}/api/shops/${id}`);
  }

  // Get my shop (for authenticated sellers)
  getMy(): Observable<ShopDto> {
    return this.http.get<ShopDto>(`${this.apiUrl}/api/shops/me`);
  }

  // Create new shop
  create(shop: Partial<ShopDto>): Observable<ShopDto> {
    return this.http.post<ShopDto>(`${this.apiUrl}/api/shops`, shop);
  }

  // Update shop
  update(id: string, shop: Partial<ShopDto>): Observable<ShopDto> {
    return this.http.put<ShopDto>(`${this.apiUrl}/api/shops/${id}`, shop);
  }

  // Delete shop
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/shops/${id}`);
  }
}