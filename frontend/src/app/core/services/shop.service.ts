import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

export interface ShopDto {
  id: string;
  ownerId?: string;
}

@Injectable({ providedIn: 'root' })
export class ShopService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/shops`;

  getMyShop(): Observable<ShopDto> {
    return this.http.get<ShopDto>(`${this.apiUrl}/me`);
  }

  getAll(): Observable<ShopDto[]> {
    return this.http.get<ShopDto[]>(this.apiUrl);
  }

  createShop(ownerId: string): Observable<ShopDto> {
    return this.http.post<ShopDto>(this.apiUrl, { ownerId });
  }
}
