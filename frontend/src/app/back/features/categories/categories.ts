import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../front/core/shop.service';
import { ProductCategory } from '../../../front/models/product';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.scss'
})
export class Categories implements OnInit {
  private categoryService = inject(CategoryService);

  categories = signal<ProductCategory[]>([]);
  isLoading = signal<boolean>(false);
  showAddForm = signal<boolean>(false);
  editingCategory = signal<ProductCategory | null>(null);

  // Form state
  categoryName = signal<string>('');
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading.set(true);
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.isLoading.set(false);
        console.log('✅ Categories loaded:', categories.length);
      },
      error: (err) => {
        console.error('❌ Failed to load categories:', err);
        this.errorMessage.set('Failed to load categories. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  toggleAddForm(): void {
    this.showAddForm.update(v => !v);
    if (!this.showAddForm()) {
      this.resetForm();
    }
  }

  createCategory(): void {
    const name = this.categoryName().trim();
    
    if (!name) {
      this.errorMessage.set('Category name is required');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.categoryService.create({ name }).subscribe({
      next: () => {
        this.successMessage.set(`Category "${name}" created successfully!`);
        this.resetForm();
        this.loadCategories();
        this.showAddForm.set(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        console.error('❌ Failed to create category:', err);
        this.errorMessage.set(err.error?.message || 'Failed to create category. Make sure you have ADMIN role.');
        this.isLoading.set(false);
      }
    });
  }

  startEdit(category: ProductCategory): void {
    this.editingCategory.set(category);
    this.categoryName.set(category.name);
    this.showAddForm.set(true);
  }

  updateCategory(): void {
    const editing = this.editingCategory();
    if (!editing) return;

    const name = this.categoryName().trim();
    if (!name) {
      this.errorMessage.set('Category name is required');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.categoryService.update(editing.id, { name }).subscribe({
      next: () => {
        this.successMessage.set(`Category updated successfully!`);
        this.resetForm();
        this.loadCategories();
        this.showAddForm.set(false);
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        console.error('❌ Failed to update category:', err);
        this.errorMessage.set(err.error?.message || 'Failed to update category. Make sure you have ADMIN role.');
        this.isLoading.set(false);
      }
    });
  }

  deleteCategory(category: ProductCategory): void {
    if (!confirm(`Are you sure you want to delete "${category.name}"? This cannot be undone.`)) {
      return;
    }

    this.isLoading.set(true);
    this.categoryService.delete(category.id).subscribe({
      next: () => {
        this.successMessage.set(`Category "${category.name}" deleted successfully!`);
        this.loadCategories();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        console.error('❌ Failed to delete category:', err);
        this.errorMessage.set(err.error?.message || 'Failed to delete category. Make sure you have ADMIN role.');
        this.isLoading.set(false);
      }
    });
  }

  saveCategory(): void {
    if (this.editingCategory()) {
      this.updateCategory();
    } else {
      this.createCategory();
    }
  }

  cancelEdit(): void {
    this.resetForm();
    this.showAddForm.set(false);
  }

  private resetForm(): void {
    this.categoryName.set('');
    this.editingCategory.set(null);
    this.errorMessage.set('');
  }
}
