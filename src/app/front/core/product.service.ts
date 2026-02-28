import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Product } from '../models/product';

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
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl = '/api/products'; // TODO: Configure environment

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
  getAll(filter?: ProductFilter): Observable<ProductListResponse> {
    // TODO: Implement actual HTTP call with query params
    // let params = new HttpParams();
    // if (filter?.category) params = params.set('category', filter.category);
    // if (filter?.minPrice) params = params.set('minPrice', filter.minPrice.toString());
    // return this.http.get<ProductListResponse>(this.apiUrl, { params });
    console.log('ProductService.getAll() called with filter:', filter);
    return of({ products: [], total: 0, page: 1, totalPages: 0 });
  }

  /**
   * Get a single product by ID
   * @param id - Product ID
   * @returns Observable with product details
   */
  getById(id: string): Observable<Product> {
    // TODO: Implement actual HTTP call
    // return this.http.get<Product>(`${this.apiUrl}/${id}`);
    console.log('ProductService.getById() called with id:', id);
    return of({} as Product);
  }

  /**
   * Create a new product (seller only)
   * @param data - Product creation data
   * @returns Observable with created product
   */
  create(data: CreateProductRequest): Observable<Product> {
    // TODO: Implement actual HTTP call
    // return this.http.post<Product>(this.apiUrl, data);
    console.log('ProductService.create() called with:', data);
    return of({} as Product);
  }

  /**
   * Update an existing product (seller/owner only)
   * @param data - Product update data including ID
   * @returns Observable with updated product
   */
  update(data: UpdateProductRequest): Observable<Product> {
    // TODO: Implement actual HTTP call
    // const { id, ...updateData } = data;
    // return this.http.put<Product>(`${this.apiUrl}/${id}`, updateData);
    console.log('ProductService.update() called with:', data);
    return of({} as Product);
  }

  /**
   * Delete a product (seller/owner only)
   * @param id - Product ID to delete
   * @returns Observable with void on success
   */
  delete(id: string): Observable<void> {
    // TODO: Implement actual HTTP call
    // return this.http.delete<void>(`${this.apiUrl}/${id}`);
    console.log('ProductService.delete() called with id:', id);
    return of(void 0);
  }

  /**
   * Get products by category
   * @param category - Category name
   * @returns Observable with product list
   */
  getByCategory(category: string): Observable<Product[]> {
    // TODO: Implement actual HTTP call
    // return this.http.get<Product[]>(`${this.apiUrl}/category/${category}`);
    console.log('ProductService.getByCategory() called with:', category);
    return of([]);
  }

  /**
   * Search products by query string
   * @param query - Search query
   * @returns Observable with matching products
   */
  search(query: string): Observable<Product[]> {
    // TODO: Implement actual HTTP call
    // return this.http.get<Product[]>(`${this.apiUrl}/search`, { params: { q: query } });
    console.log('ProductService.search() called with:', query);
    return of([]);
  }
}
