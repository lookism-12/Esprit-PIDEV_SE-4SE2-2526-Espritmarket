import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environment';

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  website?: string;
  linkedin?: string;
}

export interface ShopDto {
  id?: string;
  ownerId?: string;
  name: string;
  description: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  socialLinks?: SocialLinks;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  
  // Populated by backend
  ownerName?: string;
  ownerEmail?: string;
  productCount?: number;
  approvedProductCount?: number;
  averageRating?: number;
  totalReviews?: number;
}

export interface ShopCreateRequest {
  name: string;
  description: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  socialLinks?: SocialLinks;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProviderShopService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/provider/shop`;
  
  // Shop state management
  private shopSubject = new BehaviorSubject<ShopDto | null>(null);
  public shop$ = this.shopSubject.asObservable();
  
  private hasShopSubject = new BehaviorSubject<boolean>(false);
  public hasShop$ = this.hasShopSubject.asObservable();

  // Get my shop
  getMyShop(): Observable<ShopDto> {
    return this.http.get<ShopDto>(this.apiUrl).pipe(
      tap(shop => {
        this.shopSubject.next(shop);
        this.hasShopSubject.next(true);
      })
    );
  }

  // Create my shop
  createShop(shop: ShopCreateRequest): Observable<ShopDto> {
    return this.http.post<ShopDto>(this.apiUrl, shop).pipe(
      tap(createdShop => {
        this.shopSubject.next(createdShop);
        this.hasShopSubject.next(true);
      })
    );
  }

  // Update my shop
  updateShop(shop: Partial<ShopCreateRequest>): Observable<ShopDto> {
    return this.http.put<ShopDto>(this.apiUrl, shop).pipe(
      tap(updatedShop => {
        this.shopSubject.next(updatedShop);
      })
    );
  }

  // Delete my shop
  deleteShop(): Observable<void> {
    return this.http.delete<void>(this.apiUrl).pipe(
      tap(() => {
        this.shopSubject.next(null);
        this.hasShopSubject.next(false);
      })
    );
  }

  // Check if I have a shop
  checkHasShop(): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/exists`).pipe(
      tap(hasShop => {
        this.hasShopSubject.next(hasShop);
        if (!hasShop) {
          this.shopSubject.next(null);
        }
      })
    );
  }

  // Get current shop from state
  getCurrentShop(): ShopDto | null {
    return this.shopSubject.value;
  }

  // Check if user has shop from state
  hasShop(): boolean {
    return this.hasShopSubject.value;
  }

  // Clear shop state (for logout)
  clearShopState(): void {
    this.shopSubject.next(null);
    this.hasShopSubject.next(false);
  }
}