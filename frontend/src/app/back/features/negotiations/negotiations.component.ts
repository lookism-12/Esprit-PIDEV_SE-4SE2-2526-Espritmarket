import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NegotiationService } from '../../../front/core/negotiation.service';
import { Negotiation } from '../../../front/models/negotiation.model';

@Component({
  selector: 'app-admin-negotiations',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './negotiations.component.html',
  styleUrl: './negotiations.component.scss'
})
export class NegotiationsComponent implements OnInit {
  allNegotiations = signal<Negotiation[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  searchQuery = signal<string>('');
  filterStatus = signal<string>('ALL');

  readonly statuses = ['ALL', 'PENDING', 'IN_PROGRESS', 'ACCEPTED', 'REJECTED', 'CANCELLED'];

  readonly negotiations = computed(() => {
    let list = this.allNegotiations();
    const q = this.searchQuery().toLowerCase().trim();
    const s = this.filterStatus();
    if (s !== 'ALL') list = list.filter(n => n.status === s);
    if (q) list = list.filter(n =>
      (n.productName || n.serviceName || '').toLowerCase().includes(q) ||
      (n.clientFullName || '').toLowerCase().includes(q) ||
      n.id.toLowerCase().includes(q)
    );
    return list;
  });

  readonly stats = computed(() => {
    const all = this.allNegotiations();
    return {
      total: all.length,
      pending: all.filter(n => n.status === 'PENDING').length,
      inProgress: all.filter(n => n.status === 'IN_PROGRESS').length,
      accepted: all.filter(n => n.status === 'ACCEPTED').length,
      rejected: all.filter(n => n.status === 'REJECTED').length,
    };
  });

  constructor(private negotiationService: NegotiationService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.negotiationService.getProviderNegotiations().subscribe({
      next: (list: any) => {
        const mapped = (list || []).map((n: any) => ({
          ...n,
          currentOffer: n.proposals?.length ? n.proposals[n.proposals.length - 1].amount : null
        }));
        this.allNegotiations.set(mapped);
        this.isLoading.set(false);
      },
      error: () => { this.error.set('Failed to load negotiations.'); this.isLoading.set(false); }
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'status-pending',
      IN_PROGRESS: 'status-inprogress',
      ACCEPTED: 'status-accepted',
      REJECTED: 'status-rejected',
      CANCELLED: 'status-cancelled',
    };
    return map[status] || 'status-default';
  }
}
