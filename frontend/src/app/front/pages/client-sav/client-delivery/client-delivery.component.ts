import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SavService } from '../../../../back/core/services/sav.service';
import { Delivery, DeliveryStatus } from '../../../../back/core/models/sav.models';

@Component({
  selector: 'app-client-delivery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-delivery.component.html'
})
export class ClientDeliveryComponent {
  private savService = inject(SavService);

  trackingNumber = signal<string>('');
  deliveries = signal<Delivery[] | null>(null);
  isLoading = signal<boolean>(false);
  hasSearched = signal<boolean>(false);

  // Status mapping
  statusMap: Record<DeliveryStatus, { label: string, color: string, icon: string, percentage: number }> = {
    'PREPARING': { label: 'Preparing', color: 'text-yellow-600', icon: '📦', percentage: 25 },
    'IN_TRANSIT': { label: 'In Transit', color: 'text-blue-600', icon: '🚚', percentage: 75 },
    'DELIVERED': { label: 'Delivered', color: 'text-green-600', icon: '🎉', percentage: 100 },
    'RETURNED': { label: 'Returned', color: 'text-red-600', icon: '↩️', percentage: 0 }
  };

  trackDelivery() {
    const q = this.trackingNumber().trim();
    if (!q) return;

    this.hasSearched.set(true);
    this.isLoading.set(true);
    
    this.savService.getDeliveriesByCart(q).subscribe({
      next: (data) => {
        this.deliveries.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Tracking error:', err);
        // Fallback to empty to show "not found"
        this.deliveries.set([]);
        this.isLoading.set(false);
      }
    });
  }

  getStatusInfo(status: DeliveryStatus) {
    return this.statusMap[status];
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
