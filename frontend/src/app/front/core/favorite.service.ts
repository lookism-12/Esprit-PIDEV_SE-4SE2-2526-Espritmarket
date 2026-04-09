import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environment';

export interface FavorisResponse {
  id: string;
  userId: string;
  productId?: string;
  serviceId?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private readonly apiUrl = `${environment.apiUrl}/favoris`;
  private http = inject(HttpClient);

  // State
  readonly favorites = signal<FavorisResponse[]>([]);
  readonly isLoading = signal<boolean>(false);

  // Derived
  readonly favoriteCount = computed(() => this.favorites().length);
  readonly favoriteProductIds = computed(() =>
    new Set(this.favorites().filter(f => f.productId).map(f => f.productId!))
  );
  readonly favoriteServiceIds = computed(() =>
    new Set(this.favorites().filter(f => f.serviceId).map(f => f.serviceId!))
  );

  /** Load current user's favorites from backend */
  loadMyFavorites(): void {
    this.isLoading.set(true);
    this.http.get<FavorisResponse[]>(`${this.apiUrl}/my`).pipe(
      catchError(() => of([]))
    ).subscribe(data => {
      this.favorites.set(data ?? []);
      this.isLoading.set(false);
    });
  }

  /** Toggle product favorite — returns true if now favorited */
  toggleProduct(productId: string): Observable<FavorisResponse | null> {
    return this.http.post<FavorisResponse | null>(
      `${this.apiUrl}/toggle/product/${productId}`, {}
    ).pipe(
      tap(result => {
        if (result) {
          // Added
          this.favorites.update(list => [...list, result]);
        } else {
          // Removed
          this.favorites.update(list => list.filter(f => f.productId !== productId));
        }
      }),
      catchError(err => { console.error('Toggle favorite failed', err); return of(null); })
    );
  }

  /** Toggle service favorite */
  toggleService(serviceId: string): Observable<FavorisResponse | null> {
    return this.http.post<FavorisResponse | null>(
      `${this.apiUrl}/toggle/service/${serviceId}`, {}
    ).pipe(
      tap(result => {
        if (result) {
          this.favorites.update(list => [...list, result]);
        } else {
          this.favorites.update(list => list.filter(f => f.serviceId !== serviceId));
        }
      }),
      catchError(err => { console.error('Toggle service favorite failed', err); return of(null); })
    );
  }

  /** Remove by favorite ID */
  removeById(favoriteId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${favoriteId}`).pipe(
      tap(() => this.favorites.update(list => list.filter(f => f.id !== favoriteId))),
      catchError(err => { console.error('Remove favorite failed', err); return of(undefined); })
    );
  }

  isProductFavorited(productId: string): boolean {
    return this.favoriteProductIds().has(productId);
  }

  isServiceFavorited(serviceId: string): boolean {
    return this.favoriteServiceIds().has(serviceId);
  }

  getFavoriteIdForProduct(productId: string): string | undefined {
    return this.favorites().find(f => f.productId === productId)?.id;
  }
}
