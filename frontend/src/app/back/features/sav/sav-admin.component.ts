import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SavService } from '../../core/services/sav.service';
import { SavFeedback, Delivery, DeliveryStatus } from '../../core/models/sav.models';

type Tab = 'feedbacks' | 'deliveries';
type FeedbackFilter = 'ALL' | 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED' | 'ARCHIVED';
type DeliveryFilter = 'ALL' | 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED';

@Component({
  selector: 'app-sav-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sav-admin.component.html'
})
export class SavAdminComponent implements OnInit {
  private savService = inject(SavService);

  activeTab = signal<Tab>('feedbacks');
  isLoading = signal(false);
  actionLoading = signal<string | null>(null);
  search = signal('');
  feedbackFilter = signal<FeedbackFilter>('ALL');
  deliveryFilter = signal<DeliveryFilter>('ALL');
  selectedFeedback = signal<SavFeedback | null>(null);
  adminReply = signal('');
  successMsg = signal<string | null>(null);
  errorMsg = signal<string | null>(null);

  feedbacks = signal<SavFeedback[]>([]);
  deliveries = signal<Delivery[]>([]);

  readonly feedbackStatuses: FeedbackFilter[] = ['ALL', 'PENDING', 'INVESTIGATING', 'RESOLVED', 'REJECTED', 'ARCHIVED'];
  readonly deliveryStatuses: DeliveryFilter[] = ['ALL', 'PREPARING', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'];

  filteredFeedbacks = computed(() => {
    const q = this.search().toLowerCase();
    const f = this.feedbackFilter();
    return this.feedbacks().filter(fb => {
      const matchQ = !q || fb.message.toLowerCase().includes(q) || fb.type.toLowerCase().includes(q) || fb.cartItemId.toLowerCase().includes(q);
      const matchF = f === 'ALL' || fb.status === f;
      return matchQ && matchF;
    });
  });

  filteredDeliveries = computed(() => {
    const q = this.search().toLowerCase();
    const f = this.deliveryFilter();
    return this.deliveries().filter(d => {
      const matchQ = !q || d.address.toLowerCase().includes(q) || d.userId.toLowerCase().includes(q);
      const matchF = f === 'ALL' || d.status === f;
      return matchQ && matchF;
    });
  });

  // Stats
  pendingFeedbacks = computed(() => this.feedbacks().filter(f => f.status === 'PENDING').length);
  unrepliedFeedbacks = computed(() => this.feedbacks().filter(f => !f.adminResponse?.trim()).length);
  activeDeliveries = computed(() => this.deliveries().filter(d => d.status === 'IN_TRANSIT' || d.status === 'PREPARING').length);
  deliveredCount = computed(() => this.deliveries().filter(d => d.status === 'DELIVERED').length);

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.isLoading.set(true);
    this.savService.getAllFeedbacks().subscribe({
      next: (data) => { this.feedbacks.set(data); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
    this.savService.getAllDeliveries().subscribe({
      next: (data) => this.deliveries.set(data),
      error: () => {}
    });
  }

  // ── Feedback actions ──────────────────────────────────────────────────────

  openFeedback(fb: SavFeedback): void {
    this.selectedFeedback.set(fb);
    this.adminReply.set(fb.adminResponse || '');
  }

  closeFeedback(): void { this.selectedFeedback.set(null); this.adminReply.set(''); }

  updateStatus(fb: SavFeedback, status: string): void {
    this.actionLoading.set(fb.id);
    this.savService.updateFeedbackStatus(fb.id, status).subscribe({
      next: (updated) => {
        this.feedbacks.update(list => list.map(f => f.id === fb.id ? updated : f));
        if (this.selectedFeedback()?.id === fb.id) this.selectedFeedback.set(updated);
        this.actionLoading.set(null);
        this.showSuccess('Status updated');
      },
      error: () => { this.actionLoading.set(null); this.showError('Failed to update status'); }
    });
  }

  sendReply(): void {
    const fb = this.selectedFeedback();
    const reply = this.adminReply().trim();
    if (!fb || !reply) return;
    this.actionLoading.set(fb.id);
    this.savService.updateAdminResponse(fb.id, reply).subscribe({
      next: (updated) => {
        this.feedbacks.update(list => list.map(f => f.id === fb.id ? updated : f));
        this.selectedFeedback.set(updated);
        this.actionLoading.set(null);
        this.showSuccess('Reply sent');
      },
      error: () => { this.actionLoading.set(null); this.showError('Failed to send reply'); }
    });
  }

  deleteFeedback(fb: SavFeedback): void {
    if (!confirm('Delete this feedback?')) return;
    this.actionLoading.set(fb.id);
    this.savService.deleteFeedback(fb.id).subscribe({
      next: () => {
        this.feedbacks.update(list => list.filter(f => f.id !== fb.id));
        if (this.selectedFeedback()?.id === fb.id) this.closeFeedback();
        this.actionLoading.set(null);
        this.showSuccess('Feedback deleted');
      },
      error: () => { this.actionLoading.set(null); this.showError('Failed to delete'); }
    });
  }

  // ── Delivery actions ──────────────────────────────────────────────────────

  updateDeliveryStatus(delivery: Delivery, status: DeliveryStatus): void {
    this.actionLoading.set(delivery.id);
    this.savService.updateDeliveryStatus(delivery.id, status).subscribe({
      next: (updated) => {
        this.deliveries.update(list => list.map(d => d.id === delivery.id ? updated : d));
        this.actionLoading.set(null);
        this.showSuccess('Delivery status updated');
      },
      error: () => { this.actionLoading.set(null); this.showError('Failed to update delivery'); }
    });
  }

  deleteDelivery(delivery: Delivery): void {
    if (!confirm('Delete this delivery?')) return;
    this.actionLoading.set(delivery.id);
    this.savService.deleteDelivery(delivery.id).subscribe({
      next: () => {
        this.deliveries.update(list => list.filter(d => d.id !== delivery.id));
        this.actionLoading.set(null);
        this.showSuccess('Delivery deleted');
      },
      error: () => { this.actionLoading.set(null); this.showError('Failed to delete delivery'); }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getFeedbackStatusClass(status: string): string {
    const m: Record<string, string> = {
      PENDING: 'bg-amber-100 text-amber-700',
      INVESTIGATING: 'bg-blue-100 text-blue-700',
      RESOLVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
      ARCHIVED: 'bg-gray-100 text-gray-600'
    };
    return m[status] || 'bg-gray-100 text-gray-600';
  }

  getDeliveryStatusClass(status: string): string {
    const m: Record<string, string> = {
      PREPARING: 'bg-amber-100 text-amber-700',
      IN_TRANSIT: 'bg-blue-100 text-blue-700',
      DELIVERED: 'bg-green-100 text-green-700',
      RETURNED: 'bg-red-100 text-red-700'
    };
    return m[status] || 'bg-gray-100 text-gray-600';
  }

  getNextDeliveryStatus(status: DeliveryStatus): DeliveryStatus | null {
    const flow: Record<string, DeliveryStatus | null> = {
      PREPARING: 'IN_TRANSIT', IN_TRANSIT: 'DELIVERED', DELIVERED: null, RETURNED: null
    };
    return flow[status] ?? null;
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  preview(s: string, max = 60): string {
    return s?.length > max ? s.substring(0, max) + '…' : s;
  }

  stars(n: number): string {
    return '★'.repeat(Math.max(0, n)) + '☆'.repeat(Math.max(0, 5 - n));
  }

  private showSuccess(msg: string): void { this.successMsg.set(msg); setTimeout(() => this.successMsg.set(null), 3000); }
  private showError(msg: string): void { this.errorMsg.set(msg); setTimeout(() => this.errorMsg.set(null), 3000); }
}
