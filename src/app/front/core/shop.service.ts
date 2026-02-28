import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Shop, ProductCategory } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  private readonly apiUrl = '/api/shops';

  readonly currentShop = signal<Shop | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

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
    // TODO: Implement HTTP call
    console.log('ShopService.getMyShop() called');
    return of({} as Shop);
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
  private readonly apiUrl = '/api/categories';

  readonly categories = signal<ProductCategory[]>([]);
  readonly isLoading = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  getCategories(): Observable<ProductCategory[]> {
    // TODO: Implement HTTP call
    console.log('CategoryService.getCategories() called');
    return of([]);
  }

  getCategoryById(id: string): Observable<ProductCategory> {
    // TODO: Implement HTTP call
    console.log('CategoryService.getCategoryById() called with:', id);
    return of({} as ProductCategory);
  }

  getCategoryBySlug(slug: string): Observable<ProductCategory> {
    // TODO: Implement HTTP call
    console.log('CategoryService.getCategoryBySlug() called with:', slug);
    return of({} as ProductCategory);
  }
}
