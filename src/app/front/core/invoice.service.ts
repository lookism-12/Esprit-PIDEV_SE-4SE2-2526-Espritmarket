import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Invoice, InvoiceStatus, InvoiceFilter } from '../models/invoice.model';

export interface InvoiceListResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  totalPages: number;
}

export interface GenerateInvoiceRequest {
  orderId: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private readonly apiUrl = '/api/invoices'; // TODO: Configure environment

  // Reactive state
  readonly invoices = signal<Invoice[]>([]);
  readonly selectedInvoice = signal<Invoice | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Get all invoices for current user (buyer sees own, seller sees from sales, admin sees all)
   * @param filter - Optional filter parameters
   * @returns Observable with paginated invoice list
   */
  getInvoices(filter?: InvoiceFilter): Observable<InvoiceListResponse> {
    // TODO: Implement actual HTTP call
    // let params = new HttpParams();
    // if (filter?.status) params = params.set('status', filter.status);
    // return this.http.get<InvoiceListResponse>(this.apiUrl, { params });
    console.log('InvoiceService.getInvoices() called with filter:', filter);
    return of({ invoices: [], total: 0, page: 1, totalPages: 0 });
  }

  /**
   * Get a single invoice by ID
   * @param invoiceId - Invoice ID
   * @returns Observable with invoice details
   */
  getInvoiceById(invoiceId: string): Observable<Invoice> {
    // TODO: Implement actual HTTP call
    // return this.http.get<Invoice>(`${this.apiUrl}/${invoiceId}`);
    console.log('InvoiceService.getInvoiceById() called with:', invoiceId);
    return of({} as Invoice);
  }

  /**
   * Generate invoice for an order
   * @param request - Invoice generation request
   * @returns Observable with generated invoice
   */
  generateInvoice(request: GenerateInvoiceRequest): Observable<Invoice> {
    // TODO: Implement actual HTTP call
    // return this.http.post<Invoice>(`${this.apiUrl}/generate`, request);
    console.log('InvoiceService.generateInvoice() called with:', request);
    return of({} as Invoice);
  }

  /**
   * Download invoice as PDF
   * @param invoiceId - Invoice ID
   * @returns Observable with PDF blob
   */
  downloadPdf(invoiceId: string): Observable<Blob> {
    // TODO: Implement actual HTTP call
    // return this.http.get(`${this.apiUrl}/${invoiceId}/pdf`, { responseType: 'blob' });
    console.log('InvoiceService.downloadPdf() called with:', invoiceId);
    return of(new Blob());
  }

  /**
   * Send invoice via email
   * @param invoiceId - Invoice ID
   * @param email - Optional email (defaults to buyer email)
   * @returns Observable with success status
   */
  sendByEmail(invoiceId: string, email?: string): Observable<{ success: boolean }> {
    // TODO: Implement actual HTTP call
    // return this.http.post<{ success: boolean }>(`${this.apiUrl}/${invoiceId}/send`, { email });
    console.log('InvoiceService.sendByEmail() called with:', invoiceId, email);
    return of({ success: false });
  }

  /**
   * Update invoice status (admin only)
   * @param invoiceId - Invoice ID
   * @param status - New status
   * @returns Observable with updated invoice
   */
  updateStatus(invoiceId: string, status: InvoiceStatus): Observable<Invoice> {
    // TODO: Implement actual HTTP call
    // return this.http.patch<Invoice>(`${this.apiUrl}/${invoiceId}/status`, { status });
    console.log('InvoiceService.updateStatus() called with:', invoiceId, status);
    return of({} as Invoice);
  }

  /**
   * Get invoice by order ID
   * @param orderId - Order ID
   * @returns Observable with invoice for the order
   */
  getByOrderId(orderId: string): Observable<Invoice> {
    // TODO: Implement actual HTTP call
    // return this.http.get<Invoice>(`${this.apiUrl}/order/${orderId}`);
    console.log('InvoiceService.getByOrderId() called with:', orderId);
    return of({} as Invoice);
  }
}
