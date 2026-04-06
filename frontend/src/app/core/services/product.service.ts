import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environment';
import { Product, ProductStatus } from '../../front/models/product';

export interface ProductDto {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: ProductStatus;
  shopId: string;
  categoryIds: string[];
  category?: string; // ✅ Added for compatibility
  images: Array<{ url: string; altText?: string }>;
  condition?: string;
  isNegotiable?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}`;

  // Reactive state for components that need it
  private _products$ = new BehaviorSubject<ProductDto[]>([]);
  private _isLoading = signal(false);

  // Public observables and signals
  products$ = this._products$.asObservable();
  isLoading = this._isLoading.asReadonly();

  // Get all approved products (for marketplace)
  getAll(): Observable<ProductDto[]> {
    return this.http.get<ProductDto[]>(`${this.apiUrl}/products`);
  }

  // Get all products (admin only)
  getAllAdmin(): Observable<ProductDto[]> {
    return this.http.get<ProductDto[]>(`${this.apiUrl}/products/all`);
  }

  // Get product by ID
  getById(id: string): Observable<ProductDto> {
    return this.http.get<ProductDto>(`${this.apiUrl}/products/${id}`);
  }

  // Create new product
  create(product: Partial<ProductDto>): Observable<ProductDto> {
    return this.http.post<ProductDto>(`${this.apiUrl}/products`, product);
  }

  // Update product
  update(id: string, product: Partial<ProductDto>): Observable<ProductDto> {
    return this.http.put<ProductDto>(`${this.apiUrl}/products/${id}`, product);
  }

  // Delete product
  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/products/${id}`);
  }

  // Approve product (admin only)
  approveProduct(id: string): Observable<ProductDto> {
    return this.http.patch<ProductDto>(`${this.apiUrl}/products/${id}/approve`, {});
  }

  // Reject product (admin only)
  rejectProduct(id: string): Observable<ProductDto> {
    return this.http.patch<ProductDto>(`${this.apiUrl}/products/${id}/reject`, {});
  }

  // Get products by shop
  getByShop(shopId: string): Observable<ProductDto[]> {
    return this.http.get<ProductDto[]>(`${this.apiUrl}/products/shop/${shopId}`);
  }

  // Search products
  search(query: string): Observable<ProductDto[]> {
    return this.http.get<ProductDto[]>(`${this.apiUrl}/products/search?q=${encodeURIComponent(query)}`);
  }

  // Load products and update reactive state
  loadProducts(): void {
    this._isLoading.set(true);
    this.getAll().subscribe({
      next: (products) => {
        this._products$.next(products);
        this._isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load products:', err);
        this._isLoading.set(false);
      }
    });
  }
}