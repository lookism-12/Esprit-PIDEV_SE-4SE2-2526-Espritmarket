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
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  sourceIds?: string[];
}

interface CartItemApiResponse {
  id: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

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

  // ── List / search signals ────────────────────────────────────────────────
  searchItemId       = signal<string>('');
  feedbacks          = signal<SavFeedback[] | null>(null);
  isSearching        = signal<boolean>(false);
  hasSearched        = signal<boolean>(false);
  myFeedbacks        = signal<SavFeedback[]>([]);
  isLoadingMyFeedbacks = signal<boolean>(false);
  myFeedbacksError   = signal<string | null>(null);

  // ── Form / submit signals ────────────────────────────────────────────────
  showCreateForm = signal<boolean>(false);
  editingFeedback = signal<SavFeedback | null>(null);
  isSubmitting   = signal<boolean>(false);
  successMsg     = signal<string | null>(null);
  errorMsg       = signal<string | null>(null);

  // ── Image upload signals ─────────────────────────────────────────────────
  selectedImageFile = signal<File | null>(null);
  imagePreviewUrl   = signal<string | null>(null);
  imageError        = signal<string | null>(null);

  // ── Cart items signals ───────────────────────────────────────────────────
  cartItems          = signal<CartItemOption[]>([]);
  private allPurchasedItems = signal<CartItemOption[]>([]);
  isLoadingCartItems = signal<boolean>(false);
  cartItemsError     = signal<string | null>(null);

  feedbackForm: FormGroup;
  ratingArray = [1, 2, 3, 4, 5];

  complaintNatures = [
    { value: 'MISSING_ITEM', label: 'Missing item' },
    { value: 'DAMAGED',      label: 'Damaged item' },
    { value: 'WRONG_ITEM',   label: 'Wrong item received' },
    { value: 'OTHER',        label: 'Other issue' }
  ];

  desiredSolutions = [
    { value: 'REFUND',    label: 'Refund' },
    { value: 'RESHIP',    label: 'Reship' },
    { value: 'VOUCHER',   label: 'Store voucher' },
    { value: 'EXCHANGE',  label: 'Exchange' }
  ];

  priorityOptions: { value: FeedbackPriority; label: string; className: string }[] = [
    { value: 'LOW',      label: 'Low',      className: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    { value: 'MODERATE', label: 'Moderate', className: 'bg-amber-100 text-amber-700 border-amber-300' },
    { value: 'URGENT',   label: 'Urgent',   className: 'bg-red-100 text-red-700 border-red-300' }
  ];

  positiveTagOptions = ['Quality', 'Delivery', 'Packaging', 'Service', 'Value for money'];

  statusMap: Record<FeedbackStatus, { label: string; color: string }> = {
    PENDING:       { label: 'Pending',       color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    INVESTIGATING: { label: 'Investigating', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    RESOLVED:      { label: 'Resolved',      color: 'bg-green-100 text-green-800 border-green-200' },
    REJECTED:      { label: 'Rejected',      color: 'bg-rose-100 text-rose-800 border-rose-200' },
    ARCHIVED:      { label: 'Archived',      color: 'bg-gray-100 text-gray-700 border-gray-200' }
  };

  constructor() {
    this.feedbackForm = this.fb.group({
      cartItemId:       ['', [Validators.required, Validators.minLength(3)]],
      type:             ['SAV' as FeedbackType, Validators.required],
      rating:           [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      reason:           ['', Validators.maxLength(200)],
      message:          ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      problemNature:    ['MISSING_ITEM'],
      priority:         ['MODERATE'],
      desiredSolution:  ['REFUND'],
      positiveTags:     [[]],
      recommendsProduct:[true]
    });
    this.loadMyCartItems();
    this.setupTypeRules();
  }

  // ── Type rules ───────────────────────────────────────────────────────────

  private setupTypeRules(): void {
    this.feedbackForm.get('type')?.valueChanges.subscribe(() => this.applyTypeRules());
    this.applyTypeRules();
  }

  private applyTypeRules(): void {
    const isComplaint = this.isComplaintType();
    const messageCtrl         = this.feedbackForm.get('message');
    const ratingCtrl          = this.feedbackForm.get('rating');
    const problemNatureCtrl   = this.feedbackForm.get('problemNature');
    const priorityCtrl        = this.feedbackForm.get('priority');
    const desiredSolutionCtrl = this.feedbackForm.get('desiredSolution');

    messageCtrl?.setValidators([Validators.required, Validators.minLength(10),
      Validators.maxLength(isComplaint ? 500 : 300)]);

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

    [messageCtrl, ratingCtrl, problemNatureCtrl, priorityCtrl, desiredSolutionCtrl]
      .forEach(c => c?.updateValueAndValidity({ emitEvent: false }));
  }

  // ── Cart items loading ───────────────────────────────────────────────────

  private loadMyCartItems(): void {
    this.isLoadingCartItems.set(true);
    this.cartItemsError.set(null);
    this.http.get<CartItemApiResponse[]>(`${environment.apiUrl}/cart-items/my-purchased`).subscribe({
      next: (items) => {
        const mapped = (items ?? []).map(item => ({
          id:        item.id,
          productId: item.productId,
          name:      item.productName || 'Unnamed product',
          quantity:  item.quantity ?? 1,
          unitPrice: item.unitPrice ?? 0
        }));
        this.allPurchasedItems.set(mapped);
        this.cartItems.set(this.dedupeOrderedItems(mapped));
        this.loadMyFeedbacks(mapped);
        this.isLoadingCartItems.set(false);
      },
      error: (err) => {
        console.error('Failed to load purchased items:', err);
        this.cartItems.set([]);
        this.allPurchasedItems.set([]);
        this.myFeedbacks.set([]);
        this.cartItemsError.set('Unable to load your ordered items right now.');
        this.isLoadingCartItems.set(false);
      }
    });
  }

  private dedupeOrderedItems(items: CartItemOption[]): CartItemOption[] {
    const byProduct = new Map<string, CartItemOption>();
    for (const item of items) {
      const key = this.orderedItemKey(item);
      const existing = byProduct.get(key);
      if (existing) {
        existing.quantity += item.quantity || 0;
        existing.sourceIds = [...(existing.sourceIds || [existing.id]), item.id];
      } else {
        byProduct.set(key, { ...item, sourceIds: [item.id] });
      }
    }
    return Array.from(byProduct.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  private orderedItemKey(item: CartItemOption): string {
    const productKey = item.productId || item.name;
    return `${productKey}`.toLowerCase().trim() + `|${Number(item.unitPrice || 0).toFixed(2)}`;
  }

  private loadMyFeedbacks(items: CartItemOption[]): void {
    if (!items.length) { this.myFeedbacks.set([]); return; }
    this.isLoadingMyFeedbacks.set(true);
    this.myFeedbacksError.set(null);
    const calls = items.map(item => this.savService.getFeedbacksByCartItem(item.id));
    forkJoin(calls).pipe(finalize(() => this.isLoadingMyFeedbacks.set(false))).subscribe({
      next: (groups) => {
        const byId = new Map<string, SavFeedback>();
        for (const fb of (groups ?? []).flat()) byId.set(fb.id, fb);
        const sorted = Array.from(byId.values()).sort(
          (a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()
        );
        this.myFeedbacks.set(sorted);
      },
      error: () => {
        this.myFeedbacks.set([]);
        this.myFeedbacksError.set('Unable to load your requests right now.');
      }
    });
  }

  // ── Image upload ─────────────────────────────────────────────────────────

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0] ?? null;
    this.imageError.set(null);

    if (!file) return;

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      this.imageError.set('Only JPG, JPEG, PNG or WEBP files are allowed.');
      input.value = '';
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      this.imageError.set('Image size must not exceed 5 MB.');
      input.value = '';
      return;
    }

    this.selectedImageFile.set(file);
    const reader = new FileReader();
    reader.onload = () => this.imagePreviewUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedImageFile.set(null);
    this.imagePreviewUrl.set(null);
    this.imageError.set(null);
  }

  // ── Search / track ───────────────────────────────────────────────────────

  trackFeedback(): void {
    const q = this.searchItemId().trim();
    if (!q) return;
    this.errorMsg.set(null);
    const displayCartItemId = this.toDisplayCartItemId(q);
    const selectedItem = this.cartItems().find(item => item.id === displayCartItemId);
    if (!selectedItem) {
      this.errorMsg.set('Please use an item from your orders.');
      this.hasSearched.set(true);
      this.feedbacks.set([]);
      return;
    }
    this.hasSearched.set(true);
    this.isSearching.set(true);
    const sourceIds = selectedItem.sourceIds?.length ? selectedItem.sourceIds : [selectedItem.id];
    forkJoin(sourceIds.map(id => this.savService.getFeedbacksByCartItem(id))).subscribe({
      next: (groups) => {
        const byId = new Map<string, SavFeedback>();
        for (const feedback of (groups ?? []).flat()) byId.set(feedback.id, feedback);
        this.feedbacks.set(Array.from(byId.values()).sort(
          (a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()
        ));
        this.isSearching.set(false);
      },
      error: () => { this.feedbacks.set([]); this.isSearching.set(false); }
    });
  }

  clearSearch(): void {
    this.searchItemId.set('');
    this.feedbacks.set(null);
    this.hasSearched.set(false);
    this.errorMsg.set(null);
  }

  // ── Form toggle / edit ───────────────────────────────────────────────────

  toggleMode(): void {
    if (this.showCreateForm()) {
      this.editingFeedback.set(null);
      this.resetForm();
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
      cartItemId:       this.toDisplayCartItemId(feedback.cartItemId),
      type:             feedback.type,
      rating:           feedback.rating,
      reason:           feedback.reason || '',
      message:          feedback.message,
      problemNature:    feedback.problemNature || 'MISSING_ITEM',
      priority:         feedback.priority || 'MODERATE',
      desiredSolution:  feedback.desiredSolution || 'REFUND',
      positiveTags:     feedback.positiveTags || [],
      recommendsProduct: feedback.recommendsProduct ?? true
    });
    this.applyTypeRules();
    this.removeImage();
    this.successMsg.set(null);
    this.errorMsg.set(null);
  }

  removePending(feedback: SavFeedback): void {
    if (feedback.status !== 'PENDING') {
      this.errorMsg.set('Only pending requests can be deleted.');
      return;
    }
    if (!confirm('Delete this pending request?')) return;
    this.savService.deleteFeedback(feedback.id).subscribe({
      next: () => {
        this.successMsg.set('Request deleted successfully.');
        this.loadMyFeedbacks(this.allPurchasedItems());
        if (this.hasSearched() && this.searchItemId().trim()) this.trackFeedback();
      },
      error: () => this.errorMsg.set('Unable to delete this request right now.')
    });
  }

  // ── Submit ───────────────────────────────────────────────────────────────

  submitFeedback(): void {
    if (this.feedbackForm.invalid) { 
      this.feedbackForm.markAllAsTouched(); 
      this.errorMsg.set('Please fill in all required fields correctly.');
      return; 
    }

    // Image required for claims (SAV), optional for feedback
    if (this.isComplaintType() && !this.selectedImageFile() && !this.editingFeedback()) {
      this.imageError.set('Please upload a product image.');
      this.errorMsg.set('Please upload a product image.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMsg.set(null);
    this.imageError.set(null);

    if (this.editingFeedback()) {
      // Edit → keep existing JSON endpoint (image not re-uploaded)
      const payload: SavFeedbackRequest = this.buildJsonPayload();
      this.savService.updateFeedback(this.editingFeedback()!.id, payload).subscribe({
        next: () => this.onSubmitSuccess(true),
        error: () => this.onSubmitError()
      });
    } else {
      // Create → use multipart endpoint
      const fd = this.buildFormData();
      this.http.post<SavFeedback>(`${environment.apiUrl}/sav-feedbacks/with-image`, fd).subscribe({
        next: () => this.onSubmitSuccess(false),
        error: () => this.onSubmitError()
      });
    }
  }

  private onSubmitSuccess(isEdit: boolean): void {
    this.isSubmitting.set(false);
    const isComplaint = this.isComplaintType();
    if (isEdit) {
      this.successMsg.set('Your request has been updated successfully.');
    } else {
      this.successMsg.set(
        isComplaint
          ? 'Your claim has been submitted successfully.'
          : 'Your feedback has been submitted successfully.'
      );
    }
    this.editingFeedback.set(null);
    this.resetForm();
    this.loadMyFeedbacks(this.allPurchasedItems());
    setTimeout(() => this.toggleMode(), 1500);
  }

  private onSubmitError(): void {
    this.isSubmitting.set(false);
    this.errorMsg.set('Unable to submit your request. Please try again.');
  }

  private resetForm(): void {
    this.feedbackForm.reset({
      cartItemId: '', type: 'SAV', rating: 5, reason: '', message: '',
      problemNature: 'MISSING_ITEM', priority: 'MODERATE', desiredSolution: 'REFUND',
      positiveTags: [], recommendsProduct: true
    });
    this.applyTypeRules();
    this.removeImage();
  }

  private buildFormData(): FormData {
    const v           = this.feedbackForm.getRawValue();
    const isComplaint = this.isComplaintType();
    const fd          = new FormData();
    const cartItemId  = this.toPayloadCartItemId(v.cartItemId);

    fd.append('type',       v.type);
    fd.append('cartItemId', cartItemId);
    fd.append('message',    v.message);
    fd.append('rating',     String(isComplaint ? 3 : Number(v.rating || 5)));
    if (v.reason) fd.append('reason', v.reason);

    if (isComplaint) {
      if (v.problemNature)   fd.append('problemNature',   v.problemNature);
      if (v.priority)        fd.append('priority',        v.priority);
      if (v.desiredSolution) fd.append('desiredSolution', v.desiredSolution);
    } else {
      if (v.recommendsProduct !== null && v.recommendsProduct !== undefined)
        fd.append('recommendsProduct', String(v.recommendsProduct));
      (v.positiveTags as string[] || []).forEach(tag => fd.append('positiveTags', tag));
    }

    const file = this.selectedImageFile();
    if (file) fd.append('image', file);

    return fd;
  }

  private buildJsonPayload(): SavFeedbackRequest {
    const v           = this.feedbackForm.getRawValue();
    const isComplaint = v.type === 'SAV';
    const existing    = this.editingFeedback();
    const cartItemId  = this.toPayloadCartItemId(v.cartItemId);
    return {
      type:             v.type,
      cartItemId,
      reason:           v.reason || '',
      message:          v.message,
      rating:           isComplaint ? 3 : Number(v.rating || 5),
      status:           existing?.status || 'PENDING',
      problemNature:    isComplaint ? v.problemNature : undefined,
      priority:         isComplaint ? v.priority : undefined,
      desiredSolution:  isComplaint ? v.desiredSolution : undefined,
      positiveTags:     isComplaint ? [] : (v.positiveTags || []),
      recommendsProduct:isComplaint ? undefined : !!v.recommendsProduct,
      adminResponse:    existing?.adminResponse,
      readByAdmin:      existing?.readByAdmin
    };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  setRating(val: number)              { this.feedbackForm.patchValue({ rating: val }); }
  setPriority(priority: FeedbackPriority) { this.feedbackForm.patchValue({ priority }); }
  setRecommend(value: boolean)        { this.feedbackForm.patchValue({ recommendsProduct: value }); }

  togglePositiveTag(tag: string): void {
    const current = (this.feedbackForm.get('positiveTags')?.value as string[]) || [];
    const next    = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag];
    this.feedbackForm.patchValue({ positiveTags: next });
  }

  getStatusInfo(status: FeedbackStatus)  { return this.statusMap[status]; }
  isComplaintType(): boolean             { return this.feedbackForm.get('type')?.value === 'SAV'; }
  selectedTags(): string[]               { return (this.feedbackForm.get('positiveTags')?.value as string[]) || []; }
  messageLimit(): number                 { return this.isComplaintType() ? 500 : 300; }
  messageLength(): number                { return (this.feedbackForm.get('message')?.value || '').length; }
  messageRemaining(): number             { return Math.max(0, this.messageLimit() - this.messageLength()); }
  canEdit(feedback: SavFeedback): boolean{ return feedback.status === 'PENDING'; }

  private toDisplayCartItemId(cartItemId?: string): string {
    if (!cartItemId) return '';
    const visibleItem = this.cartItems().find(item => item.id === cartItemId || item.sourceIds?.includes(cartItemId));
    return visibleItem?.id || cartItemId;
  }

  private toPayloadCartItemId(selectedCartItemId: string): string {
    const selectedItem = this.cartItems().find(item => item.id === selectedCartItemId);
    const currentFeedback = this.editingFeedback();
    if (currentFeedback?.cartItemId && selectedItem?.sourceIds?.includes(currentFeedback.cartItemId)) {
      return currentFeedback.cartItemId;
    }
    return selectedCartItemId;
  }

  displayedFeedbacks(): SavFeedback[] {
    return this.hasSearched() ? (this.feedbacks() ?? []) : this.myFeedbacks();
  }

  countFeedbacksWithAdminResponse(): number {
    return this.myFeedbacks().filter(fb => !!fb.adminResponse?.trim()).length;
  }

  timelineSteps(status: FeedbackStatus): { label: string; active: boolean }[] {
    const stages: FeedbackStatus[] = ['PENDING', 'INVESTIGATING', 'RESOLVED'];
    const current = stages.indexOf(status);
    return [
      { label: 'Submitted',     active: current >= 0 || status === 'REJECTED' || status === 'ARCHIVED' },
      { label: 'In progress',   active: current >= 1 },
      { label: status === 'REJECTED' ? 'Rejected' : 'Resolved',
        active: current >= 2 || status === 'REJECTED' || status === 'ARCHIVED' }
    ];
  }

  getRatingStars(rating: number): string {
    return '⭐'.repeat(Math.max(0, rating)) + '☆'.repeat(Math.max(0, 5 - rating));
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  getItemName(cartItemId: string | undefined): string {
    if (!cartItemId) return 'Unknown Item';
    const item = this.allPurchasedItems().find(i => i.id === cartItemId)
      || this.cartItems().find(i => i.id === cartItemId || i.sourceIds?.includes(cartItemId));
    return item ? item.name : 'Item (Load pending...)';
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.feedbackForm.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }
}
