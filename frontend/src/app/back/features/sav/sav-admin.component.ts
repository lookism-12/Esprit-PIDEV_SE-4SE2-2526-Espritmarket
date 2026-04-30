import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { SavFeedback } from '../../core/models/sav.models';
import { SavAdminService, SavClaim } from '../../core/services/sav-admin.service';
import { SavService } from '../../core/services/sav.service';

type SavCaseKind = 'CLAIM' | 'FEEDBACK';
type SavCaseSource = 'PRODUCT' | 'DELIVERY_AGENT' | 'FEEDBACK';
type SourceFilter = 'ALL' | SavCaseSource;

interface SavCase {
  id: string;
  kind: SavCaseKind;
  source: SavCaseSource;
  title: string;
  message: string;
  status: string;
  priority?: string;
  reason?: string;
  problemNature?: string;
  desiredSolution?: string;
  adminResponse?: string;
  readByAdmin?: boolean;
  rating?: number;
  cartItemId?: string;
  userId?: string;
  userName?: string;
  deliveryAgentId?: string;
  deliveryAgentName?: string;
  imageUrls: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  aiDecision?: string;
  aiSimilarityScore?: number;
  aiRecommendation?: string;
  raw: SavClaim | SavFeedback;
}

@Component({
  selector: 'app-sav-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './sav-admin.component.html'
})
export class SavAdminComponent implements OnInit {
  private readonly savAdminService = inject(SavAdminService);
  private readonly savService = inject(SavService);

  readonly cases = signal<SavCase[]>([]);
  readonly selectedCase = signal<SavCase | null>(null);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly successMsg = signal<string | null>(null);
  readonly errorMsg = signal<string | null>(null);

  readonly search = signal('');
  readonly sourceFilter = signal<SourceFilter>('ALL');
  readonly statusFilter = signal('ALL');
  readonly unreadOnly = signal(false);

  readonly statusOptions = ['ALL', 'PENDING', 'INVESTIGATING', 'RESOLVED', 'REJECTED', 'ARCHIVED'];
  readonly sourceOptions: { value: SourceFilter; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'PRODUCT', label: 'Product claims' },
    { value: 'DELIVERY_AGENT', label: 'Delivery agents' },
    { value: 'FEEDBACK', label: 'Feedback' }
  ];

  adminResponse = '';
  newStatus = 'PENDING';

  readonly openCount = computed(() => this.cases().filter(item => ['PENDING', 'INVESTIGATING'].includes(item.status)).length);
  readonly urgentCount = computed(() => this.cases().filter(item => this.isHighPriority(item.priority)).length);
  readonly deliveryAgentCount = computed(() => this.cases().filter(item => item.source === 'DELIVERY_AGENT').length);
  readonly feedbackCount = computed(() => this.cases().filter(item => item.source === 'FEEDBACK').length);
  readonly unreadCount = computed(() => this.cases().filter(item => !item.readByAdmin).length);
  readonly resolvedCount = computed(() => this.cases().filter(item => item.status === 'RESOLVED').length);

  readonly visibleCases = computed(() => {
    const query = this.normalize(this.search());
    return this.cases().filter(item => {
      const sourceOk = this.sourceFilter() === 'ALL' || item.source === this.sourceFilter();
      const statusOk = this.statusFilter() === 'ALL' || item.status === this.statusFilter();
      const unreadOk = !this.unreadOnly() || !item.readByAdmin;
      const haystack = this.normalize([
        item.title,
        item.message,
        item.reason,
        item.problemNature,
        item.userName,
        item.userId,
        item.deliveryAgentName,
        item.cartItemId
      ].filter(Boolean).join(' '));
      return sourceOk && statusOk && unreadOk && (!query || haystack.includes(query));
    });
  });

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);
    const selectedId = this.selectedCase()?.id;
    let hasPartialError = false;

    forkJoin({
      claims: this.savAdminService.getAllSavClaims().pipe(catchError(() => {
        hasPartialError = true;
        return of([] as SavClaim[]);
      })),
      feedbacks: this.savService.getFeedbacksByType('FEEDBACK').pipe(catchError(() => {
        hasPartialError = true;
        return of([] as SavFeedback[]);
      }))
    }).pipe(finalize(() => this.isLoading.set(false))).subscribe(({ claims, feedbacks }) => {
      const normalized = this.dedupeCases([
        ...claims.map(claim => this.fromClaim(claim)),
        ...feedbacks.map(feedback => this.fromFeedback(feedback))
      ]).sort((a, b) => this.sortWeight(b) - this.sortWeight(a));

      this.cases.set(normalized);
      this.restoreSelection(selectedId);
      if (hasPartialError) {
        this.errorMsg.set('Some SAV data could not be loaded. The available cases are shown.');
      }
    });
  }

  setSourceFilter(value: SourceFilter): void {
    this.sourceFilter.set(value);
    this.ensureVisibleSelection();
  }

  setStatusFilter(value: string): void {
    this.statusFilter.set(value);
    this.ensureVisibleSelection();
  }

  selectCase(item: SavCase): void {
    this.selectedCase.set(item);
    this.adminResponse = item.adminResponse || '';
    this.newStatus = item.status || 'PENDING';
  }

  saveSelectedCase(): void {
    const item = this.selectedCase();
    if (!item) return;

    const calls: Observable<unknown>[] = [];
    if (this.newStatus && this.newStatus !== item.status) {
      calls.push(item.kind === 'CLAIM'
        ? this.savAdminService.updateClaimStatus(item.id, this.newStatus)
        : this.savService.updateFeedbackStatus(item.id, this.newStatus));
    }

    const nextResponse = this.adminResponse.trim();
    const previousResponse = (item.adminResponse || '').trim();
    if (nextResponse !== previousResponse) {
      calls.push(item.kind === 'CLAIM'
        ? this.savAdminService.sendAdminResponse(item.id, nextResponse)
        : this.savService.updateAdminResponse(item.id, nextResponse));
    }

    if (!calls.length) {
      this.successMsg.set('No changes to save.');
      this.clearSuccessLater();
      return;
    }

    this.isSaving.set(true);
    this.errorMsg.set(null);
    forkJoin(calls).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.successMsg.set('SAV case updated.');
        this.clearSuccessLater();
        this.loadAll();
      },
      error: () => this.errorMsg.set('Unable to update this SAV case right now.')
    });
  }

  quickStatus(status: string): void {
    this.newStatus = status;
    this.saveSelectedCase();
  }

  isSelected(item: SavCase): boolean {
    return this.selectedCase()?.id === item.id && this.selectedCase()?.kind === item.kind;
  }

  getSourceLabel(item: SavCase): string {
    if (item.source === 'DELIVERY_AGENT') return 'Delivery agent';
    if (item.source === 'FEEDBACK') return 'Feedback';
    return 'Product claim';
  }

  getSourceBadgeClass(item: SavCase): string {
    if (item.source === 'DELIVERY_AGENT') return 'bg-sky-50 text-sky-700 border-sky-100';
    if (item.source === 'FEEDBACK') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    return 'bg-amber-50 text-amber-700 border-amber-100';
  }

  getStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'INVESTIGATING': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'RESOLVED': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'REJECTED': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }

  getPriorityBadgeClass(priority?: string): string {
    const value = (priority || '').toUpperCase();
    if (value === 'URGENT' || value === 'HIGH') return 'bg-rose-50 text-rose-700 border-rose-100';
    if (value === 'MODERATE' || value === 'MEDIUM') return 'bg-orange-50 text-orange-700 border-orange-100';
    if (value === 'LOW') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    return 'bg-gray-50 text-gray-600 border-gray-100';
  }

  getAiBadgeClass(decision?: string): string {
    switch (decision) {
      case 'MATCH': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'UNCERTAIN': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'MISMATCH': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  }

  getInitials(item: SavCase): string {
    const source = item.userName || item.userId || item.title || 'SAV';
    return source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'S';
  }

  formatDate(value?: string | Date): string {
    if (!value) return 'No date';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'No date';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  private fromClaim(claim: SavClaim): SavCase {
    const isDeliveryAgent = claim.targetType === 'DELIVERY_AGENT';
    return {
      id: claim.id || '',
      kind: 'CLAIM',
      source: isDeliveryAgent ? 'DELIVERY_AGENT' : 'PRODUCT',
      title: isDeliveryAgent
        ? `Delivery agent claim${claim.deliveryAgentName ? `: ${claim.deliveryAgentName}` : ''}`
        : claim.reason || claim.problemNature || 'Product claim',
      message: claim.message || '',
      status: claim.status || 'PENDING',
      priority: claim.priority,
      reason: claim.reason,
      problemNature: claim.problemNature,
      desiredSolution: claim.desiredSolution,
      adminResponse: claim.adminResponse,
      readByAdmin: claim.readByAdmin,
      rating: claim.rating,
      cartItemId: claim.cartItemId,
      userId: claim.userId,
      userName: claim.userName,
      deliveryAgentId: claim.deliveryAgentId,
      deliveryAgentName: claim.deliveryAgentName,
      imageUrls: claim.imageUrls || [],
      createdAt: claim.creationDate,
      updatedAt: claim.lastUpdatedDate,
      aiDecision: claim.aiDecision,
      aiSimilarityScore: claim.aiSimilarityScore,
      aiRecommendation: claim.aiRecommendation,
      raw: claim
    };
  }

  private fromFeedback(feedback: SavFeedback): SavCase {
    const isFeedback = feedback.type === 'FEEDBACK';
    return {
      id: feedback.id,
      kind: 'FEEDBACK',
      source: isFeedback ? 'FEEDBACK' : 'PRODUCT',
      title: isFeedback ? 'Customer feedback' : feedback.reason || feedback.problemNature || 'Product claim',
      message: feedback.message || '',
      status: feedback.status || 'PENDING',
      priority: feedback.priority,
      reason: feedback.reason,
      problemNature: feedback.problemNature,
      desiredSolution: feedback.desiredSolution,
      adminResponse: feedback.adminResponse,
      readByAdmin: feedback.readByAdmin,
      rating: feedback.rating,
      cartItemId: feedback.cartItemId,
      imageUrls: feedback.imageUrls || [],
      createdAt: feedback.creationDate,
      raw: feedback
    };
  }

  private restoreSelection(selectedId?: string): void {
    const next = (selectedId && this.cases().find(item => item.id === selectedId)) || this.visibleCases()[0] || this.cases()[0] || null;
    if (next) this.selectCase(next);
    else this.selectedCase.set(null);
  }

  private dedupeCases(items: SavCase[]): SavCase[] {
    const byKey = new Map<string, SavCase>();
    for (const item of items) {
      const key = item.id
        ? item.id
        : this.normalize([item.kind, item.source, item.cartItemId, item.message, item.createdAt].filter(Boolean).join('|'));
      const existing = byKey.get(key);
      if (!existing || this.sortWeight(item) > this.sortWeight(existing)) {
        byKey.set(key, item);
      }
    }
    return Array.from(byKey.values());
  }

  private ensureVisibleSelection(): void {
    const selected = this.selectedCase();
    if (!selected || this.visibleCases().some(item => item.id === selected.id && item.kind === selected.kind)) return;
    const next = this.visibleCases()[0] || null;
    if (next) this.selectCase(next);
    else this.selectedCase.set(null);
  }

  private sortWeight(item: SavCase): number {
    const openWeight = item.status === 'PENDING' ? 6000000000000 : item.status === 'INVESTIGATING' ? 5000000000000 : 0;
    const priorityWeight = this.priorityValue(item.priority) * 100000000000;
    return openWeight + priorityWeight + this.timestamp(item.createdAt);
  }

  private timestamp(value?: string | Date): number {
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
  }

  private priorityValue(priority?: string): number {
    const value = (priority || '').toUpperCase();
    if (value === 'URGENT') return 4;
    if (value === 'HIGH') return 3;
    if (value === 'MODERATE' || value === 'MEDIUM') return 2;
    if (value === 'LOW') return 1;
    return 0;
  }

  private isHighPriority(priority?: string): boolean {
    const value = (priority || '').toUpperCase();
    return value === 'URGENT' || value === 'HIGH';
  }

  private normalize(value: string): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private clearSuccessLater(): void {
    setTimeout(() => this.successMsg.set(null), 2500);
  }
}
