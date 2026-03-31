import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CreateNegotiationRequest,
  Negotiation,
  NegotiationResponse,
  UpdateNegotiationRequest
} from '../models/negotiation.model';
import { environment } from '../../../environment';

@Injectable({
  providedIn: 'root'
})
export class NegotiationService {
  private readonly apiUrl = `${environment.apiUrl}/negociations`;

  constructor(private http: HttpClient) {}

  createNegotiation(payload: CreateNegotiationRequest): Observable<NegotiationResponse> {
    return this.http.post<NegotiationResponse>(this.apiUrl, {
      serviceId: payload.productId,
      amount: payload.proposedPrice
    });
  }

  getNegotiationById(id: string): Observable<NegotiationResponse> {
    return this.http.get<NegotiationResponse>(`${this.apiUrl}/${id}`);
  }

  updateNegotiation(id: string, payload: UpdateNegotiationRequest): Observable<NegotiationResponse> {
    if (payload.action === 'COUNTER') {
      return this.http.post<NegotiationResponse>(`${this.apiUrl}/${id}/proposals/direct`, {
        amount: payload.newPrice,
        type: 'COUNTER_PROPOSAL'
      });
    }

    const status = payload.action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';
    return this.http.patch<NegotiationResponse>(`${this.apiUrl}/${id}/status/direct`, null, {
      params: { status }
    });
  }

  closeNegotiation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getAll(): Observable<{ negotiations: Negotiation[] }> {
    return this.http.get<Negotiation[]>(`${this.apiUrl}/my`).pipe(
      map((negotiations: Negotiation[]) => ({ negotiations }))
    );
  }

  getAllAdmin(page: number = 0, size: number = 20): Observable<{ content: Negotiation[] }> {
    return this.http
      .get<{ content: Negotiation[] }>(this.apiUrl, { params: { page, size } })
      .pipe(map((result: { content: Negotiation[] }) => ({ content: result?.content ?? [] })));
  }

  getIncomingNegociations(): Observable<{ negotiations: Negotiation[] }> {
    return this.http.get<Negotiation[]>(`${this.apiUrl}/all`).pipe(
      map((negotiations: Negotiation[]) => ({ negotiations }))
    );
  }

  getByProduct(productId: string): Observable<Negotiation[]> {
    return this.http.get<Negotiation[]>(`${this.apiUrl}/my`).pipe(
      map((items: Negotiation[]) =>
        items.filter((n: Negotiation) => n.productId === productId || n.serviceId === productId)
      )
    );
  }

  create(payload: { productId?: string; serviceId?: string; proposedPrice?: number; amount?: number; message?: string }): Observable<NegotiationResponse> {
    const mapped: CreateNegotiationRequest = {
      productId: payload.productId ?? payload.serviceId ?? '',
      proposedPrice: payload.proposedPrice ?? payload.amount ?? 0
    };
    return this.createNegotiation(mapped);
  }

  submitCounterProposal(request: { negotiationId: string; amount: number; message?: string }): Observable<NegotiationResponse> {
    return this.http.post<NegotiationResponse>(`${this.apiUrl}/${request.negotiationId}/proposals/direct`, {
      amount: request.amount,
      message: request.message,
      type: 'COUNTER_PROPOSAL'
    });
  }

  accept(negotiationId: string): Observable<NegotiationResponse> {
    return this.updateNegotiation(negotiationId, { action: 'ACCEPT' });
  }

  reject(negotiationId: string): Observable<NegotiationResponse> {
    return this.updateNegotiation(negotiationId, { action: 'REJECT' });
  }

  cancel(negotiationId: string): Observable<void> {
    return this.closeNegotiation(negotiationId);
  }

  // Provider Dashboard methods
  getProviderNegotiations(): Observable<Negotiation[]> {
    return this.http.get<Negotiation[]>(`${this.apiUrl}/all`);
  }

  acceptNegotiation(id: string): Observable<NegotiationResponse> {
    return this.accept(id);
  }

  rejectNegotiation(id: string): Observable<NegotiationResponse> {
    return this.reject(id);
  }

  counterOffer(id: string, price: number): Observable<NegotiationResponse> {
    return this.submitCounterProposal({ negotiationId: id, amount: price });
  }
}
