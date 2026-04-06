import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MarketplaceAdminService, CategoryDto } from '../../core/services/marketplace-admin.service';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">

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
          <h1 class="text-3xl font-black text-dark tracking-tight">Categories</h1>
          <p class="text-secondary font-medium mt-1">Manage product categories</p>
        </div>
        <div class="flex gap-3">
          <button (click)="loadData()" class="px-6 py-3 bg-gray-50 hover:bg-gray-100 text-dark font-black rounded-xl transition-all uppercase tracking-widest text-[10px] border border-gray-100">
            🔄 Refresh
          </button>
          <button (click)="openModal()" class="px-6 py-3 bg-primary text-white font-black rounded-xl transition-all uppercase tracking-widest text-[10px] hover:bg-primary/90">
            + Add Category
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-xl">🏷️</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Total</p>
            <p class="text-2xl font-black text-dark">{{ categories().length }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-xl">📦</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Total Products</p>
            <p class="text-2xl font-black text-dark">{{ totalProducts() }}</p>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/50">
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Name</th>
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Products</th>
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @if (isLoading()) {
                <tr><td colspan="3" class="px-6 py-16 text-center">
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-8 h-8 border-4 border-gray-100 border-t-primary rounded-full animate-spin"></div>
                    <p class="text-xs font-black text-secondary uppercase tracking-widest">Loading...</p>
                  </div>
                </td></tr>
              } @else if (categories().length === 0) {
                <tr><td colspan="3" class="px-6 py-16 text-center">
                  <div class="flex flex-col items-center gap-4">
                    <span class="text-5xl">🏷️</span>
                    <p class="text-lg font-black text-dark mb-2">No categories yet</p>
                    <p class="text-secondary font-medium">Start by creating your first category</p>
                  </div>
                </td></tr>
              } @else {
                @for (cat of categories(); track cat.id) {
                  <tr class="hover:bg-gray-50/50 transition-colors group">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-base">🏷️</div>
                        <p class="font-black text-dark text-sm">{{ cat.name }}</p>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span class="px-3 py-1 bg-gray-100 text-[10px] font-black text-secondary rounded-lg">
                        {{ cat.productIds?.length ?? 0 }} products
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button (click)="openModal(cat)" title="Edit"
                            class="p-2 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors text-sm">✏️</button>
                        <button (click)="deleteCategory(cat.id)" title="Delete"
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
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-black text-dark">{{ editingId() ? 'Edit Category' : 'Add Category' }}</h2>
            <button (click)="closeModal()" class="text-secondary hover:text-dark transition-colors text-xl">✕</button>
          </div>
          <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
            <div>
              <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Category Name *</label>
              <input formControlName="name" type="text" placeholder="e.g. Electronics"
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium">
              @if (form.get('name')?.invalid && form.get('name')?.touched) {
                <p class="text-red-500 text-xs mt-1">Name is required</p>
              }
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
export class CategoriesAdminComponent implements OnInit {
  private svc = inject(MarketplaceAdminService);
  private fb = inject(FormBuilder);

  categories = signal<CategoryDto[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  showModal = signal(false);
  editingId = signal<string | null>(null);

  totalProducts = () => this.categories().reduce((sum, cat) => sum + (cat.productIds?.length || 0), 0);

  form = this.fb.group({ name: ['', Validators.required] });

  ngOnInit(): void {
    console.log('🔄 Categories component initialized');
    this.loadData();
  }

  loadData(): void {
    console.log('🔄 Loading categories...');
    this.isLoading.set(true);
    this.svc.getCategories().subscribe({
      next: (data) => {
        console.log('✅ Categories loaded:', data.length);
        this.categories.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Failed to load categories:', err);
        this.isLoading.set(false);
      }
    });
  }

  openModal(cat?: CategoryDto): void {
    this.editingId.set(cat?.id ?? null);
    this.form.reset({ name: cat?.name ?? '' });
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); this.editingId.set(null); }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      alert('Please enter a category name');
      return;
    }
    
    this.isSaving.set(true);
    const name = this.form.value.name!;
    const id = this.editingId();
    
    console.log('🚀 Saving category:', name);
    const req = id ? this.svc.updateCategory(id, name) : this.svc.createCategory(name);
    
    req.subscribe({
      next: (result) => {
        console.log('✅ Category saved:', result);
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

  deleteCategory(id: string): void {
    if (!confirm('Delete this category?')) return;
    console.log('🗑️ Deleting category:', id);
    this.svc.deleteCategory(id).subscribe({
      next: () => {
        console.log('✅ Category deleted');
        this.loadData();
      },
      error: (e) => {
        console.error('❌ Delete failed:', e);
        alert(e.error?.message || 'Delete failed');
      }
    });
  }
}
