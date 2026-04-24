import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { Product } from '../models/product';
import { environment } from '../../../environment';
import { ImageUrlHelper } from '../../shared/utils/image-url.helper';

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
  shopId: string;
  categoryIds: string[];
  price: number;
  stock: number;
  images?: ProductImageDTO[];
}

export interface ProductImageDTO {
  url: string;
  altText?: string;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
}

// Backend response interface
export interface ProductResponseDTO {
  id: string;
  name: string;
  description: string;
  shopId: string;
  categoryIds: string[];
  price: number;
  stock: number;
  images?: ProductImageDTO[];
  // Enriched fields from backend mapper
  sellerName?: string;
  categoryName?: string;
  stockStatus?: string;
  isAvailable?: boolean;
  // ✅ APPROVAL WORKFLOW FIELDS
  status?: string;
  createdAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
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

  // Cache state
  private productsCache: Product[] = [];
  private lastFetchTime = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(private http: HttpClient) {}

  /**
   * Validate and fix image URL using ImageUrlHelper
   * @param imageUrl - Original image URL
   * @returns Valid image URL or fallback
   */
  private getValidImageUrl(imageUrl: string | undefined): string {
    return ImageUrlHelper.toAbsoluteUrl(imageUrl, '/assets/images/placeholder.png');
  }

  /**
   * Map backend DTO to frontend Product interface
   * Uses enriched fields from backend (sellerName, categoryName, stockStatus)
   * @param dtos - Backend product DTOs
   * @returns Mapped frontend products
   */
  private mapToFrontendProducts(dtos: ProductResponseDTO[]): Product[] {
    return dtos.map(dto => ({
      id: dto.id,
      name: dto.name,
      description: dto.description,
      price: dto.price,
      category: dto.categoryName || 'Autres',  // ✅ Use backend enriched value
      imageUrl: this.getValidImageUrl(dto.images?.[0]?.url),
      images: dto.images?.map(img => this.getValidImageUrl(img.url)) || [],
      sellerId: dto.shopId,
      sellerName: dto.sellerName || 'Unknown Seller',  // ✅ Use backend enriched value
      rating: 4.5, // Will be enhanced with real ratings
      reviewsCount: 0, // Will be enhanced with real review counts
      stock: dto.stock,
      stockStatus: (dto.stockStatus || 'OUT_OF_STOCK') as any,  // ✅ Use backend enriched value
      condition: 'NEW' as any,
      isNegotiable: false,
      isAvailable: dto.isAvailable ?? (dto.stock > 0),  // ✅ Use backend enriched value
      // Add approval workflow fields
      status: dto.status as any,
      approvedAt: dto.approvedAt ? new Date(dto.approvedAt) : undefined,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
      approvedBy: dto.approvedBy,
      rejectionReason: dto.rejectionReason
    }));
  }

  /**
   * Get stock status from stock quantity
   * @param stock - Stock quantity
   * @returns Stock status string
   */
  private getStockStatus(stock: number): string {
    if (stock > 10) return 'IN_STOCK';
    if (stock > 0) return 'LOW_STOCK';
    return 'OUT_OF_STOCK';
  }

  /**
   * Get category name from category IDs
   * Maps ObjectIds to category display names
   * @param categoryIds - Array of category IDs
   * @returns Category display name
   */
  private getCategoryFromIds(categoryIds: string[] | undefined): string {
    if (!categoryIds || categoryIds.length === 0) {
      return 'Autres';
    }
    // For now, return a generic category
    // In the future, this can be enhanced to fetch actual category names
    return 'Produits';
  }

  /**
   * Get all products with optional filtering
   * IMPORTANT: Backend getAll() does NOT support query parameters yet
   * @param filter - Optional filter parameters (currently ignored by backend)
   * @returns Observable with products list
   */
  /**
   * Get products for the current authenticated provider's shop
   * This endpoint is secured and only returns products belonging to the provider's shop
   */
  getMyProducts(): Observable<Product[]> {
    console.log('📦 ProductService: Fetching provider\'s own products from /api/products/mine');
    return this.http.get<ProductResponseDTO[]>(`${this.apiUrl}/mine`).pipe(
      map((dtos: ProductResponseDTO[]) => {
        console.log(`✅ ProductService: Received ${dtos.length} products for provider's shop`);
        return this.mapToFrontendProducts(dtos);
      }),
      catchError((error) => {
        console.error('❌ ProductService: Failed to fetch provider products:', error);
        throw error;
      })
    );
  }

  getAll(filter?: ProductFilter, forceRefresh = false): Observable<Product[]> {
    const now = Date.now();
    
    // Check cache (ignore filter for now as backend doesn't support it, 
    // but keep parameter to avoid build errors)
    if (!forceRefresh && this.productsCache.length > 0 && (now - this.lastFetchTime < this.CACHE_DURATION)) {
      console.log('⚡ Returning products from cache');
      this.products.set(this.productsCache);
      return new Observable(subscriber => {
        subscriber.next(this.productsCache);
        subscriber.complete();
      });
    }

    this.isLoading.set(true);
    return this.http.get<ProductResponseDTO[]>(this.apiUrl).pipe(
      map((dtos) => {
        const products = this.mapToFrontendProducts(dtos);
        this.productsCache = products;
        this.lastFetchTime = Date.now();
        this.products.set(products);
        this.isLoading.set(false);
        console.log('✅ Products loaded from server:', products.length);
        return products;
      }),
      catchError((error) => {
        this.error.set('Failed to load products');
        this.isLoading.set(false);
        console.error('❌ Products loading error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get only approved products (for marketplace display)
   * @returns Observable with approved products list
   */
  getApprovedProducts(): Observable<Product[]> {
    this.isLoading.set(true);
    return this.http.get<ProductResponseDTO[]>(`${this.apiUrl}/approved`).pipe(
      map((dtos) => {
        const products = this.mapToFrontendProducts(dtos);
        this.products.set(products);
        this.isLoading.set(false);
        console.log('✅ Approved products loaded:', products.length);
        return products;
      }),
      catchError((error) => {
        this.error.set('Failed to load approved products');
        this.isLoading.set(false);
        console.error('❌ Approved products loading error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get products by status (for admin/seller dashboards)
   * @param status - Product status (PENDING, APPROVED, REJECTED, SUSPENDED)
   * @returns Observable with products list
   */
  getProductsByStatus(status: string): Observable<Product[]> {
    this.isLoading.set(true);
    return this.http.get<ProductResponseDTO[]>(`${this.apiUrl}/status/${status}`).pipe(
      map((dtos) => {
        const products = this.mapToFrontendProducts(dtos);
        this.isLoading.set(false);
        console.log(`✅ Products with status ${status} loaded:`, products.length);
        return products;
      }),
      catchError((error) => {
        this.error.set(`Failed to load ${status} products`);
        this.isLoading.set(false);
        console.error(`❌ ${status} products loading error:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Approve a product (ADMIN/PROVIDER)
   * @param productId - Product ID to approve
   * @returns Observable with approved product
   */
  approveProduct(productId: string): Observable<Product> {
    this.isLoading.set(true);
    return this.http.put<ProductResponseDTO>(`${this.apiUrl}/${productId}/approve`, {}).pipe(
      map((dto) => {
        const product = this.mapToFrontendProducts([dto])[0];
        this.isLoading.set(false);
        console.log('✅ Product approved:', product);
        return product;
      }),
      catchError((error) => {
        this.error.set('Failed to approve product');
        this.isLoading.set(false);
        console.error('❌ Product approval error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Reject a product (ADMIN only)
   * @param productId - Product ID to reject
   * @param reason - Rejection reason
   * @returns Observable with rejected product
   */
  rejectProduct(productId: string, reason: string): Observable<Product> {
    this.isLoading.set(true);
    return this.http.put<ProductResponseDTO>(`${this.apiUrl}/${productId}/reject`, { reason }).pipe(
      map((dto) => {
        const product = this.mapToFrontendProducts([dto])[0];
        this.isLoading.set(false);
        console.log('✅ Product rejected:', product);
        return product;
      }),
      catchError((error) => {
        this.error.set('Failed to reject product');
        this.isLoading.set(false);
        console.error('❌ Product rejection error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a single product by ID
   * @param id - Product ID
   * @returns Observable with product details
   */
  getById(id: string): Observable<Product> {
    this.isLoading.set(true);
    return this.http.get<ProductResponseDTO>(`${this.apiUrl}/${id}`).pipe(
      map((dto) => {
        const product = this.mapToFrontendProducts([dto])[0];
        this.selectedProduct.set(product);
        this.isLoading.set(false);
        console.log('✅ Product loaded:', product);
        return product;
      }),
      catchError((error) => {
        this.error.set('Failed to load product');
        this.isLoading.set(false);
        console.error('❌ Product loading error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new product (PROVIDER only)
   * @param data - Product creation data
   * @returns Observable with created product
   */
  create(data: CreateProductRequest): Observable<Product> {
    // ❗ VALIDATION: Product MUST have at least one category
    if (!data.categoryIds || data.categoryIds.length === 0) {
      console.error('❌ Cannot create product without categories');
      throw new Error('Product must have at least one category');
    }
    
    // Transform the data to match backend DTO structure
    const backendData = {
      name: data.name,
      description: data.description,
      shopId: data.shopId,
      categoryIds: data.categoryIds,
      price: data.price,
      stock: data.stock,
      images: data.images || []
    };
    
    this.isLoading.set(true);
    console.log('🚀 Creating product with backend format:', backendData);
    return this.http.post<ProductResponseDTO>(this.apiUrl, backendData).pipe(
      map((dto) => {
        const product = this.mapToFrontendProducts([dto])[0];
        this.isLoading.set(false);
        console.log('✅ Product created:', product);
        return product;
      }),
      catchError((error) => {
        this.error.set('Failed to create product');
        this.isLoading.set(false);
        console.error('❌ Product creation error:', error);
        return throwError(() => error);
      })
    );
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
    return this.http.put<ProductResponseDTO>(`${this.apiUrl}/${id}`, data).pipe(
      map((dto) => {
        const product = this.mapToFrontendProducts([dto])[0];
        this.isLoading.set(false);
        console.log('✅ Product updated:', product);
        return product;
      }),
      catchError((error) => {
        this.error.set('Failed to update product');
        this.isLoading.set(false);
        console.error('❌ Product update error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a product (PROVIDER/owner only)
   * @param id - Product ID to delete
   * @returns Observable with void on success
   */
  delete(id: string): Observable<void> {
    this.isLoading.set(true);
    console.log('🗑️ Deleting product:', id);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.isLoading.set(false);
        console.log('✅ Product deleted:', id);
      }),
      catchError((error) => {
        this.error.set('Failed to delete product');
        this.isLoading.set(false);
        console.error('❌ Product deletion error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get products by category
   * @param category - Category name
   * @returns Observable with product list
   */
  getByCategory(category: string): Observable<Product[]> {
    return this.getAll({ category });
  }

  /**
   * Search products by query string
   * @param query - Search query
   * @returns Observable with matching products
   */
  search(query: string): Observable<Product[]> {
    return this.getAll({ search: query });
  }

  /**
   * Upload image files for a product — sent to backend which uploads to Cloudinary.
   * Only the returned secure URLs are stored in MongoDB.
   */
  uploadProductImages(productId: string, files: File[]): Observable<{ images: { url: string; altText: string }[] }> {
    if (!files || files.length === 0) throw new Error('No files provided');

    const formData = new FormData();
    files.forEach(file => formData.append('files', file, file.name));

    return this.http.post<any>(`${this.apiUrl}/${productId}/images/upload`, formData).pipe(
      map((dto: any) => ({
        images: (dto.images || []).map((img: any) => ({
          url: img.url,
          altText: img.altText || ''
        }))
      })),
      catchError(err => {
        console.error('❌ Image upload error:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Delete a product image — removes from MongoDB and Cloudinary.
   */
  deleteProductImage(productId: string, imageUrl: string): Observable<Product> {
    const params = new HttpParams().set('imageUrl', imageUrl);
    return this.http.delete<ProductResponseDTO>(`${this.apiUrl}/${productId}/images`, { params }).pipe(
      map(dto => this.mapToFrontendProducts([dto])[0]),
      catchError(err => {
        console.error('❌ Delete image error:', err);
        return throwError(() => err);
      })
    );
  }
}
