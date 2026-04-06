import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SavService } from '../../../back/core/services/sav.service';
import { Delivery, DeliveryStatus } from '../../../back/core/models/sav.models';
import { AuthService } from '../../../core';

@Component({
  selector: 'app-driver-deliveries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './driver-deliveries.component.html'
})
export class DriverDeliveriesComponent implements OnInit {
  private savService = inject(SavService);
  private authService = inject(AuthService);

  deliveries = signal<Delivery[]>([]);
  isLoading = signal<boolean>(true);
  errorMsg = signal<string | null>(null);

  // Status mapping
  statusMap: Record<DeliveryStatus, { label: string, color: string, next: DeliveryStatus | null }> = {
    'PREPARING': { label: 'Preparing', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', next: 'IN_TRANSIT' },
    'IN_TRANSIT': { label: 'In Transit', color: 'bg-blue-100 text-blue-800 border-blue-200', next: 'DELIVERED' },
    'DELIVERED': { label: 'Delivered', color: 'bg-green-100 text-green-800 border-green-200', next: null },
    'RETURNED': { label: 'Returned', color: 'bg-red-100 text-red-800 border-red-200', next: null }
  };

  ngOnInit() {
    this.loadMyDeliveries();
  }

  loadMyDeliveries() {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.errorMsg.set('User not logged in');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.savService.getDeliveriesByUser(userId).subscribe({
      next: (data) => {
        this.deliveries.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading deliveries:', err);
        this.errorMsg.set('Unable to load your current assigned deliveries.');
        this.isLoading.set(false);
      }
    });
  }

  updateStatus(delivery: Delivery) {
    const currentStatusInfo = this.statusMap[delivery.status];
    if (!currentStatusInfo.next) return;
    
    const newStatus = currentStatusInfo.next;
    
    // Optimistic update
    const previousDeliveries = this.deliveries();
    this.deliveries.update(list => 
      list.map(d => d.id === delivery.id ? { ...d, status: newStatus } : d)
    );

    this.savService.updateDeliveryStatus(delivery.id, newStatus).subscribe({
      next: () => {
        console.log(`Status updated to: ${newStatus}`);
      },
      error: (err) => {
        console.error('Update error:', err);
        // Rollback
        this.deliveries.set(previousDeliveries);
        this.errorMsg.set('An error occurred while updating the status.');
        setTimeout(() => this.errorMsg.set(null), 3000);
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
