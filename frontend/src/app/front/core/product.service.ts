import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Product } from '../models/product';
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

  /**
   * Get all products with optional filtering
   * @param filter - Optional filter parameters
   * @returns Observable with paginated product list
   */
  getAll(filter?: ProductFilter): Observable<Product[]> {
    let params = new HttpParams();
    if (filter?.category) params = params.set('category', filter.category || '');
    if (filter?.minPrice) params = params.set('minPrice', filter.minPrice.toString());
    if (filter?.maxPrice) params = params.set('maxPrice', filter.maxPrice.toString());
    if (filter?.search) params = params.set('search', filter.search);
    if (filter?.page) params = params.set('page', filter.page.toString());
    if (filter?.limit) params = params.set('limit', filter.limit.toString());

    this.isLoading.set(true);
    return this.http.get<any[]>(this.apiUrl, { params }).pipe(
      map((items) => items.map((i) => this.mapProduct(i)))
    );
  }

  /**
   * Get a single product by ID
   */
  getById(id: string): Observable<Product> {
    this.isLoading.set(true);
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((item) => this.mapProduct(item))
    );
  }

  /**
   * Create a new product (PROVIDER only)
   */
  create(data: CreateProductRequest): Observable<Product> {
    this.isLoading.set(true);
    return this.http.post<any>(this.apiUrl, data).pipe(
      map((item) => this.mapProduct(item))
    );
  }

  /**
   * Update an existing product
   */
  update(id: string, data: Partial<CreateProductRequest>): Observable<Product> {
    this.isLoading.set(true);
    return this.http.put<any>(`${this.apiUrl}/${id}`, data).pipe(
      map((item) => this.mapProduct(item))
    );
  }

  /**
   * Delete a product
   */
  delete(id: string): Observable<void> {
    this.isLoading.set(true);
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Map backend DTO to frontend Product model
   */
  private mapProduct(dto: any): Product {
    const baseUrl = environment.apiUrl.replace('/api', '');
    
    // Pick the first image or a placeholder
    let imageUrl = 'assets/images/placeholder-product.png';
    if (dto.images && dto.images.length > 0) {
      imageUrl = dto.images[0].url.startsWith('http') 
        ? dto.images[0].url 
        : `${baseUrl}${dto.images[0].url}`;
    }

    return {
      id: dto.id || dto._id?.$oid,
      name: dto.name,
      description: dto.description || '',
      price: dto.price,
      stock: dto.stock || 0,
      imageUrl: imageUrl,
      images: dto.images ? dto.images.map((img: any) => img.url.startsWith('http') ? img.url : `${baseUrl}${img.url}`) : [],
      category: (dto.categoryIds && dto.categoryIds.length > 0) ? 'General' : 'Others', // Simplification for now
      rating: 4.5, // Default for UI display
      reviewsCount: 10, // Default for UI display
      isNegotiable: true,
      condition: dto.status === 'APPROVED' ? 'NEW' : 'NEW' as any, // Placeholder mapping
      stockStatus: dto.stock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK' as any
    };
  }

  /**
   * Get products by category
   */
  getByCategory(category: string): Observable<Product[]> {
    let params = new HttpParams().set('category', category);
    return this.http.get<any[]>(`${this.apiUrl}/category`, { params }).pipe(
      map((items) => items.map((i) => this.mapProduct(i)))
    );
  }

  /**
   * Search products by query string
   */
  search(query: string): Observable<Product[]> {
    let params = new HttpParams().set('q', query);
    return this.http.get<any[]>(`${this.apiUrl}/search`, { params }).pipe(
      map((items) => items.map((i) => this.mapProduct(i)))
    );
  }

  /**
   * Get current user's products (PROVIDER only)
   */
  getMyProducts(): Observable<Product[]> {
    this.isLoading.set(true);
    return this.http.get<any[]>(`${this.apiUrl}/my`).pipe(
      map((items) => items.map((i) => this.mapProduct(i)))
    );
  }
}
