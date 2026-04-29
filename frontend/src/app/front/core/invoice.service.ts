import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

/**
 * Invoice Service
 * 
 * Handles PDF invoice generation and download for paid orders
 */
@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/invoices`;

  /**
   * Download invoice PDF for an order
   * 
   * @param orderId Order ID
   * @returns PDF blob
   */
  downloadInvoice(orderId: string): Observable<Blob> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.apiUrl}/${orderId}/download`, {
      headers,
      responseType: 'blob'
    });
  }

  /**
   * Trigger browser download of PDF file
   * 
   * @param blob PDF blob
   * @param filename Filename for download
   */
  triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
