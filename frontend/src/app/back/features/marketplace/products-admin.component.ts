import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MarketplaceAdminService, ProductAdminDto, CategoryDto, ShopAdminDto } from '../../core/services/marketplace-admin.service';
import { AdminAuthService } from '../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">

      <!-- Back Button -->
      <div>
        <a routerLink="/admin/marketplace" class="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-secondary hover:text-primary transition-colors">
          <span class="text-lg">←</span>
          <span>Back to Marketplace</span>
        </a>
      </div>

      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl shadow-soft border border-gray-100">
        <div>
          <h1 class="text-3xl font-black text-dark tracking-tight">
            {{ filterShopId() ? 'Shop Products' : (isAdmin() ? 'Products' : 'My Products') }}
          </h1>
          <p class="text-secondary font-medium mt-1">
            @if (filterShopId()) {
              <span>Products from <span class="font-black text-primary">{{ filterShopName() }}</span></span>
            } @else {
              <span>{{ isAdmin() ? 'Manage all marketplace products' : 'Manage your shop products' }}</span>
            }
          </p>
        </div>
        <div class="flex gap-3">
          @if (filterShopId()) {
            <button (click)="clearFilter()" class="px-6 py-3 bg-gray-50 hover:bg-gray-100 text-dark font-black rounded-xl transition-all uppercase tracking-widest text-[10px] border border-gray-100">
              ✕ Clear Filter
            </button>
          }
          <button (click)="forceReload()" class="px-6 py-3 bg-gray-50 hover:bg-gray-100 text-dark font-black rounded-xl transition-all uppercase tracking-widest text-[10px] border border-gray-100">
            🔄 Refresh
          </button>
          <button (click)="openModal()" class="px-6 py-3 bg-primary text-white font-black rounded-xl transition-all uppercase tracking-widest text-[10px] hover:bg-primary/90">
            + Add Product
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-xl">📦</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Total</p>
            <p class="text-2xl font-black text-dark">{{ products().length }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-xl">✅</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Approved</p>
            <p class="text-2xl font-black text-dark">{{ approvedCount() }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-xl">⏳</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Pending</p>
            <p class="text-2xl font-black text-dark">{{ pendingCount() }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-xl">❌</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Rejected</p>
            <p class="text-2xl font-black text-dark">{{ rejectedCount() }}</p>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/50">
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Product</th>
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Category</th>
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Price</th>
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Stock</th>
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Status</th>
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @if (isLoading()) {
                <tr><td colspan="6" class="px-6 py-16 text-center">
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-8 h-8 border-4 border-gray-100 border-t-primary rounded-full animate-spin"></div>
                    <p class="text-xs font-black text-secondary uppercase tracking-widest">Loading...</p>
                  </div>
                </td></tr>
              } @else if (products().length === 0) {
                <tr><td colspan="6" class="px-6 py-16 text-center text-secondary font-medium">No products found.</td></tr>
              } @else {
                @for (p of products(); track p.id) {
                  <tr class="hover:bg-gray-50/50 transition-colors group">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                          <img [src]="p.imageUrl || p.images?.[0]?.url || 'https://placehold.co/40x40/f3f4f6/9ca3af?text=P'"
                               class="w-full h-full object-cover" [alt]="p.name">
                        </div>
                        <div>
                          <p class="font-black text-dark text-sm">{{ p.name }}</p>
                          <p class="text-[10px] text-secondary truncate max-w-[180px]">{{ p.description }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span class="px-3 py-1 bg-gray-100 text-[10px] font-black text-secondary rounded-lg uppercase tracking-widest">
                        {{ p.category || getCategoryName(p.categoryIds?.[0]) || 'N/A' }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <p class="font-black text-primary text-sm">{{ p.price }} <span class="text-[10px]">TND</span></p>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full"
                             [class.bg-green-500]="(p.stock || 0) > 10"
                             [class.bg-orange-500]="(p.stock || 0) <= 10 && (p.stock || 0) > 0"
                             [class.bg-red-500]="(p.stock || 0) === 0"></div>
                        <span class="font-bold text-sm text-dark">{{ p.stock ?? 0 }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span class="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest"
                            [class.bg-green-100]="p.status === 'APPROVED'"
                            [class.text-green-700]="p.status === 'APPROVED'"
                            [class.bg-yellow-100]="p.status === 'PENDING'"
                            [class.text-yellow-700]="p.status === 'PENDING'"
                            [class.bg-red-100]="p.status === 'REJECTED'"
                            [class.text-red-700]="p.status === 'REJECTED'"
                            [class.bg-gray-100]="!p.status"
                            [class.text-gray-600]="!p.status">
                        {{ p.status || 'N/A' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        @if (isAdmin() && p.status === 'PENDING') {
                          <button (click)="approve(p.id)" title="Approve"
                              class="p-2 hover:bg-green-50 text-green-500 hover:text-green-700 rounded-lg transition-colors text-sm">✅</button>
                          <button (click)="reject(p.id)" title="Reject"
                              class="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors text-sm">🚫</button>
                        }
                        <button (click)="openModal(p)" title="Edit"
                            class="p-2 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors text-sm">✏️</button>
                        <button (click)="deleteProduct(p.id)" title="Delete"
                            class="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors text-sm">🗑️</button>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal -->
    @if (showModal()) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="closeModal()">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 space-y-6" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-black text-dark">{{ editingId() ? 'Edit Product' : 'Add Product' }}</h2>
            <button (click)="closeModal()" class="text-secondary hover:text-dark transition-colors text-xl">✕</button>
          </div>

          <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
            <div>
              <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Name *</label>
              <input formControlName="name" type="text" placeholder="Product name"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium">
            </div>
            <div>
              <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Description</label>
              <textarea formControlName="description" rows="2" placeholder="Short description"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium resize-none"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Price (TND) *</label>
                <input formControlName="price" type="number" min="0" step="0.01" placeholder="0.00"
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium">
              </div>
              <div>
                <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Stock</label>
                <input formControlName="stock" type="number" min="0" placeholder="0"
                  class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium">
              </div>
            </div>
            <div>
              <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Shop *</label>
              <select formControlName="shopId"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium bg-white">
                <option value="">— Select shop —</option>
                @for (shop of shops(); track shop.id) {
                  <option [value]="shop.id">{{ shop.name || 'Shop ' + shop.id.slice(0, 8) }}</option>
                }
              </select>
              @if (form.get('shopId')?.invalid && form.get('shopId')?.touched) {
                <p class="text-red-500 text-xs mt-1">Shop is required</p>
              }
            </div>
            <div>
              <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Category</label>
              <select formControlName="categoryId"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium bg-white">
                <option value="">— Select category —</option>
                @for (cat of categories(); track cat.id) {
                  <option [value]="cat.id">{{ cat.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Image URL</label>
              <input formControlName="imageUrl" type="url" placeholder="https://..."
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium">
            </div>
            <div class="flex gap-3 pt-2">
              <button type="submit" [disabled]="form.invalid || isSaving()"
                class="flex-1 py-3 bg-primary text-white font-black rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 text-sm uppercase tracking-widest">
                {{ isSaving() ? 'Saving...' : (editingId() ? 'Update' : 'Create') }}
              </button>
              <button type="button" (click)="closeModal()"
                class="px-6 py-3 bg-gray-100 text-dark font-black rounded-xl hover:bg-gray-200 transition-all text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`.shadow-soft { box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); }`]
})
export class ProductsAdminComponent implements OnInit {
  private svc = inject(MarketplaceAdminService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AdminAuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  products = signal<ProductAdminDto[]>([]);
  categories = signal<CategoryDto[]>([]);
  shops = signal<ShopAdminDto[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  showModal = signal(false);
  editingId = signal<string | null>(null);

  // Role-based access
  isAdmin = signal(false);
  isSeller = signal(false);
  
  // Shop filter
  filterShopId = signal<string | null>(null);
  filterShopName = signal<string | null>(null);

  approvedCount = () => this.products().filter(p => p.status === 'APPROVED').length;
  pendingCount = () => this.products().filter(p => p.status === 'PENDING').length;
  rejectedCount = () => this.products().filter(p => p.status === 'REJECTED').length;

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0],
    shopId: ['', Validators.required],
    categoryId: [''],
    imageUrl: ['']
  });

  ngOnInit(): void {
    // Detect user role
    this.isAdmin.set(this.authService.isAdmin());
    this.isSeller.set(this.authService.isSeller());
    console.log('👤 User role - Admin:', this.isAdmin(), 'Seller:', this.isSeller());
    
    // Check for shop filter in query params
    this.route.queryParams.subscribe(params => {
      const shopId = params['shopId'];
      if (shopId) {
        console.log('🏪 Filtering products by shop ID:', shopId);
        this.filterShopId.set(shopId);
        
        // Load shop name for display
        this.svc.getShops().subscribe({
          next: shops => {
            const shop = shops.find(s => s.id === shopId);
            if (shop) {
              this.filterShopName.set(shop.name || 'Shop');
              console.log('🏪 Shop name:', shop.name);
            }
          }
        });
      } else {
        this.filterShopId.set(null);
        this.filterShopName.set(null);
      }
      
      this.loadData();
    });
  }

  loadData(): void {
    console.log('🔄 loadData() called - Starting to load products...');
    this.isLoading.set(true);
    
    // Load categories and shops in parallel (non-blocking)
    this.svc.getCategories().subscribe({
      next: cats => {
        console.log('✅ Categories loaded:', cats.length);
        this.categories.set(cats);
      },
      error: err => console.error('❌ Failed to load categories:', err)
    });
    
    this.svc.getShops().subscribe({
      next: shops => {
        console.log('✅ Shops loaded:', shops.length);
        this.shops.set(shops);
      },
      error: err => console.error('❌ Failed to load shops:', err)
    });
    
    // Load products based on filter or role
    let productsRequest: any;
    
    if (this.filterShopId()) {
      // Filter by shop ID
      console.log('🏪 Loading products for shop:', this.filterShopId());
      productsRequest = this.svc.getProductsByShop(this.filterShopId()!);
    } else if (this.isAdmin()) {
      // Admin: all products
      productsRequest = this.svc.getProductsAdmin();
    } else {
      // Seller: only their products
      productsRequest = this.svc.getMyProducts();
    }
    
    productsRequest.subscribe({
      next: (data: ProductAdminDto[]) => {
        console.log('✅ Products loaded from API:', data.length, 'products');
        console.log('📦 Products data:', data);
        this.products.set(data);
        console.log('✅ Products signal updated. Current value:', this.products());
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('❌ Failed to load products:', err);
        this.isLoading.set(false);
      }
    });
  }

  getCategoryName(id?: string): string {
    if (!id) return '';
    return this.categories().find(c => c.id === id)?.name || '';
  }

  openModal(product?: ProductAdminDto): void {
    if (product) {
      this.editingId.set(product.id);
      this.form.patchValue({
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock: product.stock ?? 0,
        shopId: product.shopId || '',
        categoryId: product.categoryIds?.[0] || '',
        imageUrl: product.imageUrl || product.images?.[0]?.url || ''
      });
    } else {
      this.editingId.set(null);
      this.form.reset({ name: '', description: '', price: 0, stock: 0, shopId: '', categoryId: '', imageUrl: '' });
    }
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      alert('Please fill all required fields (Name, Price, Shop)');
      return;
    }
    
    this.isSaving.set(true);
    const v = this.form.value;
    
    // Build payload matching ProductRequestDTO exactly
    const payload: any = {
      name: v.name,
      description: v.description || '',
      price: Number(v.price) || 0,
      stock: Number(v.stock) || 0,
      shopId: v.shopId,
      categoryIds: v.categoryId ? [v.categoryId] : [],
      images: v.imageUrl ? [{ url: v.imageUrl, altText: v.name }] : []
    };

    console.log('🚀 Sending product payload:', JSON.stringify(payload, null, 2));

    const id = this.editingId();
    const operation = id ? 'UPDATE' : 'CREATE';
    const req = id ? this.svc.updateProduct(id, payload) : this.svc.createProduct(payload);
    
    req.subscribe({
      next: (result) => {
        console.log(`✅ Product ${operation} successful:`, result);
        console.log('📦 Returned product ID:', result.id);
        this.isSaving.set(false);
        this.closeModal();
        
        // Force immediate reload with multiple attempts
        console.log('🔄 Force reloading products (attempt 1)...');
        this.forceReload();
        
        // Backup reload after 300ms
        setTimeout(() => {
          console.log('🔄 Force reloading products (attempt 2)...');
          this.forceReload();
        }, 300);
        
        // Final reload after 1 second
        setTimeout(() => {
          console.log('🔄 Force reloading products (attempt 3 - final)...');
          this.forceReload();
        }, 1000);
      },
      error: (e) => {
        console.error(`❌ Product ${operation} failed:`, e);
        console.error('Error details:', {
          status: e.status,
          statusText: e.statusText,
          message: e.error?.message,
          error: e.error
        });
        alert(`Failed to save product: ${e.error?.message || e.message || 'Unknown error'}`);
        this.isSaving.set(false);
      }
    });
  }

  forceReload(): void {
    console.log('💪 forceReload() - Forcing products refresh...');
    this.isLoading.set(true);
    
    // Load products based on filter or role
    let productsRequest: any;
    
    if (this.filterShopId()) {
      console.log('🏪 Loading products for shop:', this.filterShopId());
      productsRequest = this.svc.getProductsByShop(this.filterShopId()!);
    } else if (this.isAdmin()) {
      productsRequest = this.svc.getProductsAdmin();
    } else {
      productsRequest = this.svc.getMyProducts();
    }
    
    productsRequest.subscribe({
      next: (data: ProductAdminDto[]) => {
        console.log('✅ Force reload successful - Products count:', data.length);
        console.log('📦 All products:', data);
        
        // Force signal update with change detection
        this.products.set([]);  // Clear first
        this.cdr.detectChanges();  // Force change detection
        
        setTimeout(() => {
          this.products.set(data);  // Then set new data
          this.cdr.detectChanges();  // Force change detection again
          console.log('✅ Products signal force-updated:', this.products().length);
          this.isLoading.set(false);
        }, 50);
      },
      error: (err: any) => {
        console.error('❌ Force reload failed:', err);
        this.isLoading.set(false);
      }
    });
  }

  clearFilter(): void {
    console.log('✕ Clearing shop filter...');
    this.filterShopId.set(null);
    this.filterShopName.set(null);
    this.router.navigate(['/admin/marketplace/products']);
  }

  deleteProduct(id: string): void {
    if (!confirm('Delete this product?')) return;
    console.log('🗑️ Deleting product:', id);
    this.svc.deleteProduct(id).subscribe({
      next: () => {
        console.log('✅ Product deleted, force reloading...');
        this.forceReload();
      },
      error: (e) => {
        console.error('❌ Delete failed:', e);
        alert(e.error?.message || 'Delete failed');
      }
    });
  }

  approve(id: string): void {
    console.log('✅ Approving product:', id);
    this.svc.approveProduct(id).subscribe({
      next: (result) => {
        console.log('✅ Product approved:', result);
        this.forceReload();
      },
      error: (e) => {
        console.error('❌ Approve failed:', e);
        alert(e.error?.message || 'Approve failed');
      }
    });
  }

  reject(id: string): void {
    console.log('🚫 Rejecting product:', id);
    this.svc.rejectProduct(id).subscribe({
      next: (result) => {
        console.log('✅ Product rejected:', result);
        this.forceReload();
      },
      error: (e) => {
        console.error('❌ Reject failed:', e);
        alert(e.error?.message || 'Reject failed');
      }
    });
  }
}
