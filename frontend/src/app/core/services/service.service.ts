import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { environment } from '../../../environment';

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  shopId: string;
  categoryId?: string;
  imageUrl?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface ServiceRequest {
  name: string;
  description: string;
  price: number;
  shopId: string;
  categoryId?: string;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/services`;

  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  /**
   * Get all services (public)
   */
  getAll(): Observable<Service[]> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<Service[]>(this.apiUrl).pipe(
      tap(services => console.log('📦 Loaded services:', services)),
      catchError(err => this.handleError(err, 'Failed to load services')),
      finalize(() => this.isLoading.set(false))
    );
  }

  /**
   * Get seller's services
   */
  getMine(): Observable<Service[]> {
    this.isLoading.set(true);

    this.error.set(null);

    return this.http.get<Service[]>(`${this.apiUrl}/mine`).pipe(
      tap(services => console.log('📦 Loaded seller services:', services)),
      catchError(err => this.handleError(err, 'Failed to load your services')),
      finalize(() => this.isLoading.set(false))
    );
  }

  /**
   * Get a single service by ID
   */
  getById(id: string): Observable<Service> {
    this.isLoading.set(true);
    return this.http.get<Service>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => this.handleError(err, 'Failed to load service details')),
      finalize(() => this.isLoading.set(false))
    );
  }

  /**
   * Create a new service
   */
  createService(data: ServiceRequest): Observable<Service> {
    this.isLoading.set(true);
    return this.http.post<Service>(this.apiUrl, data).pipe(
      catchError(err => this.handleError(err, 'Failed to create service')),
      finalize(() => this.isLoading.set(false))
    );
  }

  /**
   * Update an existing service
   */
  updateService(id: string, data: Partial<ServiceRequest>): Observable<Service> {
    this.isLoading.set(true);
    return this.http.put<Service>(`${this.apiUrl}/${id}`, data).pipe(
      catchError(err => this.handleError(err, 'Failed to update service')),
      finalize(() => this.isLoading.set(false))
    );
  }

  /**
   * Delete a service
   */
  deleteService(id: string): Observable<void> {
    this.isLoading.set(true);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => this.handleError(err, 'Failed to delete service')),
      finalize(() => this.isLoading.set(false))
    );
  }

  /**
   * Centralized error handler
   */
  private handleError(error: any, message: string): Observable<never> {
    console.error(error);
    const errorMessage = error.error?.message || message;
    this.error.set(errorMessage);
    throw new Error(errorMessage);
  }
}
