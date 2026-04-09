import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SavService } from '../../../../back/core/services/sav.service';
import {
  FeedbackPriority,
  FeedbackStatus,
  FeedbackType,
  SavFeedback,
  SavFeedbackRequest
} from '../../../../back/core/models/sav.models';
import { environment } from '../../../../../environment';
import { finalize, forkJoin } from 'rxjs';

interface CartItemOption {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface CartItemApiResponse {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

@Component({
  selector: 'app-client-feedback',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './client-feedback.component.html'
})
export class ClientFeedbackComponent {
  private savService = inject(SavService);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  searchItemId = signal<string>('');
  feedbacks = signal<SavFeedback[] | null>(null);
  isSearching = signal<boolean>(false);
  hasSearched = signal<boolean>(false);
  myFeedbacks = signal<SavFeedback[]>([]);
  isLoadingMyFeedbacks = signal<boolean>(false);
  myFeedbacksError = signal<string | null>(null);

  showCreateForm = signal<boolean>(false);
  editingFeedback = signal<SavFeedback | null>(null);
  isSubmitting = signal<boolean>(false);
  successMsg = signal<string | null>(null);
  errorMsg = signal<string | null>(null);

  feedbackForm: FormGroup;
  ratingArray = [1, 2, 3, 4, 5];

  complaintNatures = [
    { value: 'MISSING_ITEM', label: 'Article manquant' },
    { value: 'DAMAGED', label: 'Article endommage' },
    { value: 'WRONG_ITEM', label: 'Mauvais article' },
    { value: 'OTHER', label: 'Autre probleme' }
  ];

  desiredSolutions = [
    { value: 'REFUND', label: 'Remboursement' },
    { value: 'RESHIP', label: 'Renvoi' },
    { value: 'VOUCHER', label: 'Bon d achat' },
    { value: 'EXCHANGE', label: 'Echange' }
  ];

  priorityOptions: { value: FeedbackPriority; label: string; className: string }[] = [
    { value: 'LOW', label: 'Faible', className: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    { value: 'MODERATE', label: 'Modere', className: 'bg-amber-100 text-amber-700 border-amber-300' },
    { value: 'URGENT', label: 'Urgent', className: 'bg-red-100 text-red-700 border-red-300' }
  ];

  positiveTagOptions = ['Qualite', 'Livraison', 'Emballage', 'Service', 'Rapport qualite-prix'];

  cartItems = signal<CartItemOption[]>([]);
  isLoadingCartItems = signal<boolean>(false);
  cartItemsError = signal<string | null>(null);

  statusMap: Record<FeedbackStatus, { label: string; color: string }> = {
    PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    INVESTIGATING: { label: 'Investigating', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    RESOLVED: { label: 'Resolved', color: 'bg-green-100 text-green-800 border-green-200' },
    REJECTED: { label: 'Rejected', color: 'bg-rose-100 text-rose-800 border-rose-200' },
    ARCHIVED: { label: 'Archived', color: 'bg-gray-100 text-gray-700 border-gray-200' }
  };

  constructor() {
    this.feedbackForm = this.fb.group({
      cartItemId: ['', [Validators.required, Validators.minLength(3)]],
      type: ['SAV' as FeedbackType, Validators.required],
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      reason: ['', Validators.maxLength(200)],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      problemNature: ['MISSING_ITEM'],
      priority: ['MODERATE'],
      desiredSolution: ['REFUND'],
      positiveTags: [[]],
      recommendsProduct: [true]
    });
    this.loadMyCartItems();
    this.setupTypeRules();
  }

  private setupTypeRules(): void {
    this.feedbackForm.get('type')?.valueChanges.subscribe(() => this.applyTypeRules());
    this.applyTypeRules();
  }

  private applyTypeRules(): void {
    const isComplaint = this.isComplaintType();
    const messageCtrl = this.feedbackForm.get('message');
    const ratingCtrl = this.feedbackForm.get('rating');
    const problemNatureCtrl = this.feedbackForm.get('problemNature');
    const priorityCtrl = this.feedbackForm.get('priority');
    const desiredSolutionCtrl = this.feedbackForm.get('desiredSolution');

    messageCtrl?.setValidators([Validators.required, Validators.minLength(10), Validators.maxLength(isComplaint ? 500 : 300)]);

    if (isComplaint) {
      ratingCtrl?.setValue(3, { emitEvent: false });
      problemNatureCtrl?.setValidators([Validators.required]);
      priorityCtrl?.setValidators([Validators.required]);
      desiredSolutionCtrl?.setValidators([Validators.required]);
    } else {
      ratingCtrl?.setValidators([Validators.required, Validators.min(1), Validators.max(5)]);
      problemNatureCtrl?.clearValidators();
      priorityCtrl?.clearValidators();
      desiredSolutionCtrl?.clearValidators();
    }

    messageCtrl?.updateValueAndValidity({ emitEvent: false });
    ratingCtrl?.updateValueAndValidity({ emitEvent: false });
    problemNatureCtrl?.updateValueAndValidity({ emitEvent: false });
    priorityCtrl?.updateValueAndValidity({ emitEvent: false });
    desiredSolutionCtrl?.updateValueAndValidity({ emitEvent: false });
  }

  private loadMyCartItems(): void {
    this.isLoadingCartItems.set(true);
    this.cartItemsError.set(null);
    this.http.get<CartItemApiResponse[]>(`${environment.apiUrl}/cart-items/ordered`).subscribe({
      next: (items) => {
        const mapped = (items ?? []).map((item) => ({
          id: item.id,
          name: item.productName || 'Unnamed product',
          quantity: item.quantity ?? 1,
          unitPrice: item.unitPrice ?? 0
        }));
        this.cartItems.set(mapped);
        this.loadMyFeedbacks(mapped);
        this.isLoadingCartItems.set(false);
      },
      error: (err) => {
        console.error('Failed to load user cart items:', err);
        this.cartItems.set([]);
        this.myFeedbacks.set([]);
        this.cartItemsError.set('Unable to load your cart items right now.');
        this.isLoadingCartItems.set(false);
      }
    });
  }

  private loadMyFeedbacks(items: CartItemOption[]): void {
    if (!items.length) {
      this.myFeedbacks.set([]);
      return;
    }
    this.isLoadingMyFeedbacks.set(true);
    this.myFeedbacksError.set(null);
    const calls = items.map((item) => this.savService.getFeedbacksByCartItem(item.id));
    forkJoin(calls).pipe(finalize(() => this.isLoadingMyFeedbacks.set(false))).subscribe({
      next: (groups) => {
        const merged = (groups ?? []).flat();
        const byId = new Map<string, SavFeedback>();
        for (const fb of merged) byId.set(fb.id, fb);
        const sorted = Array.from(byId.values()).sort(
          (a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()
        );
        this.myFeedbacks.set(sorted);
      },
      error: () => {
        this.myFeedbacks.set([]);
        this.myFeedbacksError.set('Impossible de charger vos demandes pour le moment.');
      }
    });
  }

  trackFeedback() {
    const q = this.searchItemId().trim();
    if (!q) return;
    this.errorMsg.set(null);
    const ownsItem = this.cartItems().some((item) => item.id === q);
    if (!ownsItem) {
      this.errorMsg.set('Veuillez utiliser un article de votre panier.');
      this.hasSearched.set(true);
      this.feedbacks.set([]);
      return;
    }
    this.hasSearched.set(true);
    this.isSearching.set(true);
    this.savService.getFeedbacksByCartItem(q).subscribe({
      next: (data) => {
        const sorted = [...(data ?? [])].sort(
          (a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()
        );
        this.feedbacks.set(sorted);
        this.isSearching.set(false);
      },
      error: () => {
        this.feedbacks.set([]);
        this.isSearching.set(false);
      }
    });
  }

  toggleMode() {
    if (this.showCreateForm()) {
      this.editingFeedback.set(null);
      this.feedbackForm.reset({ cartItemId: '', type: 'SAV', rating: 5, reason: '', message: '', problemNature: 'MISSING_ITEM', priority: 'MODERATE', desiredSolution: 'REFUND', positiveTags: [], recommendsProduct: true });
      this.applyTypeRules();
    }
    this.showCreateForm.set(!this.showCreateForm());
    this.successMsg.set(null);
    this.errorMsg.set(null);
  }

  openEditPending(feedback: SavFeedback): void {
    if (feedback.status !== 'PENDING') return;
    this.editingFeedback.set(feedback);
    this.showCreateForm.set(true);
    this.feedbackForm.patchValue({
      cartItemId: feedback.cartItemId,
      type: feedback.type,
      rating: feedback.rating,
      reason: feedback.reason || '',
      message: feedback.message,
      problemNature: feedback.problemNature || 'MISSING_ITEM',
      priority: feedback.priority || 'MODERATE',
      desiredSolution: feedback.desiredSolution || 'REFUND',
      positiveTags: feedback.positiveTags || [],
      recommendsProduct: feedback.recommendsProduct ?? true
    });
    this.applyTypeRules();
    this.successMsg.set(null);
    this.errorMsg.set(null);
  }

  removePending(feedback: SavFeedback): void {
    if (feedback.status !== 'PENDING') {
      this.errorMsg.set('Seuls les avis non traites peuvent etre supprimes.');
      return;
    }
    if (!confirm('Supprimer cet avis non traite ?')) return;
    this.savService.deleteFeedback(feedback.id).subscribe({
      next: () => {
        this.successMsg.set('Avis supprime avec succes.');
        this.loadMyFeedbacks(this.cartItems());
        if (this.hasSearched() && this.searchItemId().trim()) this.trackFeedback();
      },
      error: () => this.errorMsg.set('Suppression impossible pour le moment.')
    });
  }

  setRating(val: number) { this.feedbackForm.patchValue({ rating: val }); }
  setPriority(priority: FeedbackPriority): void { this.feedbackForm.patchValue({ priority }); }

  togglePositiveTag(tag: string): void {
    const current = (this.feedbackForm.get('positiveTags')?.value as string[]) || [];
    const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
    this.feedbackForm.patchValue({ positiveTags: next });
  }

  setRecommend(value: boolean): void { this.feedbackForm.patchValue({ recommendsProduct: value }); }

  submitFeedback() {
    if (this.feedbackForm.invalid) { this.feedbackForm.markAllAsTouched(); return; }
    this.isSubmitting.set(true);
    const payload: SavFeedbackRequest = this.buildPayload();
    const save$ = this.editingFeedback()
      ? this.savService.updateFeedback(this.editingFeedback()!.id, payload)
      : this.savService.createFeedback(payload);
    save$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMsg.set(this.editingFeedback() ? 'Votre dossier a ete modifie.' : 'Votre dossier a ete soumis avec succes.');
        this.editingFeedback.set(null);
        this.feedbackForm.reset({ cartItemId: '', type: 'SAV', rating: 5, reason: '', message: '', problemNature: 'MISSING_ITEM', priority: 'MODERATE', desiredSolution: 'REFUND', positiveTags: [], recommendsProduct: true });
        this.applyTypeRules();
        this.loadMyFeedbacks(this.cartItems());
        setTimeout(() => this.toggleMode(), 1200);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMsg.set('Une erreur est survenue lors de la soumission.');
      }
    });
  }

  private buildPayload(): SavFeedbackRequest {
    const v = this.feedbackForm.getRawValue();
    const isComplaint = v.type === 'SAV';
    const existing = this.editingFeedback();
    return {
      type: v.type,
      cartItemId: v.cartItemId,
      reason: v.reason || '',
      message: v.message,
      rating: isComplaint ? 3 : Number(v.rating || 5),
      status: existing?.status || 'PENDING',
      problemNature: isComplaint ? v.problemNature : undefined,
      priority: isComplaint ? v.priority : undefined,
      desiredSolution: isComplaint ? v.desiredSolution : undefined,
      positiveTags: isComplaint ? [] : (v.positiveTags || []),
      recommendsProduct: isComplaint ? undefined : !!v.recommendsProduct,
      adminResponse: existing?.adminResponse,
      readByAdmin: existing?.readByAdmin
    };
  }

  getStatusInfo(status: FeedbackStatus) { return this.statusMap[status]; }
  isComplaintType(): boolean { return this.feedbackForm.get('type')?.value === 'SAV'; }
  selectedTags(): string[] { return (this.feedbackForm.get('positiveTags')?.value as string[]) || []; }
  messageLimit(): number { return this.isComplaintType() ? 500 : 300; }
  messageLength(): number { return (this.feedbackForm.get('message')?.value || '').length; }
  messageRemaining(): number { return Math.max(0, this.messageLimit() - this.messageLength()); }
  canEdit(feedback: SavFeedback): boolean { return feedback.status === 'PENDING'; }

  clearSearch(): void {
    this.searchItemId.set('');
    this.feedbacks.set(null);
    this.hasSearched.set(false);
    this.errorMsg.set(null);
  }

  displayedFeedbacks(): SavFeedback[] {
    return this.hasSearched() ? (this.feedbacks() ?? []) : this.myFeedbacks();
  }

  countFeedbacksWithAdminResponse(): number {
    return this.myFeedbacks().filter((fb) => !!fb.adminResponse?.trim()).length;
  }

  timelineSteps(status: FeedbackStatus): { label: string; active: boolean }[] {
    const stages: FeedbackStatus[] = ['PENDING', 'INVESTIGATING', 'RESOLVED'];
    const current = stages.indexOf(status);
    return [
      { label: 'En attente', active: current >= 0 || status === 'REJECTED' || status === 'ARCHIVED' },
      { label: 'En cours', active: current >= 1 },
      { label: status === 'REJECTED' ? 'Rejete' : 'Resolu', active: current >= 2 || status === 'REJECTED' || status === 'ARCHIVED' }
    ];
  }

  getRatingStars(rating: number): string {
    return '⭐'.repeat(Math.max(0, rating)) + '☆'.repeat(Math.max(0, 5 - rating));
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.feedbackForm.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }
}
