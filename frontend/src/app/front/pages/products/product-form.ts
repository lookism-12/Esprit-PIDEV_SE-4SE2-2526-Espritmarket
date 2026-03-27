import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../core/product.service';
import { CategoryService, Category } from '../../core/category.service';
import { ProductCondition } from '../../models/product';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss'
})
export class ProductForm implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // State
  productForm!: FormGroup;
  isEditMode = signal(false);
  isSubmitting = signal(false);
  categories = signal<Category[]>([]);
  productId = signal<string | null>(null);
  
  // Enum values for select
  conditions = Object.values(ProductCondition);

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
    
    // Check if editing
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.productId.set(id);
      this.loadProduct(id);
    }
  }

  private initForm(): void {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      stock: [1, [Validators.required, Validators.min(0)]],
      categoryIds: [[], Validators.required],
      condition: [ProductCondition.NEW, Validators.required],
      isNegotiable: [false],
      originalPrice: [null],
      imageUrl: [''] // Temporary single image URL input
    });
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe(cats => this.categories.set(cats));
  }

  loadProduct(id: string): void {
    this.productService.getById(id).subscribe({
      next: (product) => {
        this.productForm.patchValue({
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          categoryIds: [product.category], // Backend should ideally provide IDs
          condition: product.condition,
          isNegotiable: product.isNegotiable,
          originalPrice: product.originalPrice,
          imageUrl: product.imageUrl
        });
      },
      error: (err) => console.error('Error loading product:', err)
    });
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.productForm.value;
    
    // Format for backend
    const productData = {
      ...formValue,
      images: formValue.imageUrl ? [{ url: formValue.imageUrl, altText: formValue.name }] : []
    };

    const action = this.isEditMode() 
      ? this.productService.update(this.productId()!, productData)
      : this.productService.create(productData);

    action.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/front/products/manage']);
      },
      error: (err) => {
        console.error('Error saving product:', err);
        this.isSubmitting.set(false);
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
