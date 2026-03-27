import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MarketplaceService, ServiceEntity } from '../../core/marketplace-service.service';
import { CategoryService, Category } from '../../core/category.service';
import { ShopService } from '../../core/shop.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './service-form.html',
  styleUrl: './service-form.scss'
})
export class ServiceForm implements OnInit {
  private fb = inject(FormBuilder);
  private marketplaceService = inject(MarketplaceService);
  private categoryService = inject(CategoryService);
  private shopService = inject(ShopService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // State
  serviceForm!: FormGroup;
  isEditMode = signal(false);
  isSubmitting = signal(false);
  categories = signal<Category[]>([]);
  serviceId = signal<string | null>(null);
  myShopId = signal<string | null>(null);

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
    this.loadMyShop();
    
    // Check if editing
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.serviceId.set(id);
      this.loadService(id);
    }
  }

  private initForm(): void {
    this.serviceForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      categoryId: ['', Validators.required]
    });
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe(cats => this.categories.set(cats));
  }

  loadMyShop(): void {
    this.shopService.getMyShop().subscribe({
      next: (shop) => {
        if (shop && shop.id) {
          this.myShopId.set(shop.id);
        } else {
          console.error('No shop found for this provider');
          // Redirect or show error
        }
      },
      error: (err) => console.error('Error loading shop:', err)
    });
  }

  loadService(id: string): void {
    this.marketplaceService.getById(id).subscribe({
      next: (service) => {
        this.serviceForm.patchValue({
          name: service.name,
          description: service.description,
          price: service.price,
          categoryId: service.categoryId
        });
      },
      error: (err) => console.error('Error loading service:', err)
    });
  }

  onSubmit(): void {
    if (this.serviceForm.invalid || !this.myShopId()) {
      this.serviceForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.serviceForm.value;
    
    const serviceData: ServiceEntity = {
      ...formValue,
      shopId: this.myShopId()!
    };

    const action = this.isEditMode() 
      ? this.marketplaceService.update(this.serviceId()!, serviceData)
      : this.marketplaceService.create(serviceData);

    action.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/front/products/manage']); // Redirect to management
      },
      error: (err) => {
        console.error('Error saving service:', err);
        this.isSubmitting.set(false);
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.serviceForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
