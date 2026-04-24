import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NegotiationService } from '../../core/negotiation.service';
import { NegotiationResponse, NegotiationStatus } from '../../models/negotiation.model';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { UserRole } from '../../models/user.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-negotiations',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule],
  templateUrl: './negotiations.html',
  styleUrl: './negotiations.scss'
})
export class Negotiations implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private wsSub: Subscription | null = null;

  negotiations = signal<NegotiationResponse[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  selectedId = signal<string | null>(null);
  selected = signal<NegotiationResponse | null>(null);

  readonly createForm;
  readonly actionForm;

  isProvider = false;

  constructor(private negotiationService: NegotiationService, private fb: FormBuilder) {
    this.createForm = this.fb.group({
      productId: ['', Validators.required],
      proposedPrice: [0, [Validators.required, Validators.min(1)]]
    });
    this.actionForm = this.fb.group({
      newPrice: [0, [Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    const role = this.authService.userRole();
    this.isProvider = role === UserRole.PROVIDER || role === UserRole.SELLER || (role as string) === 'SELLER';
    this.loadNegotiations();
  }

  loadNegotiations(): void {
    this.isLoading.set(true);
    this.error.set(null);
    if (this.isProvider) {
      this.negotiationService.getProviderNegotiations().subscribe({
        next: (data) => { this.negotiations.set(data); this.isLoading.set(false); },
        error: () => { this.error.set('Failed to load negotiations.'); this.isLoading.set(false); }
      });
    } else {
      this.negotiationService.getAll().subscribe({
        next: (res) => { this.negotiations.set(res.negotiations); this.isLoading.set(false); },
        error: () => { this.error.set('Failed to load negotiations.'); this.isLoading.set(false); }
      });
    }
  }

  loadNegotiationDetails(): void {
    const id = this.selectedId();
    if (!id) return;
    this.isLoading.set(true);
    this.negotiationService.getNegotiationById(id).subscribe({
      next: (response) => { this.selected.set(response); this.isLoading.set(false); },
      error: (err) => { this.error.set('Failed to load negotiation details.'); this.isLoading.set(false); console.error(err); }
    });
  }

  createNegotiation(): void {
    if (this.createForm.invalid) return;
    this.negotiationService.createNegotiation(this.createForm.getRawValue() as any).subscribe({
      next: (created) => {
        this.negotiations.update((items) => [created, ...items]);
        this.selectedId.set(created.id);
        this.selected.set(created);
        this.createForm.reset({ productId: '', proposedPrice: 0 });
      },
      error: (err) => this.error.set(err?.error?.message ?? 'Failed to create negotiation')
    });
  }

  loadById(id: string): void {
    this.selectedId.set(id);
    this.loadNegotiationDetails();

    // Subscribe to real-time updates for this negotiation
    this.wsSub?.unsubscribe();
    this.wsSub = this.negotiationService.connectToNegotiation(id).subscribe(updated => {
      this.selected.set(updated);
      this.negotiations.update(items => items.map(n => n.id === updated.id ? updated : n));
    });
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    this.negotiationService.disconnect();
  }

  applyAction(action: 'ACCEPT' | 'REJECT' | 'COUNTER'): void {
    const current = this.selected();
    if (!current) return;
    const payload: any = { action };
    if (action === 'COUNTER') payload.newPrice = this.actionForm.getRawValue().newPrice;
    this.negotiationService.updateNegotiation(current.id, payload).subscribe({
      next: (updated) => {
        this.selected.set(updated);
        this.negotiations.update((items) => items.map((n) => (n.id === updated.id ? updated : n)));
      },
      error: (err) => this.error.set(err?.error?.message ?? 'Negotiation update failed')
    });
  }

  closeNegotiation(): void {
    const current = this.selected();
    if (!current) return;
    this.negotiationService.closeNegotiation(current.id).subscribe({
      next: () => this.selected.update((n) => (n ? { ...n, status: NegotiationStatus.CLOSED } : n)),
      error: (err) => this.error.set(err?.error?.message ?? 'Failed to close negotiation')
    });
  }

  getStatusClass(status: string): string {
    if (status === 'PENDING') return 'status-pending';
    if (status === 'ACCEPTED') return 'status-accepted';
    if (status === 'REJECTED') return 'status-rejected';
    if (status === 'CLOSED') return 'status-cancelled';
    return 'status-default';
  }
}
