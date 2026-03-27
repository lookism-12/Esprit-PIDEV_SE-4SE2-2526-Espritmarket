import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap, catchError, throwError } from 'rxjs';
import { Product, StockStatus, ProductCondition } from '../models/product';
import { environment } from '../../../environment';

export interface ProductFilter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sellerId?: string;
  sortBy?: 'price' | 'rating' | 'date';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock?: number;
  shopId: string;
  categoryIds?: string[];
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl = `${environment.apiUrl}/products`;

  // Reactive state
  readonly products = signal<Product[]>([]);
  readonly selectedProduct = signal<Product | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor(private http: HttpClient) {}
 
  private mapProduct(p: any): Product {
    return {
      id: p.id || p.productId,
      name: p.name,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice,
      imageUrl: p.images && p.images.length > 0 ? p.images[0].url : 'assets/images/placeholder.jpg',
      images: p.images ? p.images.map((img: any) => (typeof img === 'string' ? img : img.url)) : [],
      category: p.categoryName || (p.categoryIds && p.categoryIds.length > 0 ? p.categoryIds[0] : 'General'),
      rating: p.rating || 0,
      reviewsCount: p.reviewsCount || 0,
      stock: p.stock || 0,
      stockStatus: (p.stock || 0) > 10 ? StockStatus.IN_STOCK : ((p.stock || 0) > 0 ? StockStatus.LOW_STOCK : StockStatus.OUT_OF_STOCK),
      condition: p.condition || ProductCondition.NEW,
      isNegotiable: p.isNegotiable || false,
      sellerId: p.shopId || 'unknown',
      sellerName: 'Store', // Fallback
    };
  }

  /**
   * Get all products with optional filtering
   */
  getAll(filter?: ProductFilter): Observable<Product[]> {
    let params = new HttpParams();
    if (filter?.category) params = params.set('category', filter.category);
    if (filter?.minPrice) params = params.set('minPrice', filter.minPrice.toString());
    if (filter?.maxPrice) params = params.set('maxPrice', filter.maxPrice.toString());
    if (filter?.search) params = params.set('search', filter.search);
    if (filter?.page) params = params.set('page', filter.page.toString());
    if (filter?.limit) params = params.set('limit', filter.limit.toString());

    this.isLoading.set(true);
    return this.http.get<any[]>(this.apiUrl, { params }).pipe(
      map(products => products.map(p => this.mapProduct(p))),
      tap(products => {
        this.products.set(products);
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.error.set('Failed to load products');
        this.isLoading.set(false);
        throw err;
      })
    );
  }

  /**
   * Get a single product by ID
   */
  getById(id: string): Observable<Product> {
    this.isLoading.set(true);
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(p => this.mapProduct(p)),
      tap(product => {
        this.selectedProduct.set(product);
        this.isLoading.set(false);
      })
    );
  }

  /**
   * Create a new product (PROVIDER only)
   */
  create(data: any): Observable<Product> {
    this.isLoading.set(true);
    return this.http.post<any>(this.apiUrl, data).pipe(
      map(p => this.mapProduct(p)),
      tap(() => this.isLoading.set(false))
    );
  }

  /**
   * Update an existing product (PROVIDER/owner only)
   */
  update(id: string, data: any): Observable<Product> {
    this.isLoading.set(true);
    return this.http.put<any>(`${this.apiUrl}/${id}`, data).pipe(
      map(p => this.mapProduct(p)),
      tap(() => this.isLoading.set(false))
    );
  }

  /**
   * Delete a product (PROVIDER/owner only)
   */
  delete(id: string): Observable<void> {
    this.isLoading.set(true);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.isLoading.set(false))
    );
  }

  /**
   * Get products owned by the current provider
   */
  getProviderProducts(): Observable<Product[]> {
    // For now, it might be the same as getAll but potentially with a sellerId filter
    // If backend has /api/products/my, use it. Otherwise use getAll.
    return this.getAll();
  }

  /**
   * Get products by category
   * @param category - Category name
   * @returns Observable with product list
   */
  getByCategory(category: string): Observable<Product[]> {
    let params = new HttpParams().set('category', category);
    return this.http.get<Product[]>(`${this.apiUrl}/category`, { params });
  }

  /**
   * Search products by query string
   * @param query - Search query
   * @returns Observable with matching products
   */
  search(query: string): Observable<Product[]> {
    let params = new HttpParams().set('q', query);
    return this.http.get<Product[]>(`${this.apiUrl}/search`, { params });
  }
}
