import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environment';

// DTOs for marketplace admin
export interface CategoryDto {
  id: string;
  name: string;
  description?: string;
  productIds?: string[]; // ✅ Added for product count display
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductAdminDto {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  shopId: string;
  shopName?: string;
  categoryIds: string[];
  category?: string; // ✅ Added for display
  images: Array<{ url: string; altText?: string }>;
  imageUrl?: string; // ✅ Added for compatibility
  createdAt: Date;
  updatedAt?: Date;
}

export interface ServiceAdminDto {
  id: string;
  name: string;
  description: string;
  price: number;
  shopId: string;
  shopName?: string;
  createdByUserId?: string;
  categoryIds: string[];
  categoryId?: string; // ✅ Added for compatibility
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  updatedAt?: Date;
  durationMinutes?: number;
  availability?: {
    workingDays: string[];
    timeRanges: Array<{
      startTime: string;
      endTime: string;
      availableMode?: 'ONLINE' | 'IN_PERSON' | 'BOTH';
    }>;
    breaks: Array<{
      startTime: string;
      endTime: string;
    }>;
  };
}

export interface ShopAdminDto {
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
  updatedAt?: Date;
}

export interface FavorisAdminDto {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  productId?: string;
  productName?: string;
  serviceId?: string;
  serviceName?: string;
  createdAt: Date;
}

// Alias for compatibility
export interface FavorisDto extends FavorisAdminDto {}

@Injectable({
  providedIn: 'root'
})
export class MarketplaceAdminService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}`;

  // Categories
  getCategories(): Observable<CategoryDto[]> {
    return this.http.get<CategoryDto[]>(`${this.apiUrl}/categories`);
  }

  createCategory(name: string): Observable<CategoryDto> {
    return this.http.post<CategoryDto>(`${this.apiUrl}/categories`, { name });
  }

  updateCategory(id: string, name: string): Observable<CategoryDto> {
    return this.http.put<CategoryDto>(`${this.apiUrl}/categories/${id}`, { name });
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/${id}`);
  }

  // Products Admin
  getProductsAdmin(): Observable<ProductAdminDto[]> {
    return this.http.get<ProductAdminDto[]>(`${this.apiUrl}/products/all`);
  }

  getProductsByShop(shopId: string): Observable<ProductAdminDto[]> {
    return this.http.get<ProductAdminDto[]>(`${this.apiUrl}/products/shop/${shopId}`);
  }

  getMyProducts(): Observable<ProductAdminDto[]> {
    return this.http.get<ProductAdminDto[]>(`${this.apiUrl}/products/mine`);
  }

  createProduct(product: Partial<ProductAdminDto>): Observable<ProductAdminDto> {
    return this.http.post<ProductAdminDto>(`${this.apiUrl}/products`, product);
  }

  updateProduct(id: string, product: Partial<ProductAdminDto>): Observable<ProductAdminDto> {
    return this.http.put<ProductAdminDto>(`${this.apiUrl}/products/${id}`, product);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/products/${id}`);
  }

  approveProduct(id: string): Observable<ProductAdminDto> {
    return this.http.patch<ProductAdminDto>(`${this.apiUrl}/products/${id}/approve`, {});
  }

  rejectProduct(id: string): Observable<ProductAdminDto> {
    return this.http.patch<ProductAdminDto>(`${this.apiUrl}/products/${id}/reject`, {});
  }

  // Services Admin
  getServices(): Observable<ServiceAdminDto[]> {
    return this.http.get<ServiceAdminDto[]>(`${this.apiUrl}/services`);
  }

  createService(service: Partial<ServiceAdminDto>): Observable<ServiceAdminDto> {
    return this.http.post<ServiceAdminDto>(`${this.apiUrl}/services`, service);
  }

  updateService(id: string, service: Partial<ServiceAdminDto>): Observable<ServiceAdminDto> {
    return this.http.put<ServiceAdminDto>(`${this.apiUrl}/services/${id}`, service);
  }

  deleteService(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/services/${id}`);
  }

  // Shops Admin
  getShops(): Observable<ShopAdminDto[]> {
    return this.http.get<ShopAdminDto[]>(`${this.apiUrl}/shops`);
  }

  getMyShop(): Observable<ShopAdminDto> {
    return this.http.get<ShopAdminDto>(`${this.apiUrl}/shops/me`);
  }

  createShop(shop: Partial<ShopAdminDto>): Observable<ShopAdminDto> {
    return this.http.post<ShopAdminDto>(`${this.apiUrl}/shops`, shop);
  }

  updateShop(id: string, shop: Partial<ShopAdminDto>): Observable<ShopAdminDto> {
    return this.http.put<ShopAdminDto>(`${this.apiUrl}/shops/${id}`, shop);
  }

  deleteShop(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/shops/${id}`);
  }

  // Favoris Admin
  getFavoris(): Observable<FavorisAdminDto[]> {
    return this.http.get<FavorisAdminDto[]>(`${this.apiUrl}/admin/favoris`);
  }

  deleteFavoris(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/favoris/${id}`);
  }
}
