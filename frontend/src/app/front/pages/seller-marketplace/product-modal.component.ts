import { Component, signal, inject, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { catchError, map, of, switchMap, throwError } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { ShopService } from '../../../core/services/shop.service';
import { CategoryService, Category } from '../../../core/services/category.service';
import { AuthService } from '../../core/auth.service';
import { Product, ProductCondition, MarketplaceProductRequest } from '../../models/product';

@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        <!-- Header -->
        <div class="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 class="text-2xl font-black text-dark tracking-tight">{{ mode === 'add' ? 'Add Product' : 'Edit Product' }}</h2>
            <p class="text-sm text-secondary font-medium mt-1">Fill in the details for your marketplace listing</p>
          </div>
          <button (click)="close.emit()" class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-200 text-gray-400 hover:text-dark transition-all text-2xl">&times;</button>
        </div>

        <!-- Form Content -->
        <div class="flex-1 overflow-y-auto p-8">
          <form [formGroup]="productForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Name -->
              <div class="col-span-2">
                <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-2">Product Name</label>
                <input 
                  type="text" 
                  formControlName="name"
                  class="premium-input w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl transition-all outline-none font-bold"
                  placeholder="e.g. Scientific Calculator TI-84">
                @if (isFieldInvalid('name')) {
                  <p class="text-red-500 text-[10px] font-black uppercase mt-2 ml-1">{{ getFieldError('name') }}</p>
                }
              </div>

              <!-- Price -->
              <div>
                <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-2">Price (TND)</label>
                <input 
                  type="number" 
                  formControlName="price"
                  class="premium-input w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl transition-all outline-none font-bold"
                  placeholder="0.00">
                @if (isFieldInvalid('price')) {
                  <p class="text-red-500 text-[10px] font-black uppercase mt-2 ml-1">{{ getFieldError('price') }}</p>
                }
              </div>

              <!-- Stock -->
              <div>
                <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-2">Stock Quantity</label>
                <input 
                  type="number" 
                  formControlName="stock"
                  class="premium-input w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl transition-all outline-none font-bold"
                  placeholder="1">
              </div>

              <!-- Category (API-backed Mongo ids) -->
              <div>
                <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-2">Category</label>
                <select 
                  formControlName="categoryId"
                  class="premium-input w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl transition-all outline-none font-bold appearance-none">
                  <option value="">Select Category</option>
                  @for (c of categories(); track c.id) {
                    <option [value]="c.id">{{ c.name }}</option>
                  }
                </select>
                @if (categories().length === 0 && !categoriesLoading()) {
                  <p class="text-amber-600 text-[10px] font-bold mt-2">No categories from server. Add categories in admin or seed data.</p>
                }
              </div>

              <!-- Condition -->
              <div>
                <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-2">Condition</label>
                <select 
                  formControlName="condition"
                  class="premium-input w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl transition-all outline-none font-bold appearance-none">
                  <option [value]="ProductCondition.NEW">Brand New</option>
                  <option [value]="ProductCondition.LIKE_NEW">Like New</option>
                  <option [value]="ProductCondition.GOOD">Good</option>
                  <option [value]="ProductCondition.FAIR">Fair</option>
                  <option [value]="ProductCondition.POOR">Poor</option>
                </select>
              </div>

              <!-- Description -->
              <div class="col-span-2">
                <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-2">Description</label>
                <textarea 
                  formControlName="description"
                  rows="4"
                  class="premium-input w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl transition-all outline-none font-bold resize-none"
                  placeholder="Describe your product..."></textarea>
                @if (isFieldInvalid('description')) {
                  <p class="text-red-500 text-[10px] font-black uppercase mt-2 ml-1">{{ getFieldError('description') }}</p>
                }
              </div>

              <!-- Image URL -->
              <div class="col-span-2">
                <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-2">Image URL</label>
                <input 
                  type="text" 
                  formControlName="imageUrl"
                  class="premium-input w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-2xl transition-all outline-none font-bold"
                  placeholder="https://example.com/image.jpg">
              </div>

              <!-- Options -->
              <div class="col-span-2 flex items-center gap-4">
                <label class="flex items-center gap-3 cursor-pointer group">
                  <div class="relative w-6 h-6 border-2 border-gray-300 rounded-lg group-hover:border-primary transition-colors flex items-center justify-center overflow-hidden">
                    <input type="checkbox" formControlName="isNegotiable" class="absolute inset-0 opacity-0 cursor-pointer z-10">
                    <div class="w-full h-full bg-primary flex items-center justify-center transition-transform duration-300 scale-0 peer-checked:scale-100" 
                         [class.scale-100]="productForm.get('isNegotiable')?.value">
                      <svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                    </div>
                  </div>
                  <span class="text-sm font-black text-dark">Price is Negotiable</span>
                </label>
              </div>
            </div>

            <!-- Error Message -->
            @if (errorMessage()) {
              <div class="p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-3 animate-shake">
                <span class="text-xl">⚠️</span>
                <p class="text-xs font-black text-red-600 uppercase">{{ errorMessage() }}</p>
              </div>
            }

            <!-- Footer Buttons -->
            <div class="flex gap-4 pt-4 sticky bottom-0 bg-white">
              <button 
                type="button" 
                (click)="close.emit()"
                class="flex-1 px-8 py-4 border-2 border-gray-100 rounded-2xl font-black text-secondary hover:bg-gray-50 hover:border-gray-200 transition-all uppercase tracking-widest text-xs">
                Cancel
              </button>
              <button 
                type="submit"
                [disabled]="isSaving() || productForm.invalid || categoriesLoading()"
                class="flex-[2] px-8 py-4 bg-dark text-white rounded-2xl font-black hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-widest text-xs shadow-xl shadow-dark/20 flex items-center justify-center gap-3">
                @if (isSaving()) {
                  <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                } @else {
                  <span>{{ mode === 'add' ? 'Create Listing' : 'Save Changes' }}</span>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-shake {
      animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    }
    @keyframes shake {
      10%, 90% { transform: translate3d(-1px, 0, 0); }
      20%, 80% { transform: translate3d(2px, 0, 0); }
      30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
      40%, 60% { transform: translate3d(4px, 0, 0); }
    }
  `]
})
export class ProductModal implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private shopService = inject(ShopService);
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService);

  @Input() set mode(value: 'add' | 'edit') {
    console.log('🔄 Mode input changed to:', value);
    this._mode.set(value);
  }
  @Input() set product(value: Product | null) {
    console.log('🔄 Product input changed to:', value);
    this._product.set(value);
    // Patch form immediately when product changes
    if (value && this.productForm) {
      console.log('🔄 Product changed after form init - patching now');
      this.patchForm(value);
    }
  }
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  // Internal signals
  private _mode = signal<'add' | 'edit'>('add');
  private _product = signal<Product | null>(null);
  
  // Public getters that return the signal value directly
  get mode(): 'add' | 'edit' {
    return this._mode();
  }
  get product(): Product | null {
    return this._product();
  }

  ProductCondition = ProductCondition;
  productForm!: FormGroup;
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  categories = signal<Category[]>([]);
  categoriesLoading = signal(true);

  ngOnInit(): void {
    console.log('🎨 ProductModal ngOnInit');
    console.log('📝 Mode:', this.mode);
    console.log('📦 Product:', this.product);
    this.initForm();
    this.loadCategories();
    if (this.mode === 'edit' && this.product) {
      console.log('✏️ Edit mode - Patching form with product data');
      this.patchForm(this.product);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('🔄 ProductModal ngOnChanges', changes);
    
    // If product changes after initialization, patch the form
    if (changes['product'] && !changes['product'].firstChange && this.productForm) {
      const product = changes['product'].currentValue;
      console.log('🔄 Product changed (not first change):', product);
      if (product) {
        this.patchForm(product);
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
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: [0, [Validators.required, Validators.min(0)]],
      categoryId: ['', [Validators.required]],
      condition: [ProductCondition.NEW, [Validators.required]],
      stock: [1, [Validators.min(0)]],
      imageUrl: [''],
      isNegotiable: [false]
    });
  }

  private patchForm(p: Product): void {
    console.log('📝 Patching form with product:', p);
    
    // Extract image URL from various possible formats
    let imageUrl = '';
    if (p.imageUrl) {
      imageUrl = p.imageUrl;
    } else if (p.images && p.images.length > 0) {
      // images is string[] according to Product interface
      imageUrl = p.images[0];
    }
    
    // Extract first category ID
    const categoryId = p.categoryIds && p.categoryIds.length > 0 ? p.categoryIds[0] : '';
    
    console.log('📝 Form values:', {
      name: p.name,
      description: p.description,
      price: p.price,
      categoryId,
      condition: p.condition,
      stock: p.stock,
      imageUrl,
      isNegotiable: p.isNegotiable
    });
    
    this.productForm.patchValue({
      name: p.name,
      description: p.description,
      price: p.price,
      categoryId,
      condition: p.condition || ProductCondition.NEW,
      stock: p.stock || 0,
      imageUrl,
      isNegotiable: p.isNegotiable || false
    });
    
    console.log('✅ Form patched successfully');
  }

  private resolveShopId() {
    if (this.mode === 'edit' && this.product?.sellerId && this.product.sellerId !== 'Unknown') {
      return of(this.product.sellerId);
    }
    const uid = this.authService.getUserId();
    if (!uid) {
      return throwError(() => new Error('Please sign in to list a product.'));
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
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const fv = this.productForm.value;
    const categoryIds = fv.categoryId ? [fv.categoryId as string] : [];

    this.resolveShopId()
      .pipe(
        switchMap((shopId) => {
          const request: MarketplaceProductRequest = {
            name: fv.name,
            description: fv.description,
            price: fv.price,
            shopId,
            categoryIds,
            stock: fv.stock,
            images: fv.imageUrl
              ? [{ url: fv.imageUrl, altText: fv.name }]
              : [],
            isNegotiable: fv.isNegotiable,
            condition: fv.condition
          };
          return this.mode === 'add'
            ? this.productService.createProduct(request)
            : this.productService.updateProduct(this.product!.id, request);
        })
      )
      .subscribe({
        next: () => {
          console.log('✅ ========================================');
          console.log('✅ PRODUCT SAVED SUCCESSFULLY');
          console.log('✅ ========================================');
          console.log('✅ Product saved to MongoDB');
          console.log('📤 Emitting save event to parent component...');
          this.isSaving.set(false);
          this.save.emit();
          console.log('✅ Save event emitted!');
          console.log('📤 Emitting close event...');
          this.close.emit();
          console.log('✅ Close event emitted!');
          console.log('✅ Modal should close and list should refresh');
        },
        error: (err: unknown) => {
          this.isSaving.set(false);
          const msg =
            err instanceof Error
              ? err.message
              : (err as { error?: { message?: string }; message?: string })?.error?.message ||
                (err as { message?: string })?.message ||
                'Failed to save product. Please try again.';
          this.errorMessage.set(msg);
          console.error('❌ ========================================');
          console.error('❌ ERROR SAVING PRODUCT');
          console.error('❌ ========================================');
          console.error('❌ Error:', err);
          console.error('❌ Error message:', msg);
        }
      });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.productForm.get(fieldName);
    if (!field?.errors) return '';
    if (field.errors['required']) return 'Required field';
    if (field.errors['minlength']) return `Too short (min ${field.errors['minlength'].requiredLength} chars)`;
    if (field.errors['min']) return 'Must be positive';
    return 'Invalid input';
  }
}
