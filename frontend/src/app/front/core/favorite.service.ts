import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Favorite, FavoriteListResponse, AddFavoriteRequest } from '../models/favorite.model';
import { environment } from '../../../environment';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private readonly apiUrl = `${environment.apiUrl}/favoris`;
  private http = inject(HttpClient);

  readonly favorites = signal<Favorite[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly favoriteCount = computed(() => this.favorites().length);
  readonly favoriteIds = computed(() => this.favorites().map(f => f.productId));

  getAll(): Observable<any[]> {
    this.isLoading.set(true);
    return this.http.get<any[]>(this.apiUrl).pipe(
      tap({ next: () => this.isLoading.set(false), error: () => this.isLoading.set(false) })
    );
  }

  add(request: AddFavoriteRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, { productId: request.productId });
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  isFavorite(productId: string): boolean {
    return this.favoriteIds().includes(productId);
  }
}
