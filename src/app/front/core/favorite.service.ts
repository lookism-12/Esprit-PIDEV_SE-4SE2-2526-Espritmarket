import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Favorite, FavoriteListResponse, AddFavoriteRequest } from '../models/favorite.model';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private readonly apiUrl = '/api/favorites';

  readonly favorites = signal<Favorite[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly favoriteCount = computed(() => this.favorites().length);
  readonly favoriteIds = computed(() => this.favorites().map(f => f.productId));

  constructor(private http: HttpClient) {}

  getAll(page = 1, limit = 20): Observable<FavoriteListResponse> {
    // TODO: Implement HTTP call
    console.log('FavoriteService.getAll() called');
    return of({ favorites: [], total: 0, page: 1, totalPages: 0 });
  }

  add(request: AddFavoriteRequest): Observable<Favorite> {
    // TODO: Implement HTTP call
    console.log('FavoriteService.add() called with:', request);
    return of({} as Favorite);
  }

  remove(productId: string): Observable<void> {
    // TODO: Implement HTTP call
    console.log('FavoriteService.remove() called with:', productId);
    return of(void 0);
  }

  toggle(productId: string): Observable<{ isFavorite: boolean }> {
    // TODO: Implement HTTP call
    console.log('FavoriteService.toggle() called with:', productId);
    return of({ isFavorite: false });
  }

  isFavorite(productId: string): boolean {
    return this.favoriteIds().includes(productId);
  }

  checkPriceChanges(): Observable<Favorite[]> {
    // TODO: Implement HTTP call
    console.log('FavoriteService.checkPriceChanges() called');
    return of([]);
  }
}
