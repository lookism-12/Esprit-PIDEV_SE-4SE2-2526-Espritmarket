import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SavService } from '../../../../back/core/services/sav.service';
import { AuthService } from '../../../core/auth.service';
import { Delivery, DeliveryStatus } from '../../../../back/core/models/sav.models';

@Component({
  selector: 'app-client-delivery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-delivery.component.html'
})
export class ClientDeliveryComponent implements OnInit {
  deliveries = signal<Delivery[]>([]);
  isLoading = signal<boolean>(true);
  errorMsg = signal<string | null>(null);

  statusMap: Record<DeliveryStatus, { label: string; color: string; icon: string }> = {
    PREPARING: { label: 'Preparing', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '📦' },
    IN_TRANSIT: { label: 'In Transit', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '🚚' },
    DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-800 border-green-200', icon: '✅' },
    RETURNED: { label: 'Returned', color: 'bg-red-100 text-red-800 border-red-200', icon: '↩️' }
  };

  constructor(private savService: SavService, private authService: AuthService) {}

  ngOnInit() {
    const userId: string | null = this.authService.getUserId();
    if (!userId) {
      this.errorMsg.set('You must be logged in to view your deliveries.');
      this.isLoading.set(false);
      return;
    }
    this.savService.getDeliveriesByUser(userId).subscribe({
      next: (data) => { this.deliveries.set(data); this.isLoading.set(false); },
      error: () => { this.errorMsg.set('Unable to load your deliveries right now.'); this.isLoading.set(false); }
    });
  }

  getStatusInfo(status: DeliveryStatus) { return this.statusMap[status]; }

  isStepActive(status: DeliveryStatus, step: string): boolean {
    const order: DeliveryStatus[] = ['PREPARING', 'IN_TRANSIT', 'DELIVERED'];
    return order.indexOf(status) >= order.indexOf(step as DeliveryStatus);
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
