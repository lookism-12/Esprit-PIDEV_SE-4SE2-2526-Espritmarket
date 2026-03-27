import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

export interface ServiceEntity {
  id?: string;
  name: string;
  description: string;
  price: number;
  shopId: string;
  categoryId: string;
}

@Injectable({
  providedIn: 'root'
})
export class MarketplaceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/services`;

  getAll(): Observable<ServiceEntity[]> {
    return this.http.get<ServiceEntity[]>(this.apiUrl);
  }

  getById(id: string): Observable<ServiceEntity> {
    return this.http.get<ServiceEntity>(`${this.apiUrl}/${id}`);
  }

  create(service: ServiceEntity): Observable<ServiceEntity> {
    return this.http.post<ServiceEntity>(this.apiUrl, service);
  }

  update(id: string, service: ServiceEntity): Observable<ServiceEntity> {
    return this.http.put<ServiceEntity>(`${this.apiUrl}/${id}`, service);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
