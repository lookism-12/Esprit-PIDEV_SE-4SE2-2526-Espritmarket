import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Product } from '../models/product';
import { environment } from '../../../environment';

@Injectable({
  providedIn: 'root'
})
export class MarketService {
  private readonly apiUrl = `${environment.apiUrl}/services`;

  constructor(private http: HttpClient) {}

  /**
   * Get current user's services (PROVIDER only)
   */
  getMyServices(): Observable<Product[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my`).pipe(
      map((items) => items.map((i) => this.mapServiceToProduct(i)))
    );
  }

  /**
   * Map Service DTO to Frontend Product Interface for UI compatibility
   */
  private mapServiceToProduct(dto: any): Product {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description || '',
      price: dto.price,
      stock: 0, // Services don't have stock usually
      imageUrl: 'https://images.unsplash.com/photo-1454165833767-027ffea9e778?q=80&w=400', // Default service image
      category: 'Services',
      isNegotiable: true
    };
  }
}
