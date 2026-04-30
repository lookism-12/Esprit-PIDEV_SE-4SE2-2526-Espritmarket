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
  readonly deliverySecurityCode = signal<string>('');

  private pollingInterval: any;

  ngOnInit() {
    const userId = this.authService.userId() || this.authService.getUserId();
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

    this.savService.getDriverWorklist(this.myUserId()).subscribe({
      next: (data) => {
        this.pendingDeliveries.set(data.filter(d => d.pendingDriverId === this.myUserId()));
        this.activeDeliveries.set(data.filter(d => d.userId === this.myUserId() && (d.status === 'IN_TRANSIT' || d.status === 'PREPARING')));
        this.historyDeliveries.set(data.filter(d => d.status === 'DELIVERED' || d.status === 'RETURNED').sort((a,b) => {
          return new Date(b.deliveryDate || 0).getTime() - new Date(a.deliveryDate || 0).getTime();
        }));
        if (showLoader) this.isLoading.set(false);
      },
      error: () => {
        console.error('Failed to load driver worklist');
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
    this.deliverySecurityCode.set('');
    this.isDeliverModalOpen.set(true);
  }

  closeDeliverModal() {
    this.isDeliverModalOpen.set(false);
    this.selectedDelivery.set(null);
    this.deliverySecurityCode.set('');
  }

  confirmMarkDelivered() {
    const delivery = this.selectedDelivery();
    if (!delivery) return;
    const code = this.deliverySecurityCode().replace(/\s+/g, '');
    if (!code) {
      this.toastService.warning('Ask the client for the delivery security code.');
      return;
    }

    this.savService.markAsDelivered(delivery.id, this.myUserId(), code).subscribe({
      next: () => {
        this.toastService.success('Great job! Delivery marked as completed.');
        this.closeDeliverModal();
        this.loadAllData();
      },
      error: (err) => this.toastService.error(err.error?.message || 'Invalid code. Delivery not confirmed.')
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
