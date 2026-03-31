import { Component, signal, inject, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { catchError, map, of, switchMap, throwError } from 'rxjs';
import { ServiceService, Service, ServiceRequest } from '../../../core/services/service.service';
import { ShopService } from '../../../core/services/shop.service';
import { CategoryService, Category } from '../../../core/services/category.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-service-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        <!-- Header -->
        <div class="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-accent/10 to-accent/5">
          <div>
            <h2 class="text-2xl font-black text-dark tracking-tight">{{ mode === 'add' ? 'Add Service' : 'Edit Service' }}</h2>
            <p class="text-sm text-gray-600 font-medium mt-1">Offer your services to ESPRIT students</p>
          </div>
          <button (click)="close.emit()" class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-200 text-gray-400 hover:text-dark transition-all text-2xl">&times;</button>
        </div>

        <!-- Form Content -->
        <div class="flex-1 overflow-y-auto p-8">
          <form [formGroup]="serviceForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Name -->
              <div class="col-span-2">
                <label class="block text-xs font-black text-gray-600 uppercase tracking-widest mb-2">Service Name</label>
                <input 
                  type="text" 
                  formControlName="name"
                  class="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-accent focus:bg-white rounded-2xl transition-all outline-none font-bold"
                  placeholder="e.g. Math Tutoring, Graphic Design">
                @if (isFieldInvalid('name')) {
                  <p class="text-red-500 text-xs font-bold mt-2">{{ getFieldError('name') }}</p>
                }
              </div>

              <!-- Price -->
              <div>
                <label class="block text-xs font-black text-gray-600 uppercase tracking-widest mb-2">Price (TND)</label>
                <input 
                  type="number" 
                  formControlName="price"
                  class="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-accent focus:bg-white rounded-2xl transition-all outline-none font-bold"
                  placeholder="0.00">
                @if (isFieldInvalid('price')) {
                  <p class="text-red-500 text-xs font-bold mt-2">{{ getFieldError('price') }}</p>
                }
              </div>

              <!-- Category -->
              <div>
                <label class="block text-xs font-black text-gray-600 uppercase tracking-widest mb-2">Category</label>
                <select 
                  formControlName="categoryId"
                  class="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-accent focus:bg-white rounded-2xl transition-all outline-none font-bold appearance-none">
                  <option value="">Select Category</option>
                  @for (c of categories(); track c.id) {
                    <option [value]="c.id">{{ c.name }}</option>
                  }
                </select>
                @if (categories().length === 0 && !categoriesLoading()) {
                  <p class="text-amber-600 text-xs font-bold mt-2">No categories available</p>
                }
              </div>

              <!-- Description -->
              <div class="col-span-2">
                <label class="block text-xs font-black text-gray-600 uppercase tracking-widest mb-2">Description</label>
                <textarea 
                  formControlName="description"
                  rows="4"
                  class="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-accent focus:bg-white rounded-2xl transition-all outline-none font-bold resize-none"
                  placeholder="Describe your service in detail..."></textarea>
                @if (isFieldInvalid('description')) {
                  <p class="text-red-500 text-xs font-bold mt-2">{{ getFieldError('description') }}</p>
                }
              </div>

              <!-- Image URL -->
              <div class="col-span-2">
                <label class="block text-xs font-black text-gray-600 uppercase tracking-widest mb-2">Image URL (Optional)</label>
                <input 
                  type="text" 
                  formControlName="imageUrl"
                  class="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-accent focus:bg-white rounded-2xl transition-all outline-none font-bold"
                  placeholder="https://example.com/image.jpg">
              </div>
            </div>

            <!-- Error Message -->
            @if (errorMessage()) {
              <div class="p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-3">
                <span class="text-xl">⚠️</span>
                <p class="text-xs font-bold text-red-600">{{ errorMessage() }}</p>
              </div>
            }

            <!-- Footer Buttons -->
            <div class="flex gap-4 pt-4">
              <button 
                type="button" 
                (click)="close.emit()"
                class="flex-1 px-8 py-4 border-2 border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button 
                type="submit"
                [disabled]="isSaving() || serviceForm.invalid || categoriesLoading()"
                class="flex-[2] px-8 py-4 bg-accent text-dark rounded-2xl font-bold hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl flex items-center justify-center gap-3">
                @if (isSaving()) {
                  <div class="w-5 h-5 border-2 border-dark/30 border-t-dark rounded-full animate-spin"></div>
                  <span>Processing...</span>
                } @else {
                  <span>{{ mode === 'add' ? 'Create Service' : 'Save Changes' }}</span>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class ServiceModalComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private serviceService = inject(ServiceService);
  private shopService = inject(ShopService);
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService);

  @Input() set mode(value: 'add' | 'edit') {
    console.log('🔄 Service Mode input changed to:', value);
    this._mode.set(value);
  }
  @Input() set service(value: Service | null) {
    console.log('🔄 Service input changed to:', value);
    this._service.set(value);
    if (value && this.serviceForm) {
      console.log('🔄 Service changed after form init - patching now');
      this.patchForm(value);
    }
  }
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  // Internal signals
  private _mode = signal<'add' | 'edit'>('add');
  private _service = signal<Service | null>(null);
  
  // Public getters
  get mode(): 'add' | 'edit' {
    return this._mode();
  }
  get service(): Service | null {
    return this._service();
  }

  serviceForm!: FormGroup;
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  categories = signal<Category[]>([]);
  categoriesLoading = signal(true);

  ngOnInit(): void {
    console.log('🎨 ServiceModal ngOnInit');
    console.log('📝 Mode:', this.mode);
    console.log('📦 Service:', this.service);
    this.initForm();
    this.loadCategories();
    if (this.mode === 'edit' && this.service) {
      console.log('✏️ Edit mode - Patching form with service data');
      this.patchForm(this.service);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('🔄 ServiceModal ngOnChanges', changes);
    
    if (changes['service'] && !changes['service'].firstChange && this.serviceForm) {
      const service = changes['service'].currentValue;
      console.log('🔄 Service changed (not first change):', service);
      if (service) {
        this.patchForm(service);
      }
    }
  }

  private loadCategories(): void {
    this.categoriesLoading.set(true);
    this.categoryService.getAll().subscribe({
      next: (list) => {
        this.categories.set(list || []);
        this.categoriesLoading.set(false);
      },
      error: () => {
        this.categories.set([]);
        this.categoriesLoading.set(false);
        this.errorMessage.set('Could not load categories.');
      }
    });
  }

  private initForm(): void {
    this.serviceForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: [0, [Validators.required, Validators.min(0)]],
      categoryId: [''],
      imageUrl: ['']
    });
  }

  private patchForm(s: Service): void {
    console.log('📝 Patching form with service:', s);
    
    this.serviceForm.patchValue({
      name: s.name,
      description: s.description,
      price: s.price,
      categoryId: s.categoryId || '',
      imageUrl: s.imageUrl || ''
    });
    
    console.log('✅ Form patched successfully');
  }

  private resolveShopId() {
    if (this.mode === 'edit' && this.service?.shopId) {
      return of(this.service.shopId);
    }
    const uid = this.authService.getUserId();
    if (!uid) {
      return throwError(() => new Error('Please sign in to list a service.'));
    }
    if (this.authService.isAdmin()) {
      return this.shopService.getAll().pipe(
        switchMap((shops) => {
          if (!shops?.length) {
            return throwError(() => new Error('No shop exists. Create a shop first.'));
          }
          return of(shops[0].id);
        })
      );
    }
    return this.shopService.getMyShop().pipe(
      map((s) => s.id),
      catchError((err) => {
        if (err.status === 404) {
          return this.shopService.createShop(uid).pipe(map((s) => s.id));
        }
        return throwError(() => err);
      })
    );
  }

  onSubmit(): void {
    if (this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const fv = this.serviceForm.value;

    this.resolveShopId()
      .pipe(
        switchMap((shopId) => {
          const request: ServiceRequest = {
            name: fv.name,
            description: fv.description,
            price: fv.price,
            shopId,
            categoryId: fv.categoryId || undefined,
            imageUrl: fv.imageUrl || undefined
          };
          return this.mode === 'add'
            ? this.serviceService.createService(request)
            : this.serviceService.updateService(this.service!.id, request);
        })
      )
      .subscribe({
        next: () => {
          console.log('✅ ========================================');
          console.log('✅ SERVICE SAVED SUCCESSFULLY');
          console.log('✅ ========================================');
          this.isSaving.set(false);
          this.save.emit();
          this.close.emit();
        },
        error: (err: unknown) => {
          this.isSaving.set(false);
          const msg =
            err instanceof Error
              ? err.message
              : (err as { error?: { message?: string }; message?: string })?.error?.message ||
                (err as { message?: string })?.message ||
                'Failed to save service. Please try again.';
          this.errorMessage.set(msg);
          console.error('❌ ========================================');
          console.error('❌ ERROR SAVING SERVICE');
          console.error('❌ ========================================');
          console.error('❌ Error:', err);
        }
      });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.serviceForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.serviceForm.get(fieldName);
    if (!field?.errors) return '';
    if (field.errors['required']) return 'Required field';
    if (field.errors['minlength']) return `Too short (min ${field.errors['minlength'].requiredLength} chars)`;
    if (field.errors['min']) return 'Must be positive';
    return 'Invalid input';
  }
}
