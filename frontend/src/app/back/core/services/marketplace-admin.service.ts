import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environment';

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface CategoryDto {
  id: string;
  name: string;
  productIds?: string[];
}

export interface ProductAdminDto {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock?: number;
  status?: string;
  category?: string;
  categoryIds?: string[];
  imageUrl?: string;
  images?: { url: string; altText?: string }[];
  shopId?: string;
  isNegotiable?: boolean;
  condition?: string;
}

export interface ServiceAdminDto {
  id: string;
  name: string;
  description?: string;
  price: number;
  shopId?: string;
  categoryId?: string;
}

export interface FavorisDto {
  id: string;
  userId: string;
  productId?: string;
  serviceId?: string;
  createdAt?: string;
}

export interface ProductFavoriteStats {
  productId: string;
  productName: string;
  favoriteCount: number;
  userIds: string[];
}

export interface ServiceFavoriteStats {
  serviceId: string;
  serviceName: string;
  favoriteCount: number;
  userIds: string[];
}

export interface ShopAdminDto {
  id: string;
  ownerId?: string;
  name?: string;
  description?: string;
  ownerName?: string;
  productCount?: number;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class MarketplaceAdminService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  isLoading = signal(false);
  error = signal<string | null>(null);

  // ── Categories ──────────────────────────────────────────────────────────────

  getCategories(): Observable<CategoryDto[]> {
    return this.http.get<CategoryDto[]>(`${this.base}/categories`);
  }

  createCategory(name: string): Observable<CategoryDto> {
    return this.http.post<CategoryDto>(`${this.base}/categories`, { name });
  }

  updateCategory(id: string, name: string): Observable<CategoryDto> {
    return this.http.put<CategoryDto>(`${this.base}/categories/${id}`, { name });
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/categories/${id}`);
  }

  // ── Products ────────────────────────────────────────────────────────────────

  getProductsAdmin(): Observable<ProductAdminDto[]> {
    const url = `${this.base}/products/all`;
    console.log('📡 GET', url);
    return this.http.get<ProductAdminDto[]>(url).pipe(
      tap(data => {
        console.log('✅ Received products:', data.length);
        console.log('📦 Full response:', JSON.stringify(data, null, 2));
      }),
      catchError(err => {
        console.error('❌ Failed to load products:', err);
        console.error('❌ Error details:', {
          status: err.status,
          statusText: err.statusText,
          message: err.error?.message,
          url: url
        });
        return throwError(() => err);
      })
    );
  }

  getMyProducts(): Observable<ProductAdminDto[]> {
    const url = `${this.base}/products/mine`;
    console.log('📡 GET', url, '(Seller products)');
    return this.http.get<ProductAdminDto[]>(url).pipe(
      tap(data => {
        console.log('✅ Received seller products:', data.length);
        console.log('📦 Seller products:', data);
      }),
      catchError(err => {
        console.error('❌ Failed to load seller products:', err);
        return throwError(() => err);
      })
    );
  }

  getProductsByShop(shopId: string): Observable<ProductAdminDto[]> {
    const url = `${this.base}/products/shop/${shopId}`;
    console.log('📡 GET', url, '(Products by shop)');
    return this.http.get<ProductAdminDto[]>(url).pipe(
      tap(data => {
        console.log('✅ Received shop products:', data.length);
        console.log('📦 Shop products:', data);
      }),
      catchError(err => {
        console.error('❌ Failed to load shop products:', err);
        return throwError(() => err);
      })
    );
  }

  createProduct(payload: Partial<ProductAdminDto>): Observable<ProductAdminDto> {
    console.log('📡 POST /api/products', payload);
    return this.http.post<ProductAdminDto>(`${this.base}/products`, payload).pipe(
      tap(data => console.log('✅ Product created:', data)),
      catchError(err => {
        console.error('❌ Failed to create product:', err);
        return throwError(() => err);
      })
    );
  }

  updateProduct(id: string, payload: Partial<ProductAdminDto>): Observable<ProductAdminDto> {
    console.log('📡 PUT /api/products/' + id, payload);
    return this.http.put<ProductAdminDto>(`${this.base}/products/${id}`, payload).pipe(
      tap(data => console.log('✅ Product updated:', data)),
      catchError(err => {
        console.error('❌ Failed to update product:', err);
        return throwError(() => err);
      })
    );
  }

  deleteProduct(id: string): Observable<void> {
    console.log('📡 DELETE /api/products/' + id);
    return this.http.delete<void>(`${this.base}/products/${id}`).pipe(
      tap(() => console.log('✅ Product deleted')),
      catchError(err => {
        console.error('❌ Failed to delete product:', err);
        return throwError(() => err);
      })
    );
  }

  approveProduct(id: string): Observable<ProductAdminDto> {
    console.log('📡 PATCH /api/products/' + id + '/approve');
    return this.http.patch<ProductAdminDto>(`${this.base}/products/${id}/approve`, {}).pipe(
      tap(data => console.log('✅ Product approved:', data)),
      catchError(err => {
        console.error('❌ Failed to approve product:', err);
        return throwError(() => err);
      })
    );
  }

  rejectProduct(id: string): Observable<ProductAdminDto> {
    console.log('📡 PATCH /api/products/' + id + '/reject');
    return this.http.patch<ProductAdminDto>(`${this.base}/products/${id}/reject`, {}).pipe(
      tap(data => console.log('✅ Product rejected:', data)),
      catchError(err => {
        console.error('❌ Failed to reject product:', err);
        return throwError(() => err);
      })
    );
  }

  // ── Services ────────────────────────────────────────────────────────────────

  getServices(): Observable<ServiceAdminDto[]> {
    return this.http.get<ServiceAdminDto[]>(`${this.base}/services`);
  }

  createService(payload: Partial<ServiceAdminDto>): Observable<ServiceAdminDto> {
    return this.http.post<ServiceAdminDto>(`${this.base}/services`, payload);
  }

  updateService(id: string, payload: Partial<ServiceAdminDto>): Observable<ServiceAdminDto> {
    return this.http.put<ServiceAdminDto>(`${this.base}/services/${id}`, payload);
  }

  deleteService(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/services/${id}`);
  }

  // ── Favoris ─────────────────────────────────────────────────────────────────

  getFavoris(): Observable<FavorisDto[]> {
    return this.http.get<FavorisDto[]>(`${this.base}/favoris`);
  }

  deleteFavoris(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/favoris/${id}`);
  }

  // New methods for user favorites
  toggleProductFavorite(productId: string): Observable<FavorisDto | null> {
    console.log('📡 POST /api/favoris/toggle/product/' + productId);
    return this.http.post<FavorisDto | null>(`${this.base}/favoris/toggle/product/${productId}`, {}).pipe(
      tap(data => console.log('✅ Favorite toggled:', data)),
      catchError(err => {
        console.error('❌ Failed to toggle favorite:', err);
        return throwError(() => err);
      })
    );
  }

  toggleServiceFavorite(serviceId: string): Observable<FavorisDto | null> {
    console.log('📡 POST /api/favoris/toggle/service/' + serviceId);
    return this.http.post<FavorisDto | null>(`${this.base}/favoris/toggle/service/${serviceId}`, {}).pipe(
      tap(data => console.log('✅ Favorite toggled:', data)),
      catchError(err => {
        console.error('❌ Failed to toggle favorite:', err);
        return throwError(() => err);
      })
    );
  }

  getMyFavorites(): Observable<FavorisDto[]> {
    return this.http.get<FavorisDto[]>(`${this.base}/favoris/my`).pipe(
      tap(data => console.log('✅ My favorites loaded:', data.length)),
      catchError(err => {
        console.error('❌ Failed to load my favorites:', err);
        return throwError(() => err);
      })
    );
  }

  isProductFavorited(productId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.base}/favoris/check/product/${productId}`);
  }

  isServiceFavorited(serviceId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.base}/favoris/check/service/${serviceId}`);
  }

  // ── Shops ───────────────────────────────────────────────────────────────────

  getShops(): Observable<ShopAdminDto[]> {
    return this.http.get<ShopAdminDto[]>(`${this.base}/shops`);
  }

  getMyShop(): Observable<ShopAdminDto> {
    return this.http.get<ShopAdminDto>(`${this.base}/shops/me`);
  }
}
