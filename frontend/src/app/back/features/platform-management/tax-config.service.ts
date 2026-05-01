import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environment';

export interface TaxConfig {
  id: string | null;
  name: string;
  rate: number;       // 0.19 = 19%
  isDefault: boolean;
  active: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

@Injectable({ providedIn: 'root' })
export class TaxConfigService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl.replace('/api', '')}/api/admin/tax-config`;

  /** Effective TVA — no auth required (used at cart/checkout) */
  getEffective(): Observable<TaxConfig> {
    return this.http.get<TaxConfig>(`${this.base}/effective`);
  }

  getAll(): Observable<TaxConfig[]> {
    return this.http.get<TaxConfig[]>(this.base);
  }

  create(dto: Partial<TaxConfig>): Observable<TaxConfig> {
    return this.http.post<TaxConfig>(this.base, dto);
  }

  update(id: string, dto: Partial<TaxConfig>): Observable<TaxConfig> {
    return this.http.put<TaxConfig>(`${this.base}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  setDefault(id: string): Observable<TaxConfig> {
    return this.http.patch<TaxConfig>(`${this.base}/${id}/default`, {});
  }

  toggleActive(id: string): Observable<TaxConfig> {
    return this.http.patch<TaxConfig>(`${this.base}/${id}/toggle`, {});
  }
}
