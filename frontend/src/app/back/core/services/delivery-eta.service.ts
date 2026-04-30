import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environment';
import { DeliveryEtaPrediction } from '../models/delivery-eta.models';

@Injectable({ providedIn: 'root' })
export class DeliveryEtaService {
  private readonly baseUrl = `${environment.apiUrl}/delivery-eta`;

  constructor(private http: HttpClient) {}

  predict(deliveryId: string): Observable<DeliveryEtaPrediction> {
    return this.http.post<DeliveryEtaPrediction>(`${this.baseUrl}/${deliveryId}/predict`, {});
  }

  latest(deliveryId: string): Observable<DeliveryEtaPrediction> {
    return this.http.get<DeliveryEtaPrediction>(`${this.baseUrl}/${deliveryId}/latest`);
  }

  history(deliveryId: string): Observable<DeliveryEtaPrediction[]> {
    return this.http.get<DeliveryEtaPrediction[]>(`${this.baseUrl}/${deliveryId}/history`);
  }
}
