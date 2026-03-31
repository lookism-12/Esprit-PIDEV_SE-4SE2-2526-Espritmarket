import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
   * Get all products from the backend API
   */
  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${environment.apiUrl}/products`);
  }

  /**
   * Get all products with optional filtering
   * @param filter - Optional filter parameters
   * @returns Observable with paginated product list
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
    return this.http.get<Product[]>(this.apiUrl, { params });
  }

  /**
   * Get a single product by ID
   * @param id - Product ID
   * @returns Observable with product details
   */
  getById(id: string): Observable<Product> {
    this.isLoading.set(true);
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new product (PROVIDER only)
   * @param data - Product creation data
   * @returns Observable with created product
   */
  create(data: CreateProductRequest): Observable<Product> {
    this.isLoading.set(true);
    console.log('🚀 Creating product:', data);
    return this.http.post<Product>(this.apiUrl, data);
  }

  /**
   * Update an existing product (PROVIDER/owner only)
   * @param id - Product ID
   * @param data - Product update data
   * @returns Observable with updated product
   */
  update(id: string, data: Partial<CreateProductRequest>): Observable<Product> {
    this.isLoading.set(true);
    console.log('✏️ Updating product:', id, data);
    return this.http.put<Product>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Delete a product (PROVIDER/owner only)
   * @param id - Product ID to delete
   * @returns Observable with void on success
   */
  deleteProduct(id: string): Observable<void> {
    this.isLoading.set(true);
    console.log('🗑️ Deleting product:', id);
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Delete a product (compatibility alias)
   */
  delete(id: string): Observable<void> {
    return this.deleteProduct(id);
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
