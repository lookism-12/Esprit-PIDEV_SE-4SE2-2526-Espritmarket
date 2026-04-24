import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CreateNegotiationRequest,
  Negotiation,
  NegotiationResponse,
  UpdateNegotiationRequest
} from '../models/negotiation.model';
import { environment } from '../../../environment';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';

@Injectable({ providedIn: 'root' })
export class NegotiationService implements OnDestroy {
  private readonly apiUrl = `${environment.apiUrl}/negociations`;
  private readonly wsUrl = environment.apiUrl.replace('/api', '') + '/ws';

  private stompClient: Client | null = null;
  private updateSubject = new Subject<NegotiationResponse>();

  constructor(private http: HttpClient) {}

  /** Subscribe to real-time updates for a specific negotiation */
  connectToNegotiation(negotiationId: string): Observable<NegotiationResponse> {
    this.disconnect();

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(this.wsUrl) as any,
      reconnectDelay: 5000,
      onConnect: () => {
        this.stompClient!.subscribe(
          `/topic/negotiation/${negotiationId}`,
          (msg) => {
            const update: NegotiationResponse = JSON.parse(msg.body);
            this.updateSubject.next(update);
          }
        );
      }
    });

    this.stompClient.activate();
    return this.updateSubject.asObservable();
  }

  disconnect(): void {
    if (this.stompClient?.active) {
      this.stompClient.deactivate();
    }
    this.stompClient = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  createNegotiation(payload: CreateNegotiationRequest): Observable<NegotiationResponse> {
    // Backend NegociationRequest uses 'serviceId' as the unified item ID field
    // It resolves to Product or Service internally
    return this.http.post<NegotiationResponse>(this.apiUrl, {
      serviceId: payload.productId,
      amount: payload.proposedPrice,
      message: (payload as any).message
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
    return this.http.get<{ content: Negotiation[] }>(this.apiUrl, { params: { page, size } }).pipe(
      map((result: { content: Negotiation[] }) => ({ content: result?.content ?? [] }))
    );
  }

  getIncomingNegociations(): Observable<{ negotiations: Negotiation[] }> {
    return this.http.get<Negotiation[]>(`${this.apiUrl}/incoming`).pipe(
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

  create(payload: { 
    productId?: string; 
    serviceId?: string; 
    proposedPrice?: number; 
    amount?: number; 
    quantity?: number;
    message?: string;
    isExchange?: boolean;
    exchangeImage?: string;
  }): Observable<NegotiationResponse> {
    const mapped: CreateNegotiationRequest = {
      productId: payload.productId ?? payload.serviceId ?? '',
      proposedPrice: payload.proposedPrice ?? payload.amount ?? 0,
      quantity: payload.quantity,
      message: payload.message,
      isExchange: payload.isExchange,
      exchangeImage: payload.exchangeImage
    };
    return this.createNegotiation(mapped);
  }

  submitCounterProposal(request: { 
    negotiationId: string; 
    amount: number; 
    quantity?: number;
    message?: string;
    isExchange?: boolean;
    exchangeImage?: string;
  }): Observable<NegotiationResponse> {
    return this.http.post<NegotiationResponse>(`${this.apiUrl}/${request.negotiationId}/proposals/direct`, {
      amount: request.amount,
      quantity: request.quantity,
      message: request.message,
      isExchange: request.isExchange,
      exchangeImage: request.exchangeImage,
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

  // Provider Dashboard methods — returns only negotiations for this provider's products/services
  getProviderNegotiations(): Observable<Negotiation[]> {
    return this.http.get<Negotiation[]>(`${this.apiUrl}/incoming`);
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
