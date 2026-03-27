import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environment';
import { Shop } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  private readonly apiUrl = `${environment.apiUrl}/shops`;

  // State
  readonly myShop = signal<Shop | null>(null);
  readonly isLoading = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  private mapShop(s: any): Shop {
    return {
      id: s.id,
      userId: s.ownerId,
      name: s.name,
      slug: s.name.toLowerCase().replace(/\s+/g, '-'),
      description: s.description,
      logo: s.logo || 'assets/images/default-shop-logo.png',
      banner: s.banner || 'assets/images/default-shop-banner.jpg',
      rating: s.rating || 0,
      reviewsCount: s.reviewsCount || 0,
      productCount: 0,
      totalSales: 0,
      isVerified: false,
      joinedAt: new Date(s.joinedAt)
    };
  }

  getMyShop(): Observable<Shop> {
    this.isLoading.set(true);
    return this.http.get<any>(`${this.apiUrl}/my`).pipe(
      map(s => this.mapShop(s)),
      tap(shop => {
        this.myShop.set(shop);
        this.isLoading.set(false);
      })
    );
  }

  updateShop(id: string, data: any): Observable<Shop> {
    this.isLoading.set(true);
    return this.http.put<any>(`${this.apiUrl}/${id}`, data).pipe(
      map(s => this.mapShop(s)),
      tap(shop => {
        this.myShop.set(shop);
        this.isLoading.set(false);
      })
    );
  }
}
