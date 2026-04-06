import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

export interface ServiceDto {
  id: string;
  name: string;
  description: string;
  price: number;
  shopId: string;
  categoryIds: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: Date;
  updatedAt?: Date;
}

// Alias for compatibility
export interface Service extends ServiceDto {}

@Injectable({
  providedIn: 'root'
})
export class ServiceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}`;

  // Get all services
  getAll(): Observable<ServiceDto[]> {
    return this.http.get<ServiceDto[]>(`${this.apiUrl}/services`);
  }

  // Get service by ID
  getById(id: string): Observable<ServiceDto> {
    return this.http.get<ServiceDto>(`${this.apiUrl}/services/${id}`);
  }

  // Create new service
  create(service: Partial<ServiceDto>): Observable<ServiceDto> {
    return this.http.post<ServiceDto>(`${this.apiUrl}/services`, service);
  }

  // Update service
  update(id: string, service: Partial<ServiceDto>): Observable<ServiceDto> {
    return this.http.put<ServiceDto>(`${this.apiUrl}/services/${id}`, service);
  }

  // Delete service
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/services/${id}`);
  }

  // Get services by shop
  getByShop(shopId: string): Observable<ServiceDto[]> {
    return this.http.get<ServiceDto[]>(`${this.apiUrl}/services/shop/${shopId}`);
  }
}