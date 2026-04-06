import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

export interface Category {
  id: string;
  name: string;
  description?: string;
  productIds?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}`;

  // Get all categories
  getAll(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  // Get category by ID
  getById(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/categories/${id}`);
  }

  // Create new category
  create(name: string): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categories`, { name });
  }

  // Update category
  update(id: string, name: string): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/categories/${id}`, { name });
  }

  // Delete category
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/${id}`);
  }
}