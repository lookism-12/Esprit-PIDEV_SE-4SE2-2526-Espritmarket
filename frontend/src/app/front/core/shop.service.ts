import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { Shop, ProductCategory } from '../models/product';
import { environment } from '../../../environment';

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  private readonly apiUrl = `${environment.apiUrl}/shops`;  // ✅ This is correct: http://localhost:8090/api/shops

  readonly currentShop = signal<Shop | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Get all shops
   * @returns Observable with shop list
   */
  getAllShops(): Observable<Shop[]> {
    this.isLoading.set(true);
    this.error.set(null);
    console.log('🏪 Fetching all shops from backend...');
    return this.http.get<Shop[]>(this.apiUrl).pipe(
      tap({
        next: (shops) => {
          console.log('✅ Shops loaded:', shops.length, shops);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('❌ Failed to load shops:', err);
          this.error.set(err.message || 'Failed to load shops');
          this.isLoading.set(false);
        }
      })
    );
  }

  getShopById(id: string): Observable<Shop> {
    // TODO: Implement HTTP call
    console.log('ShopService.getShopById() called with:', id);
    return of({} as Shop);
  }

  getShopBySlug(slug: string): Observable<Shop> {
    // TODO: Implement HTTP call
    console.log('ShopService.getShopBySlug() called with:', slug);
    return of({} as Shop);
  }

  getShopByUserId(userId: string): Observable<Shop> {
    // TODO: Implement HTTP call
    console.log('ShopService.getShopByUserId() called with:', userId);
    return of({} as Shop);
  }

  getMyShop(): Observable<Shop> {
    console.log('ShopService.getMyShop() called - fetching from backend');
    return this.http.get<Shop>(`${this.apiUrl}/me`).pipe(
      tap({
        next: (shop) => {
          console.log('✅ My shop loaded:', shop);
          this.currentShop.set(shop);
        },
        error: (err) => {
          console.error('❌ Failed to load my shop:', err);
          this.error.set(err.message || 'Failed to load shop');
        }
      })
    );
  }

  updateShop(data: Partial<Shop>): Observable<Shop> {
    // TODO: Implement HTTP call
    console.log('ShopService.updateShop() called with:', data);
    return of({} as Shop);
  }
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly apiUrl = `${environment.apiUrl}/categories`;

  readonly categories = signal<ProductCategory[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Get all categories from backend
   * @returns Observable with category list
   */
  getCategories(): Observable<ProductCategory[]> {
    this.isLoading.set(true);
    this.error.set(null);
    console.log('📂 Fetching categories from backend...', this.apiUrl);
    return this.http.get<any[]>(this.apiUrl).pipe(
      tap({
        next: (data) => {
          console.log('🔍 Raw API response:', data);
          // Transform backend response to frontend model
          const categories = data.map(cat => ({
            id: cat.id,
            name: cat.name,
            slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
            icon: this.getCategoryIcon(cat.name),
            description: '',
            productCount: cat.productIds?.length || 0,
            productIds: cat.productIds || []
          } as ProductCategory));
          this.categories.set(categories);
          this.isLoading.set(false);
          console.log('✅ Categories transformed and loaded:', categories.length, categories);
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to load categories');
          this.isLoading.set(false);
          console.error('❌ Failed to load categories:', err);
          console.error('❌ Request URL was:', this.apiUrl);
        }
      })
    );
  }

  /**
   * Get appropriate icon for category
   * @param categoryName - Name of the category
   * @returns Icon string
   */
  private getCategoryIcon(categoryName: string): string {
    const name = categoryName.toLowerCase();
    if (name.includes('electronics')) return '📱';
    if (name.includes('book')) return '📚';
    if (name.includes('furniture')) return '🪑';
    if (name.includes('clothing')) return '👕';
    if (name.includes('food')) return '🍕';
    if (name.includes('sport')) return '⚽';
    if (name.includes('gaming')) return '🎮';
    if (name.includes('music')) return '🎵';
    if (name.includes('vehicle') || name.includes('car')) return '🚗';
    return '📦'; // Default icon
  }

  getCategoryById(id: string): Observable<ProductCategory> {
    this.isLoading.set(true);
    console.log('📂 Fetching category by ID:', id);
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      tap({
        next: (data) => {
          this.isLoading.set(false);
          console.log('✅ Category by ID loaded:', data);
        },
        error: (err) => {
          this.isLoading.set(false);
          console.error('❌ Failed to load category by ID:', err);
        }
      })
    );
  }

  getCategoryBySlug(slug: string): Observable<ProductCategory> {
    // TODO: Implement HTTP call
    console.log('CategoryService.getCategoryBySlug() called with:', slug);
    return of({} as ProductCategory);
  }

  /**
   * Create a new category (ADMIN only)
   * @param data - Category creation data
   * @returns Observable with created category
   */
  create(data: { name: string }): Observable<any> {
    this.isLoading.set(true);
    this.error.set(null);
    console.log('🚀 Creating category:', data);
    return this.http.post<any>(this.apiUrl, data).pipe(
      tap({
        next: () => this.isLoading.set(false),
        error: () => this.isLoading.set(false)
      })
    );
  }

  /**
   * Update an existing category (ADMIN only)
   * @param id - Category ID
   * @param data - Category update data
   * @returns Observable with updated category
   */
  update(id: string, data: { name: string }): Observable<any> {
    this.isLoading.set(true);
    this.error.set(null);
    console.log('✏️ Updating category:', id, data);
    return this.http.put<any>(`${this.apiUrl}/${id}`, data).pipe(
      tap({
        next: () => this.isLoading.set(false),
        error: () => this.isLoading.set(false)
      })
    );
  }

  /**
   * Delete a category (ADMIN only)
   * @param id - Category ID to delete
   * @returns Observable with void on success
   */
  delete(id: string): Observable<void> {
    this.isLoading.set(true);
    this.error.set(null);
    console.log('🗑️ Deleting category:', id);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap({
        next: () => this.isLoading.set(false),
        error: () => this.isLoading.set(false)
      })
    );
  }
}
