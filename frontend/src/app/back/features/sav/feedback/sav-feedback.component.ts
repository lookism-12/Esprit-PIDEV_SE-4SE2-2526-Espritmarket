import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SavService } from '../../../core/services/sav.service';
import { SavFeedback, SavFeedbackRequest, FeedbackType, FeedbackStatus } from '../../../core/models/sav.models';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-sav-feedback',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalComponent],
    templateUrl: './sav-feedback.component.html'
})
export class SavFeedbackComponent implements OnInit {
    feedbacks: SavFeedback[] = [];
    filtered: SavFeedback[] = [];

    selectedFeedback: SavFeedback | null = null;
    showFormModal = false;
    showDeleteModal = false;
    showStatusModal = false;
    isEditMode = false;
    isLoading = false;
    formSubmitted = false;

    searchTerm = '';
    statusFilter = '';
    typeFilter = '';
    priorityFilter = '';
    dateFilter = '';
    showArchivesOnly = false;
    newStatus = '';
    activeResponseId = '';
    adminResponseDraft = '';

    readonly feedbackTypes: FeedbackType[] = ['SAV', 'FEEDBACK'];
    readonly statusOptions: FeedbackStatus[] = ['PENDING', 'INVESTIGATING', 'RESOLVED', 'REJECTED', 'ARCHIVED'];
    readonly priorityOptions = ['LOW', 'MODERATE', 'URGENT'];
    readonly ratingArray = [1, 2, 3, 4, 5];

    feedbackForm!: FormGroup;

    constructor(
        private fb: FormBuilder,
        private savService: SavService,
        private toastService: ToastService
    ) {}

    ngOnInit(): void {
        this.buildForm();
        this.loadFeedbacks();
    }

    buildForm(): void {
        this.feedbackForm = this.fb.group({
            type: ['SAV', Validators.required],
            message: ['', [
                Validators.required,
                Validators.minLength(10),
                Validators.maxLength(500)
            ]],
            rating: [3, [
                Validators.required,
                Validators.min(1),   // mirrors @Min(1)
                Validators.max(5)    // mirrors @Max(5)
            ]],
            reason: ['', [Validators.maxLength(200)]],
            status: ['PENDING', Validators.required],
            cartItemId: ['', [
                Validators.required,
                Validators.minLength(3),
                Validators.pattern(/^[a-zA-Z0-9]+$/)
            ]]
        });
    }

    // ── Validation helpers ──────────────────────────────────────────
    get f() { return this.feedbackForm.controls; }

    fieldInvalid(field: string): boolean {
        const ctrl = this.feedbackForm.get(field);
        return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched || this.formSubmitted);
    }

    fieldValid(field: string): boolean {
        const ctrl = this.feedbackForm.get(field);
        return !!ctrl && ctrl.valid && (ctrl.dirty || ctrl.touched);
    }

    getError(field: string): string {
        const ctrl = this.feedbackForm.get(field);
        if (!ctrl || !ctrl.errors) return '';
        if (ctrl.errors['required'])   return 'Ce champ est obligatoire.';
        if (ctrl.errors['minlength'])  return `Minimum ${ctrl.errors['minlength'].requiredLength} caractères requis.`;
        if (ctrl.errors['maxlength'])  return `Maximum ${ctrl.errors['maxlength'].requiredLength} caractères autorisés.`;
        if (ctrl.errors['min'])        return `La note minimale est ${ctrl.errors['min'].min}.`;
        if (ctrl.errors['max'])        return `La note maximale est ${ctrl.errors['max'].max}.`;
        if (ctrl.errors['pattern'])    return 'Uniquement lettres et chiffres.';
        return 'Valeur invalide.';
    }

    // ── Données ─────────────────────────────────────────────────────
    loadFeedbacks(): void {
        this.isLoading = true;
        this.savService.getAllFeedbacks().subscribe({
            next: (data) => { this.feedbacks = data; this.applyFilters(); this.isLoading = false; },
            error: () => { this.toastService.error('Erreur chargement des réclamations'); this.isLoading = false; }
        });
    }

    applyFilters(): void {
        const q = this.searchTerm.toLowerCase();
        this.filtered = this.feedbacks.filter(f => {
            const matchSearch = !q || f.message.toLowerCase().includes(q)
                || (f.reason || '').toLowerCase().includes(q)
                || f.cartItemId.toLowerCase().includes(q);
            const matchStatus = !this.statusFilter || f.status === this.statusFilter;
            const matchType   = !this.typeFilter   || f.type   === this.typeFilter;
            const matchPriority = !this.priorityFilter || (f.priority || '') === this.priorityFilter;
            const matchArchiveView = this.showArchivesOnly ? f.status === 'ARCHIVED' : f.status !== 'ARCHIVED';
            const matchDate = !this.dateFilter || this.formatDateForFilter(f.creationDate) === this.dateFilter;
            return matchSearch && matchStatus && matchType && matchPriority && matchArchiveView && matchDate;
        });
    }

    private formatDateForFilter(date: string): string {
        if (!date) return '';
        const d = new Date(date);
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${month}-${day}`;
    }

    // ── Modals ──────────────────────────────────────────────────────
    openCreateModal(): void {
        this.isEditMode = false;
        this.formSubmitted = false;
        this.feedbackForm.reset({ type: 'SAV', rating: 3, status: 'PENDING' });
        this.showFormModal = true;
    }

    openEditModal(fb: SavFeedback): void {
        this.isEditMode = true;
        this.formSubmitted = false;
        this.selectedFeedback = fb;
        this.feedbackForm.patchValue({
            type: fb.type,
            message: fb.message,
            rating: fb.rating,
            reason: fb.reason,
            status: fb.status,
            cartItemId: fb.cartItemId
        });
        this.showFormModal = true;
    }

    openDeleteModal(fb: SavFeedback): void { this.selectedFeedback = fb; this.showDeleteModal = true; }

    openStatusModal(fb: SavFeedback): void {
        this.selectedFeedback = fb;
        this.newStatus = fb.status;
        this.showStatusModal = true;
    }

    openResponseEditor(fb: SavFeedback): void {
        this.activeResponseId = fb.id;
        this.adminResponseDraft = fb.adminResponse || '';
    }

    toggleResponsePanel(fb: SavFeedback): void {
        if (this.activeResponseId === fb.id) {
            this.activeResponseId = '';
            this.adminResponseDraft = '';
        } else {
            this.activeResponseId = fb.id;
            this.adminResponseDraft = fb.adminResponse || '';
        }
    }

    cancelResponseEditor(): void {
        this.activeResponseId = '';
        this.adminResponseDraft = '';
    }

    saveAdminResponse(fb: SavFeedback): void {
        if (!this.adminResponseDraft || !this.adminResponseDraft.trim()) {
            this.toastService.error('La réponse ne peut pas être vide.');
            return;
        }
        this.savService.updateFeedbackAdminResponse(fb.id, this.adminResponseDraft.trim()).subscribe({
            next: (updated) => {
                this.toastService.success('Réponse admin enregistrée ✓');
                // Update locally to avoid a full reload
                const idx = this.feedbacks.findIndex(f => f.id === fb.id);
                if (idx !== -1) {
                    this.feedbacks[idx] = { ...this.feedbacks[idx], adminResponse: this.adminResponseDraft.trim() };
                    this.applyFilters();
                }
                this.cancelResponseEditor();
            },
            error: (err) => {
                console.error('Admin response error:', err);
                const msg = err?.error?.message || err?.message || err?.statusText || 'Erreur inconnue';
                const status = err?.status || '?';
                this.toastService.error(`Erreur ${status}: ${msg}`);
            }
        });
    }

    archiveFeedback(fb: SavFeedback): void {
        const ok = confirm('Archiver cette reclamation resolue ?');
        if (!ok) return;
        this.savService.updateFeedbackStatus(fb.id, 'ARCHIVED').subscribe({
            next: () => { this.toastService.success('Reclamation archivee ✓'); this.loadFeedbacks(); },
            error: () => this.toastService.error('Erreur archivage')
        });
    }

    // ── Sauvegarde ──────────────────────────────────────────────────
    saveFeedback(): void {
        this.formSubmitted = true;
        this.feedbackForm.markAllAsTouched();

        if (this.feedbackForm.invalid) {
            this.toastService.error('Veuillez corriger les erreurs du formulaire.');
            return;
        }

        const payload: SavFeedbackRequest = this.feedbackForm.value;

        if (this.isEditMode && this.selectedFeedback) {
            this.savService.updateFeedback(this.selectedFeedback.id, payload).subscribe({
                next: () => { this.toastService.success('Réclamation modifiée ✓'); this.loadFeedbacks(); this.closeModals(); },
                error: (err) => this.toastService.error(err?.error?.message || 'Erreur mise à jour')
            });
        } else {
            this.savService.createFeedback(payload).subscribe({
                next: () => { this.toastService.success('Réclamation créée ✓'); this.loadFeedbacks(); this.closeModals(); },
                error: (err) => this.toastService.error(err?.error?.message || 'Erreur création')
            });
        }
    }

    updateStatus(): void {
        if (!this.selectedFeedback || !this.newStatus) return;
        this.savService.updateFeedbackStatus(this.selectedFeedback.id, this.newStatus).subscribe({
            next: () => { this.toastService.success('Statut mis à jour ✓'); this.loadFeedbacks(); this.closeModals(); },
            error: () => this.toastService.error('Erreur statut')
        });
    }

    confirmDelete(): void {
        if (!this.selectedFeedback) return;
        this.savService.deleteFeedback(this.selectedFeedback.id).subscribe({
            next: () => { this.toastService.success('Réclamation supprimée ✓'); this.loadFeedbacks(); this.closeModals(); },
            error: () => this.toastService.error('Erreur suppression')
        });
    }

    closeModals(): void {
        this.showFormModal = false;
        this.showDeleteModal = false;
        this.showStatusModal = false;
        this.selectedFeedback = null;
        this.formSubmitted = false;
    }

    toggleArchiveView(): void {
        this.showArchivesOnly = !this.showArchivesOnly;
        this.applyFilters();
    }

    setRating(star: number): void {
        this.feedbackForm.patchValue({ rating: star });
        this.feedbackForm.get('rating')?.markAsTouched();
    }

    // ── Stats ────────────────────────────────────────────────────────
    countByStatus(status: string): number {
        return this.feedbacks.filter(f => f.status === status).length;
    }

    // ── UI Helpers ───────────────────────────────────────────────────
    getTypeClass(type: string): string {
        return type === 'SAV' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
    }
    getTypeLabel(type: string): string {
        return type === 'SAV' ? '⚠️ Réclamation' : '💬 Feedback';
    }
    getStatusClass(status: string): string {
        const m: Record<string, string> = {
            PENDING:       'bg-yellow-100 text-yellow-800',
            INVESTIGATING: 'bg-blue-100 text-blue-800',
            RESOLVED:      'bg-green-100 text-green-800',
            REJECTED:      'bg-rose-100 text-rose-800',
            ARCHIVED:      'bg-gray-100 text-gray-700'
        };
        return m[status] || 'bg-gray-100 text-gray-800';
    }
    getStatusLabel(status: string): string {
        const m: Record<string, string> = {
            PENDING:       '🕐 En attente',
            INVESTIGATING: '🔍 En cours',
            RESOLVED:      '✅ Résolu',
            REJECTED:      '⛔ Rejete',
            ARCHIVED:      '📁 Archivé'
        };
        return m[status] || status;
    }
    isUnread(fb: SavFeedback): boolean {
        return fb.type === 'SAV' && fb.readByAdmin === false;
    }
    getRatingStars(rating: number): string {
        return '⭐'.repeat(Math.max(0, rating)) + '☆'.repeat(Math.max(0, 5 - rating));
    }
    formatDate(date: string): string {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    get formProgress(): number {
        const required = ['type', 'message', 'rating', 'status', 'cartItemId'];
        const valid = required.filter(f => this.feedbackForm.get(f)?.valid).length;
        return Math.round((valid / required.length) * 100);
    }
}
