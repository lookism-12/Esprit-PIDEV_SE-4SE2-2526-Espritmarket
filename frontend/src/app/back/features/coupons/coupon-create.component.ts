import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService, CreateCouponRequest } from '../../core/services/admin.service';

@Component({
  selector: 'app-coupon-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './coupon-create.component.html',
  styleUrl: './coupon-create.component.scss'
})
export class CouponCreateComponent implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // Form
  couponForm: FormGroup;

  // State
  readonly isLoading = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  // Computed properties for template
  readonly minDate = new Date().toISOString().split('T')[0];

  constructor() {
    this.couponForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      discountType: ['PERCENTAGE', [Validators.required]],
      discountValue: ['', [Validators.required, Validators.min(0.01)]],
      expirationDate: ['', [Validators.required]],
      minCartAmount: [''],
      usageLimit: [''],
      eligibleUserLevel: [''],
      combinableWithDiscount: [false],
      description: ['']
    });
  }

  ngOnInit(): void {
    // Component initialization
  }

  onSubmit(): void {
    if (this.couponForm.invalid) {
      this.couponForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const formValue = this.couponForm.value;
    
    // Validate discount value based on type
    if (formValue.discountType === 'PERCENTAGE' && formValue.discountValue > 100) {
      this.error.set('Percentage discount cannot exceed 100%');
      this.isSubmitting.set(false);
      return;
    }

    const request: CreateCouponRequest = {
      code: formValue.code.toUpperCase(),
      discountType: formValue.discountType,
      discountValue: parseFloat(formValue.discountValue),
      expirationDate: formValue.expirationDate,
      minCartAmount: formValue.minCartAmount ? parseFloat(formValue.minCartAmount) : undefined,
      usageLimit: formValue.usageLimit ? parseInt(formValue.usageLimit) : undefined,
      eligibleUserLevel: formValue.eligibleUserLevel || undefined,
      combinableWithDiscount: formValue.combinableWithDiscount || false,
      description: formValue.description || undefined
    };

    console.log('Creating coupon with request:', request);

    this.adminService.createCoupon(request).subscribe({
      next: (coupon) => {
        console.log('Coupon created successfully:', coupon);
        this.success.set(`✅ Coupon "${coupon.code}" created successfully!`);
        this.isSubmitting.set(false);
        
        // Redirect to success page after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/admin/orders'], { queryParams: { tab: 'coupons' } });
        }, 2000);
      },
      error: (err) => {
        console.error('Coupon creation error:', err);
        
        let errorMessage = 'Failed to create coupon';
        
        if (err.status === 400 && err.error?.fieldErrors) {
          // Handle validation errors
          const fieldErrors = err.error.fieldErrors;
          const errorMessages = Object.entries(fieldErrors).map(([field, message]) => `${field}: ${message}`);
          errorMessage = `Validation failed: ${errorMessages.join(', ')}`;
        } else if (err.status === 403) {
          errorMessage = 'Access denied. You need admin or provider privileges to create coupons.';
        } else if (err.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        this.error.set(errorMessage);
        this.isSubmitting.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/orders']);
  }

  clearError(): void {
    this.error.set(null);
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.couponForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.couponForm.get(fieldName);
    if (!field?.errors) return '';

    if (field.errors['required']) return 'This field is required';
    if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} characters`;
    if (field.errors['maxlength']) return `Maximum ${field.errors['maxlength'].requiredLength} characters`;
    if (field.errors['min']) return `Minimum value is ${field.errors['min'].min}`;

    return 'Invalid input';
  }

  // Computed properties for template
  readonly discountTypeLabel = computed(() => {
    const type = this.couponForm.get('discountType')?.value;
    return type === 'PERCENTAGE' ? '%' : 'TND';
  });

  readonly estimatedDiscount = computed(() => {
    const discountType = this.couponForm.get('discountType')?.value;
    const discountValue = this.couponForm.get('discountValue')?.value;
    
    if (!discountValue) return '';
    
    if (discountType === 'PERCENTAGE') {
      return `${discountValue}% off`;
    } else {
      return `${discountValue} TND off`;
    }
  });
}