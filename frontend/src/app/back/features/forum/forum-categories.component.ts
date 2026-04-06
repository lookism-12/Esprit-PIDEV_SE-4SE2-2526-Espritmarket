import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminForumService, CategoryForum } from '../../core/services/admin-forum.service';

@Component({
  selector: 'app-forum-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl shadow-soft border border-gray-100">
        <div>
          <h1 class="text-3xl font-black text-dark tracking-tight">Forum Categories</h1>
          <p class="text-secondary font-medium mt-1">Manage forum categories and organization</p>
        </div>
        <button (click)="openCreateModal()" 
                class="px-6 py-3 bg-primary text-white font-black rounded-xl transition-all uppercase tracking-widest text-[10px] hover:bg-primary/90">
          + Add Category
        </button>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-xl">📂</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Total</p>
            <p class="text-2xl font-black text-dark">{{ categories().length }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-xl">📝</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Active</p>
            <p class="text-2xl font-black text-dark">{{ categories().length }}</p>
          </div>
        </div>
      </div>

      <!-- Categories List -->
      <div class="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
        @if (loading()) {
          <div class="flex items-center justify-center py-16">
            <div class="flex flex-col items-center gap-3">
              <div class="w-8 h-8 border-4 border-gray-100 border-t-primary rounded-full animate-spin"></div>
              <p class="text-xs font-black text-secondary uppercase tracking-widest">Loading...</p>
            </div>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50/50">
                  <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Name</th>
                  <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Description</th>
                  <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                @for (category of categories(); track category.id) {
                  <tr class="hover:bg-gray-50/50 transition-colors group">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg">📂</div>
                        <p class="font-black text-dark text-sm">{{ category.name }}</p>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-secondary text-sm">{{ category.description }}</td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button (click)="editCategory(category)" title="Edit"
                            class="p-2 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors text-sm">✏️</button>
                        <button (click)="deleteCategory(category.id!)" title="Delete"
                            class="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors text-sm">🗑️</button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="3" class="px-6 py-16 text-center">
                      <div class="flex flex-col items-center gap-4">
                        <span class="text-5xl">📂</span>
                        <p class="text-lg font-black text-dark mb-2">No categories yet</p>
                        <p class="text-secondary font-medium">Start by creating your first category</p>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Create/Edit Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="closeModal()">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 space-y-6" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-black text-dark">{{ editingCategory() ? 'Edit Category' : 'Add Category' }}</h2>
              <button (click)="closeModal()" class="text-secondary hover:text-dark transition-colors text-xl">✕</button>
            </div>
            
            <form (ngSubmit)="saveCategory()" class="space-y-4">
              <div>
                <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Category Name *</label>
                <input [(ngModel)]="categoryForm.name" 
                       name="name"
                       type="text" 
                       required
                       placeholder="e.g. General Discussion"
                       class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium">
              </div>
              
              <div>
                <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Description *</label>
                <textarea [(ngModel)]="categoryForm.description" 
                          name="description"
                          required
                          rows="4"
                          placeholder="Describe this category"
                          class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium resize-none"></textarea>
              </div>
              
              <div class="flex gap-3 pt-2">
                <button type="submit" 
                        [disabled]="saving()"
                        class="flex-1 py-3 bg-primary text-white font-black rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 text-sm uppercase tracking-widest">
                  {{ saving() ? 'Saving...' : (editingCategory() ? 'Update' : 'Create') }}
                </button>
                <button type="button" 
                        (click)="closeModal()"
                        class="px-6 py-3 bg-gray-100 text-dark font-black rounded-xl hover:bg-gray-200 transition-all text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`.shadow-soft { box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); }`]
})
export class ForumCategoriesComponent implements OnInit {
  private forumService = inject(AdminForumService);
  
  categories = signal<CategoryForum[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving = signal(false);
  editingCategory = signal<CategoryForum | null>(null);
  
  categoryForm = {
    name: '',
    description: ''
  };

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.loading.set(true);
    this.forumService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.loading.set(false);
      }
    });
  }

  openCreateModal() {
    this.editingCategory.set(null);
    this.categoryForm = { name: '', description: '' };
    this.showModal.set(true);
  }

  editCategory(category: CategoryForum) {
    this.editingCategory.set(category);
    this.categoryForm = { 
      name: category.name, 
      description: category.description 
    };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingCategory.set(null);
    this.categoryForm = { name: '', description: '' };
  }

  saveCategory() {
    if (!this.categoryForm.name.trim() || !this.categoryForm.description.trim()) {
      return;
    }

    this.saving.set(true);
    const categoryData = {
      name: this.categoryForm.name.trim(),
      description: this.categoryForm.description.trim()
    };

    const operation = this.editingCategory() 
      ? this.forumService.updateCategory(this.editingCategory()!.id!, categoryData)
      : this.forumService.createCategory(categoryData);

    operation.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadCategories();
      },
      error: (error) => {
        console.error('Error saving category:', error);
        this.saving.set(false);
      }
    });
  }

  deleteCategory(id: string) {
    if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      this.forumService.deleteCategory(id).subscribe({
        next: () => {
          this.loadCategories();
        },
        error: (error) => {
          console.error('Error deleting category:', error);
        }
      });
    }
  }
}