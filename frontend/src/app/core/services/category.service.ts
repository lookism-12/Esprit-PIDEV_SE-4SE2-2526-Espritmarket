import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

export interface Category {
  id: string;
  name: string;
  productIds?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/categories`;

  /**
   * Get all categories from MongoDB
   */
  getAll(): Observable<Category[]> {
    console.log('🏷️ Fetching categories from MongoDB...');
    return this.http.get<Category[]>(this.apiUrl);
  }

  /**
   * Get category by ID
   */
  getById(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new category (Admin only)
   */
  create(name: string): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, { name });
  }

  /**
   * Update a category (Admin only)
   */
  update(id: string, name: string): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/${id}`, { name });
  }

  /**
   * Delete a category (Admin only)
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
