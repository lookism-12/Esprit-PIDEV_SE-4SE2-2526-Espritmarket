import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap, finalize } from 'rxjs/operators';
import { environment } from '../../../environment';
import { Product, MarketplaceProductRequest } from '../../front/models/product';

export interface ProductFilter {
  category?: string;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/products`;

  // Reactive state
  private productsSubject = new BehaviorSubject<Product[]>([]);
  readonly products$ = this.productsSubject.asObservable();
  
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor() {}

  /**
   * Get all products with optional filtering
   */
  loadProducts(filter?: ProductFilter): void {
    this.getAll(filter).subscribe();
  }

  getAll(filter?: ProductFilter): Observable<Product[]> {
    let params = new HttpParams();
    if (filter?.category) params = params.set('category', filter.category);
    if (filter?.search) params = params.set('search', filter.search);

    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<Product[]>(this.apiUrl, { params }).pipe(
      tap(products => {
        console.log('📦 Loaded products:', products);
        this.productsSubject.next(products);
      }),
      catchError(err => this.handleError(err, 'Failed to load products')),
      finalize(() => this.isLoading.set(false))
    );
  }

  /**
   * Get all products including pending/rejected (Admin only)
   */
  getAllAdmin(): Observable<Product[]> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<Product[]>(`${this.apiUrl}/all`).pipe(
      tap(products => {
        console.log('📦 Loaded admin products:', products);
        this.productsSubject.next(products);
      }),
      catchError(err => this.handleError(err, 'Failed to load admin products')),
      finalize(() => this.isLoading.set(false))
    );
  }

  /**
   * Seller: all products for the authenticated seller's shop (any status).
   */
  getMine(): Observable<Product[]> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<Product[]>(`${this.apiUrl}/mine`).pipe(
      tap(products => {
        console.log('📦 Loaded seller products:', products);
        this.productsSubject.next(products);
      }),
      catchError(err => this.handleError(err, 'Failed to load your products')),
      finalize(() => this.isLoading.set(false))
    );
  }

  /**
   * Get a single product by ID
   */
  getById(id: string): Observable<Product> {
    this.isLoading.set(true);
    return this.http.get<Product>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => this.handleError(err, 'Failed to load product details')),
      finalize(() => this.isLoading.set(false))
    );
  }

  /**
   * Create a new product
   */
  createProduct(data: MarketplaceProductRequest): Observable<Product> {
    this.isLoading.set(true);
    return this.http.post<Product>(this.apiUrl, data).pipe(
      tap(() => this.loadProducts()),
      catchError(err => this.handleError(err, 'Failed to create product')),
      finalize(() => this.isLoading.set(false))
    );
  }

  /**
   * Update an existing product
   */
  updateProduct(id: string, data: Partial<MarketplaceProductRequest>): Observable<Product> {
    this.isLoading.set(true);
    return this.http.put<Product>(`${this.apiUrl}/${id}`, data).pipe(
      tap(() => this.loadProducts()),
      catchError(err => this.handleError(err, 'Failed to update product')),
      finalize(() => this.isLoading.set(false))
    );
  }

  /**
   * Delete a product
   */
  deleteProduct(id: string): Observable<void> {
    this.isLoading.set(true);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loadProducts()),
      catchError(err => this.handleError(err, 'Failed to delete product')),
      finalize(() => this.isLoading.set(false))
    );
  }

  /**
   * Approve a product (Admin only)
   */
  approveProduct(id: string): Observable<Product> {
    this.isLoading.set(true);
    return this.http.patch<Product>(`${this.apiUrl}/${id}/approve`, {}).pipe(
      tap(() => this.loadProducts()),
      catchError(err => this.handleError(err, 'Failed to approve product')),
      finalize(() => this.isLoading.set(false))
    );
  }

  /**
   * Reject a product (Admin only)
   */
  rejectProduct(id: string): Observable<Product> {
    this.isLoading.set(true);
    return this.http.patch<Product>(`${this.apiUrl}/${id}/reject`, {}).pipe(
      tap(() => this.loadProducts()),
      catchError(err => this.handleError(err, 'Failed to reject product')),
      finalize(() => this.isLoading.set(false))
    );
  }

  /**
   * Helper to refresh the list after mutations
   */
  private refreshList(): void {
    this.loadProducts();
  }

  /**
   * Centralized error handler
   */
  private handleError(error: any, message: string): Observable<never> {
    console.error(error);
    const errorMessage = error.error?.message || message;
    this.error.set(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
