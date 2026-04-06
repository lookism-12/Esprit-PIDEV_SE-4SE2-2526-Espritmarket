import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    ReactiveFormsModule, FormsModule, FormBuilder, FormGroup,
    Validators, AbstractControl
} from '@angular/forms';
import { SavService } from '../../../core/services/sav.service';
import { Delivery, DeliveryRequest, DeliveryStatus } from '../../../core/models/sav.models';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ToastService } from '../../../core/services/toast.service';

export type StepId = 'order' | 'address' | 'confirm';

@Component({
    selector: 'app-delivery',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalComponent],
    templateUrl: './delivery.component.html'
})
export class DeliveryComponent implements OnInit {

    // ── List & filter state ──────────────────────────────────────────
    deliveries: Delivery[] = [];
    filtered: Delivery[] = [];
    isLoading = false;
    searchTerm = '';
    statusFilter = '';

    // ── Modal states ─────────────────────────────────────────────────
    showStepper   = false;   // creation stepper
    showEditModal = false;
    showDeleteModal = false;
    showStatusModal = false;
    isSubmitting = false;

    selectedDelivery: Delivery | null = null;
    newStatus = '';

    // ── Stepper ──────────────────────────────────────────────────────
    currentStep: StepId = 'order';
    steps: { id: StepId; label: string; icon: string }[] = [
        { id: 'order',   label: 'Order',        icon: '🛒' },
        { id: 'address', label: 'Address',      icon: '📍' },
        { id: 'confirm', label: 'Confirmation', icon: '✅' }
    ];

    // ── Data sources ─────────────────────────────────────────────────
    drivers: any[] = [];
    carts: any[] = [];

    // ── Suggestions d'adresses fréquentes ────────────────────────────
    readonly addressSuggestions = [
        'Rue de la Liberté, Tunis',
        'Avenue Habib Bourguiba, Tunis',
        'Rue Ibn Khaldoun, Sfax',
        'Avenue de la République, Sousse',
        'Rue des Jasmins, Nabeul',
        'Boulevard de l\'Environnement, Monastir'
    ];
    showAddressSuggestions = false;

    // ── Forms ────────────────────────────────────────────────────────
    stepOrderForm!: FormGroup;
    stepAddressForm!: FormGroup;
    editForm!: FormGroup;
    editFormSubmitted = false;

    readonly statusOptions: DeliveryStatus[] = ['PREPARING', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'];

    constructor(
        private fb: FormBuilder,
        private savService: SavService,
        private toastService: ToastService
    ) {}

    ngOnInit(): void {
        this.buildForms();
        this.loadDeliveries();
        this.loadAgents();
        this.loadCarts();
    }

    // ── Build forms ──────────────────────────────────────────────────
    buildForms(): void {
        this.stepOrderForm = this.fb.group({
            cartId:  ['', Validators.required],
            userId:  ['', Validators.required],
            status:  ['PREPARING', Validators.required],
            deliveryDate: [null, [Validators.required]]
        });

        this.stepAddressForm = this.fb.group({
            address: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]]
        });

        this.editForm = this.fb.group({
            address:      ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
            deliveryDate: [null, [Validators.required]],
            status:       ['PREPARING', Validators.required],
            userId:       ['', Validators.required],
            cartId:       ['', Validators.required]
        });
    }

    // ── Data loading ─────────────────────────────────────────────────
    loadDeliveries(): void {
        this.isLoading = true;
        this.savService.getAllDeliveries().subscribe({
            next: (data) => { this.deliveries = data; this.applyFilters(); this.isLoading = false; },
            error: () => { this.toastService.error('Error loading deliveries'); this.isLoading = false; }
        });
    }

    loadAgents(): void {
        this.savService.getDeliveryAgents().subscribe({
            next: (users) => {
                this.drivers = users.map(u => ({
                    id: u.id,
                    name: `${u.firstName || u.username || 'Agent'} ${u.lastName || ''}`.trim(),
                    email: u.email || ''
                }));
            },
            error: (err) => console.error('Error loading drivers', err)
        });
    }

    loadCarts(): void {
        this.savService.getDeliveryCarts().subscribe({
            next: (carts) => {
                this.carts = carts.map(c => ({
                    id: c.id,
                    reference: c.reference,
                    label: c.reference ? c.reference : `Order #${c.id.slice(-6).toUpperCase()}`,
                    status: c.status,
                    userId: c.userId || '',
                    shippingAddress: c.shippingAddress || ''
                }));
            },
            error: (err) => console.error('Error loading carts', err)
        });
    }

    applyFilters(): void {
        const q = this.searchTerm.toLowerCase();
        this.filtered = this.deliveries.filter(d => {
            const matchSearch = !q
                || d.address.toLowerCase().includes(q)
                || d.userId.toLowerCase().includes(q)
                || d.cartId.toLowerCase().includes(q);
            const matchStatus = !this.statusFilter || d.status === this.statusFilter;
            return matchSearch && matchStatus;
        });
    }

    // ── Stepper navigation ───────────────────────────────────────────
    openStepper(): void {
        this.currentStep = 'order';
        this.stepOrderForm.reset({ status: 'PREPARING' });
        this.stepAddressForm.reset();
        this.showStepper = true;
    }

    closeStepper(): void {
        this.showStepper = false;
        this.currentStep = 'order';
    }

    get currentStepIndex(): number {
        return this.steps.findIndex(s => s.id === this.currentStep);
    }

    stepIsCompleted(id: StepId): boolean {
        if (id === 'order')   return this.stepOrderForm.valid;
        if (id === 'address') return this.stepAddressForm.valid;
        return false;
    }

    goNext(): void {
        if (this.currentStep === 'order') {
            this.stepOrderForm.markAllAsTouched();
            if (this.stepOrderForm.invalid) {
                this.toastService.error('Please complete the order step.');
                return;
            }

            const cartId = this.stepOrderForm.get('cartId')?.value;
            const cart = this.carts.find(c => c.id === cartId);
            
            // On tente de préremplir si l'input est vide
            if (cart && !this.stepAddressForm.get('address')?.value) {
                if (cart.userId) {
                    this.savService.getUserDetails(cart.userId).subscribe({
                        next: (user) => {
                            let autoFill = '';
                            if (user) {
                                const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown Customer';
                                const phone = user.phone || 'N/A';
                                autoFill += `Name: ${name}\nPhone: ${phone}\n`;
                            }
                            
                            // Shipping Address logic
                            if (cart.shippingAddress) {
                                autoFill += `Address: ${cart.shippingAddress}`;
                            } else if (user && user.address) {
                                autoFill += `Address: ${user.address}`;
                            } else {
                                autoFill += `Address: `;
                            }
                            
                            this.stepAddressForm.patchValue({ address: autoFill.trim() });
                            this.toastService.success('Info: Customer details auto-filled ✓');
                        },
                        error: (err) => {
                            console.log('Cannot fetch user', err);
                            // Fallback if user fetch fails
                            if (cart.shippingAddress) {
                                this.stepAddressForm.patchValue({ address: cart.shippingAddress });
                                this.toastService.success('Info: Order address auto-filled ✓');
                            }
                        }
                    });
                } else if (cart.shippingAddress) {
                    this.stepAddressForm.patchValue({ address: cart.shippingAddress });
                    this.toastService.success('Info: Order address auto-filled ✓');
                }
            }

            this.currentStep = 'address';
        } else if (this.currentStep === 'address') {
            this.stepAddressForm.markAllAsTouched();
            if (this.stepAddressForm.invalid) {
                this.toastService.error('Please enter a valid address.');
                return;
            }
            this.currentStep = 'confirm';
        }
    }

    goPrev(): void {
        if (this.currentStep === 'address') this.currentStep = 'order';
        else if (this.currentStep === 'confirm') this.currentStep = 'address';
    }

    // ── Address suggestions ───────────────────────────────────────────
    onAddressFocus(): void { this.showAddressSuggestions = true; }
    onAddressBlur(): void  { setTimeout(() => this.showAddressSuggestions = false, 200); }

    pickSuggestion(s: string): void {
        this.stepAddressForm.patchValue({ address: s });
        this.stepAddressForm.get('address')?.markAsTouched();
        this.showAddressSuggestions = false;
    }

    get filteredSuggestions(): string[] {
        const val = (this.stepAddressForm.get('address')?.value || '').toLowerCase();
        return this.addressSuggestions.filter(s => s.toLowerCase().includes(val));
    }

    // ── Summary helpers ───────────────────────────────────────────────
    get selectedCart(): any {
        return this.carts.find(c => c.id === this.stepOrderForm.get('cartId')?.value) || null;
    }
    get selectedDriver(): any {
        return this.drivers.find(d => d.id === this.stepOrderForm.get('userId')?.value) || null;
    }
    get summaryAddress(): string {
        return this.stepAddressForm.get('address')?.value || '';
    }
    get summaryDate(): string {
        const v = this.stepOrderForm.get('deliveryDate')?.value;
        return v ? this.formatDate(v) : '—';
    }
    get summaryStatus(): string {
        return this.stepOrderForm.get('status')?.value || 'PREPARING';
    }

    // ── Submit creation ───────────────────────────────────────────────
    submitDelivery(): void {
        if (this.isSubmitting) return;
        this.isSubmitting = true;

        let dDate = this.stepOrderForm.get('deliveryDate')!.value;
        if (dDate && dDate.length === 16) {
            dDate += ':00';
        }

        const payload: DeliveryRequest = {
            address:      this.stepAddressForm.get('address')!.value,
            deliveryDate: dDate,
            status:       this.stepOrderForm.get('status')!.value,
            userId:       this.stepOrderForm.get('userId')!.value,
            cartId:       this.stepOrderForm.get('cartId')!.value
        };

        this.savService.createDelivery(payload).subscribe({
            next: () => {
                this.toastService.success('Delivery created ✓');
                this.loadDeliveries();
                this.closeStepper();
                this.isSubmitting = false;
            },
            error: (err) => {
                console.error("Detailed error during creation :", err);
                const msg = err?.error?.message || err?.error?.errors?.[0]?.defaultMessage || 'Error during creation';
                this.toastService.error(msg);
                this.isSubmitting = false;
            }
        });
    }

    // ── Edit modal ────────────────────────────────────────────────────
    openEditModal(delivery: Delivery): void {
        this.selectedDelivery = delivery;
        this.editFormSubmitted = false;
        this.editForm.patchValue({
            address:      delivery.address,
            deliveryDate: delivery.deliveryDate ? delivery.deliveryDate.slice(0, 16) : null,
            status:       delivery.status,
            userId:       delivery.userId,
            cartId:       delivery.cartId
        });
        this.showEditModal = true;
    }

    saveEdit(): void {
        this.editFormSubmitted = true;
        this.editForm.markAllAsTouched();
        if (this.editForm.invalid || !this.selectedDelivery) {
            this.toastService.error('Please fix errors.');
            return;
        }
        const payload: DeliveryRequest = this.editForm.value;
        this.savService.updateDelivery(this.selectedDelivery.id, payload).subscribe({
            next: () => { this.toastService.success('Delivery updated ✓'); this.loadDeliveries(); this.closeModals(); },
            error: (err) => this.toastService.error(err?.error?.message || 'Error updating delivery')
        });
    }

    // ── Delete / Status modals ────────────────────────────────────────
    openDeleteModal(delivery: Delivery): void { this.selectedDelivery = delivery; this.showDeleteModal = true; }

    openStatusModal(delivery: Delivery): void {
        this.selectedDelivery = delivery;
        this.newStatus = delivery.status;
        this.showStatusModal = true;
    }

    updateStatus(): void {
        if (!this.selectedDelivery || !this.newStatus) return;
        this.savService.updateDeliveryStatus(this.selectedDelivery.id, this.newStatus).subscribe({
            next: () => { this.toastService.success('Status updated ✓'); this.loadDeliveries(); this.closeModals(); },
            error: () => this.toastService.error('Error updating status')
        });
    }

    confirmDelete(): void {
        if (!this.selectedDelivery) return;
        this.savService.deleteDelivery(this.selectedDelivery.id).subscribe({
            next: () => { this.toastService.success('Delivery deleted ✓'); this.loadDeliveries(); this.closeModals(); },
            error: () => this.toastService.error('Error during deletion')
        });
    }

    closeModals(): void {
        this.showEditModal   = false;
        this.showDeleteModal = false;
        this.showStatusModal = false;
        this.selectedDelivery = null;
        this.editFormSubmitted = false;
    }

    // ── Field helpers (edit form) ─────────────────────────────────────
    ef(field: string) { return this.editForm.get(field); }
    efInvalid(field: string): boolean {
        const c = this.editForm.get(field);
        return !!c && c.invalid && (c.dirty || c.touched || this.editFormSubmitted);
    }
    efValid(field: string): boolean {
        const c = this.editForm.get(field);
        return !!c && c.valid && (c.dirty || c.touched);
    }
    efError(field: string): string {
        const c = this.editForm.get(field);
        if (!c || !c.errors) return '';
        if (c.errors['required'])  return 'Required field.';
        if (c.errors['minlength']) return `Min. ${c.errors['minlength'].requiredLength} characters.`;
        if (c.errors['maxlength']) return `Max. ${c.errors['maxlength'].requiredLength} characters.`;
        if (c.errors['pastDate'])  return 'Date must be present or future.';
        return 'Invalid value.';
    }

    // ── Step field helpers ────────────────────────────────────────────
    of(field: string) { return this.stepOrderForm.get(field); }
    ofInvalid(field: string): boolean {
        const c = this.stepOrderForm.get(field);
        return !!c && c.invalid && (c.dirty || c.touched);
    }
    af(field: string) { return this.stepAddressForm.get(field); }
    afInvalid(field: string): boolean {
        const c = this.stepAddressForm.get(field);
        return !!c && c.invalid && (c.dirty || c.touched);
    }

    // ── UI helpers ────────────────────────────────────────────────────
    getStatusClass(status: string): string {
        const map: Record<string, string> = {
            PREPARING:  'status-preparing',
            IN_TRANSIT: 'status-transit',
            DELIVERED:  'status-delivered',
            RETURNED:   'status-returned'
        };
        return map[status] || 'status-default';
    }

    getStatusLabel(status: string): string {
        const map: Record<string, string> = {
            PREPARING:  '📦 Preparing',
            IN_TRANSIT: '🚚 In Transit',
            DELIVERED:  '✅ Delivered',
            RETURNED:   '↩️ Returned'
        };
        return map[status] || status;
    }

    formatDate(date: string): string {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    countByStatus(s: DeliveryStatus): number {
        return this.deliveries.filter(d => d.status === s).length;
    }

    get minDatetime(): string {
        const now = new Date();
        now.setSeconds(0, 0);
        return now.toISOString().slice(0, 16);
    }
}
