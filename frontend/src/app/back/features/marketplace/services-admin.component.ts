import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MarketplaceAdminService, ServiceAdminDto, CategoryDto, ShopAdminDto } from '../../core/services/marketplace-admin.service';
import { AdminAuthService } from '../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-services',
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
          <h1 class="text-3xl font-black text-dark tracking-tight">{{ isAdmin() ? 'Services' : 'My Services' }}</h1>
          <p class="text-secondary font-medium mt-1">{{ isAdmin() ? 'Manage all marketplace services' : 'Manage your shop services' }}</p>
        </div>
        <div class="flex gap-3">
          <button (click)="loadData()" class="px-6 py-3 bg-gray-50 hover:bg-gray-100 text-dark font-black rounded-xl transition-all uppercase tracking-widest text-[10px] border border-gray-100">
            🔄 Refresh
          </button>
          <button (click)="openModal()" class="px-6 py-3 bg-primary text-white font-black rounded-xl transition-all uppercase tracking-widest text-[10px] hover:bg-primary/90">
            + Add Service
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-xl">🔧</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Total</p>
            <p class="text-2xl font-black text-dark">{{ services().length }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-xl">💰</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Avg Price</p>
            <p class="text-2xl font-black text-dark">{{ avgPrice() }} <span class="text-sm">TND</span></p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-xl">🏪</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Shops</p>
            <p class="text-2xl font-black text-dark">{{ uniqueShops() }}</p>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/50">
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Service</th>
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Category</th>
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Price</th>
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @if (isLoading()) {
                <tr><td colspan="4" class="px-6 py-16 text-center">
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-8 h-8 border-4 border-gray-100 border-t-primary rounded-full animate-spin"></div>
                    <p class="text-xs font-black text-secondary uppercase tracking-widest">Loading...</p>
                  </div>
                </td></tr>
              } @else if (services().length === 0) {
                <tr><td colspan="4" class="px-6 py-16 text-center">
                  <div class="flex flex-col items-center gap-4">
                    <span class="text-5xl">🔧</span>
                    <p class="text-lg font-black text-dark mb-2">No services found</p>
                    <p class="text-secondary font-medium">{{ isAdmin() ? 'Services will appear here once added' : 'Start by adding your first service' }}</p>
                  </div>
                </td></tr>
              } @else {
                @for (s of services(); track s.id) {
                  <tr class="hover:bg-gray-50/50 transition-colors group">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-lg flex-shrink-0">🔧</div>
                        <div>
                          <p class="font-black text-dark text-sm">{{ s.name }}</p>
                          <p class="text-[10px] text-secondary truncate max-w-[200px]">{{ s.description }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span class="px-3 py-1 bg-gray-100 text-[10px] font-black text-secondary rounded-lg uppercase tracking-widest">
                        {{ getCategoryName(s.categoryId) || 'N/A' }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <p class="font-black text-primary text-sm">{{ s.price }} <span class="text-[10px]">TND</span></p>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button (click)="openModal(s)" title="Edit"
                            class="p-2 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors text-sm">✏️</button>
                        <button (click)="deleteService(s.id)" title="Delete"
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
            <h2 class="text-xl font-black text-dark">{{ editingId() ? 'Edit Service' : 'Add Service' }}</h2>
            <button (click)="closeModal()" class="text-secondary hover:text-dark transition-colors text-xl">✕</button>
          </div>
          <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
            <div>
              <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Name *</label>
              <input formControlName="name" type="text" placeholder="Service name"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium">
            </div>
            <div>
              <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Description</label>
              <textarea formControlName="description" rows="2" placeholder="Short description"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium resize-none"></textarea>
            </div>
            <div>
              <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Price (TND) *</label>
              <input formControlName="price" type="number" min="0" step="0.01" placeholder="0.00"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium">
            </div>
            <div>
              <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Shop</label>
              <select formControlName="shopId"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium bg-white">
                <option value="">— Select shop —</option>
                @for (shop of shops(); track shop.id) {
                  <option [value]="shop.id">{{ shop.name || 'Shop ' + shop.id.slice(0, 8) }}</option>
                }
              </select>
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
export class ServicesAdminComponent implements OnInit {
  private svc = inject(MarketplaceAdminService);
  private fb = inject(FormBuilder);
  private authService = inject(AdminAuthService);

  services = signal<ServiceAdminDto[]>([]);
  categories = signal<CategoryDto[]>([]);
  shops = signal<ShopAdminDto[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  showModal = signal(false);
  editingId = signal<string | null>(null);

  // Role-based access
  isAdmin = signal(false);
  isSeller = signal(false);

  avgPrice = () => {
    const list = this.services();
    if (!list.length) return 0;
    return (list.reduce((s, i) => s + i.price, 0) / list.length).toFixed(2);
  };

  uniqueShops = () => new Set(this.services().filter(s => s.shopId).map(s => s.shopId)).size;

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    shopId: [''],
    categoryId: ['']
  });

  ngOnInit(): void {
    this.isAdmin.set(this.authService.isAdmin());
    this.isSeller.set(this.authService.isSeller());
    console.log('👤 User role - Admin:', this.isAdmin(), 'Seller:', this.isSeller());
    this.loadData();
  }

  loadData(): void {
    console.log('🔄 Loading services...');
    this.isLoading.set(true);
    
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
    
    this.svc.getServices().subscribe({
      next: (data) => {
        console.log('✅ Services loaded:', data.length);
        this.services.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Failed to load services:', err);
        this.isLoading.set(false);
      }
    });
  }

  getCategoryName(id?: string): string {
    if (!id) return '';
    return this.categories().find(c => c.id === id)?.name || '';
  }

  openModal(s?: ServiceAdminDto): void {
    this.editingId.set(s?.id ?? null);
    this.form.reset({ name: s?.name ?? '', description: s?.description ?? '', price: s?.price ?? 0, shopId: s?.shopId ?? '', categoryId: s?.categoryId ?? '' });
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); this.editingId.set(null); }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      alert('Please fill all required fields');
      return;
    }
    
    this.isSaving.set(true);
    const v = this.form.value;
    const payload: any = {
      name: v.name,
      description: v.description || '',
      price: Number(v.price) || 0,
      shopId: v.shopId || null,
      categoryId: v.categoryId || null
    };
    
    console.log('🚀 Saving service:', payload);
    const id = this.editingId();
    const req = id ? this.svc.updateService(id, payload) : this.svc.createService(payload);
    
    req.subscribe({
      next: (result) => {
        console.log('✅ Service saved:', result);
        this.closeModal();
        this.loadData();
        this.isSaving.set(false);
      },
      error: (e) => {
        console.error('❌ Save failed:', e);
        alert(e.error?.message || 'Operation failed');
        this.isSaving.set(false);
      }
    });
  }

  deleteService(id: string): void {
    if (!confirm('Delete this service?')) return;
    console.log('🗑️ Deleting service:', id);
    this.svc.deleteService(id).subscribe({
      next: () => {
        console.log('✅ Service deleted');
        this.loadData();
      },
      error: (e) => {
        console.error('❌ Delete failed:', e);
        alert(e.error?.message || 'Delete failed');
      }
    });
  }
}
