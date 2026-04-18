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
  private apiUrl = `${environment.apiUrl}/shops`;  // ✅ Fixed: http://localhost:8090/api/shops

  // Get all shops
  getAll(): Observable<ShopDto[]> {
    return this.http.get<ShopDto[]>(this.apiUrl);
  }

  // Get shop by ID
  getById(id: string): Observable<ShopDto> {
    return this.http.get<ShopDto>(`${this.apiUrl}/${id}`);
  }

  // Get my shop (for authenticated sellers)
  getMy(): Observable<ShopDto> {
    return this.http.get<ShopDto>(`${this.apiUrl}/me`);
  }

  // Create new shop
  create(shop: Partial<ShopDto>): Observable<ShopDto> {
    return this.http.post<ShopDto>(this.apiUrl, shop);
  }

  // Update shop
  update(id: string, shop: Partial<ShopDto>): Observable<ShopDto> {
    return this.http.put<ShopDto>(`${this.apiUrl}/${id}`, shop);
  }

  // Delete shop
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}