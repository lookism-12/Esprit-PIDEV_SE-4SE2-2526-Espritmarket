import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SavService } from '../../../back/core/services/sav.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../../back/core/services/toast.service';
import { Delivery } from '../../../back/core/models/sav.models';

@Component({
  selector: 'app-driver-deliveries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './driver-deliveries.component.html'
})
export class DriverDeliveriesComponent implements OnInit, OnDestroy {
  private savService = inject(SavService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  readonly myUserId = signal<string>('');
  readonly isLoading = signal<boolean>(true);
  
  // Data lists
  readonly pendingDeliveries = signal<Delivery[]>([]);
  readonly activeDeliveries = signal<Delivery[]>([]);
  readonly historyDeliveries = signal<Delivery[]>([]);

  // Computed counters
  readonly notifCount = computed(() => this.pendingDeliveries().length);
  readonly activeCount = computed(() => this.activeDeliveries().length);

  // Modals state
  readonly isDeclineModalOpen = signal<boolean>(false);
  readonly isDeliverModalOpen = signal<boolean>(false);
  readonly isReturnModalOpen = signal<boolean>(false);
  readonly selectedDelivery = signal<Delivery | null>(null);
  readonly selectedDeclineReason = signal<string>('');
  readonly selectedReturnReason = signal<string>('');

  private pollingInterval: any;

  ngOnInit() {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.toastService.error('User not logged in.');
      this.isLoading.set(false);
      return;
    }
    this.myUserId.set(userId);
    this.loadAllData();
    
    // Poll every 15 seconds to check for new assignments
    this.pollingInterval = setInterval(() => {
      this.loadAllData(false);
    }, 15000);
  }

  ngOnDestroy() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }

  loadAllData(showLoader = true) {
    if (showLoader) this.isLoading.set(true);
    
    // 1. Get Pending assignments
    this.savService.getPendingForDriver(this.myUserId()).subscribe({
      next: (data) => this.pendingDeliveries.set(data),
      error: () => console.error('Failed to load pending deliveries')
    });

    // 2. Get All User deliveries to filter Active vs History
    this.savService.getDeliveriesByUser(this.myUserId()).subscribe({
      next: (data) => {
        this.activeDeliveries.set(data.filter(d => d.status === 'IN_TRANSIT'));
        this.historyDeliveries.set(data.filter(d => d.status === 'DELIVERED' || d.status === 'RETURNED').sort((a,b) => {
          return new Date(b.deliveryDate || 0).getTime() - new Date(a.deliveryDate || 0).getTime();
        }));
        if (showLoader) this.isLoading.set(false);
      },
      error: () => {
        if (showLoader) this.isLoading.set(false);
      }
    });
  }

  formatOrderNumber(cartId: string, date?: string): string {
    if (!cartId) return 'ORD-UNKNOWN';
    const year = date ? new Date(date).getFullYear() : new Date().getFullYear();
    const shortHex = cartId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase();
    return `ORD-${year}-${shortHex.padStart(5, '0')}`;
  }

  // ─── Workflow Actions ──────────────────────────────────────────────────

  acceptDelivery(delivery: Delivery) {
    this.savService.respondToDelivery(delivery.id, this.myUserId(), true).subscribe({
      next: () => {
        this.toastService.success('Delivery Accepted! Added to your active list.');
        this.loadAllData();
      },
      error: () => this.toastService.error('Failed to accept delivery.')
    });
  }

  declineDelivery(delivery: Delivery) {
    this.selectedDelivery.set(delivery);
    this.selectedDeclineReason.set('');
    this.isDeclineModalOpen.set(true);
  }

  closeDeclineModal() {
    this.isDeclineModalOpen.set(false);
    this.selectedDelivery.set(null);
  }

  confirmDecline() {
    const delivery = this.selectedDelivery();
    if (!delivery) return;
    if (!this.selectedDeclineReason()) {
      this.toastService.warning('Please select a reason.');
      return;
    }

    this.savService.respondToDelivery(delivery.id, this.myUserId(), false, this.selectedDeclineReason()).subscribe({
      next: () => {
        this.toastService.success('Delivery Declined.');
        this.closeDeclineModal();
        this.loadAllData();
      },
      error: () => this.toastService.error('Failed to decline delivery.')
    });
  }

  openMarkDeliveredModal(delivery: Delivery) {
    this.selectedDelivery.set(delivery);
    this.isDeliverModalOpen.set(true);
  }

  closeDeliverModal() {
    this.isDeliverModalOpen.set(false);
    this.selectedDelivery.set(null);
  }

  confirmMarkDelivered() {
    const delivery = this.selectedDelivery();
    if (!delivery) return;

    this.savService.markAsDelivered(delivery.id, this.myUserId()).subscribe({
      next: () => {
        this.toastService.success('Great job! Delivery marked as completed.');
        this.closeDeliverModal();
        this.loadAllData();
      },
      error: () => this.toastService.error('Failed to mark delivery as completed.')
    });
  }

  openMarkReturnedModal(delivery: Delivery) {
    this.selectedDelivery.set(delivery);
    this.selectedReturnReason.set('');
    this.isReturnModalOpen.set(true);
  }

  closeReturnModal() {
    this.isReturnModalOpen.set(false);
    this.selectedDelivery.set(null);
  }

  confirmMarkReturned() {
    const delivery = this.selectedDelivery();
    
    if (!delivery) {
      return;
    }
    
    if (!this.selectedReturnReason()) {
      this.toastService.warning('Please select a reason.');
      return;
    }

    // Use the correct delivery service endpoint (clean architecture)
    this.savService.markAsReturned(delivery.id, this.myUserId(), this.selectedReturnReason()).subscribe({
      next: () => {
        this.toastService.success('Delivery marked as returned. Package must be returned to shop.');
        this.closeReturnModal();
        this.loadAllData();
      },
      error: (err) => {
        this.toastService.error('Failed to mark delivery as returned: ' + (err.error?.message || err.message));
      }
    });
  }
}
