import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environment';

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly apiUrl = `${environment.apiUrl}/categories`;

  // State
  readonly categories = signal<Category[]>([]);
  readonly isLoading = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  getAll(): Observable<Category[]> {
    this.isLoading.set(true);
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(cats => cats.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-')
      }))),
      tap(cats => {
        this.categories.set(cats);
        this.isLoading.set(false);
      })
    );
  }
}
