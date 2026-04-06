import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';

interface Shop {
  id?: string;
  name: string;
  description: string;
  imageUrl?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

@Component({
  selector: 'app-shop-management',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './shop-management.html',
  styleUrl: './shop-management.scss'
})
export class ShopManagement implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  // State
  isLoading = signal(false);
  isSaving = signal(false);
  hasShop = signal(false);
  showImageUpload = signal(false);
  
  // Current shop data
  currentShop = signal<Shop | null>(null);
  
  // Form
  shopForm!: FormGroup;
  
  // User info
  userFullName = computed(() => this.authService.getFullName());
  userEmail = computed(() => this.authService.userEmail());

  // Image upload
  selectedImage = signal<File | null>(null);
  imagePreview = signal<string | null>(null);

  ngOnInit(): void {
    this.initForm();
    this.loadShopData();
  }

  private initForm(): void {
    this.shopForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{8,15}$/)]],
      email: ['', [Validators.required, Validators.email]],
      website: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      facebook: [''],
      instagram: [''],
      twitter: ['']
    });
  }

  private loadShopData(): void {
    this.isLoading.set(true);
    
    // TODO: Replace with actual API call
    // this.shopService.getMyShop().subscribe({
    //   next: (shop) => {
    //     if (shop) {
    //       this.hasShop.set(true);
    //       this.currentShop.set(shop);
    //       this.populateForm(shop);
    //     }
    //     this.isLoading.set(false);
    //   },
    //   error: (error) => {
    //     console.error('Failed to load shop:', error);
    //     this.isLoading.set(false);
    //   }
    // });

    // Mock data for now
    setTimeout(() => {
      const mockShop: Shop = {
        id: 'shop-1',
        name: `${this.userFullName()}'s Shop`,
        description: 'Welcome to my shop! I offer high-quality products for students.',
        address: 'ESPRIT Campus, Ariana, Tunisia',
        phone: '12345678',
        email: this.userEmail() || 'shop@example.com',
        website: 'https://myshop.com',
        socialLinks: {
          facebook: 'https://facebook.com/myshop',
          instagram: 'https://instagram.com/myshop'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Check if user already has a shop (mock logic)
      const hasExistingShop = Math.random() > 0.5; // 50% chance for demo
      
      if (hasExistingShop) {
        this.hasShop.set(true);
        this.currentShop.set(mockShop);
        this.populateForm(mockShop);
      }
      
      this.isLoading.set(false);
    }, 1000);
  }

  private populateForm(shop: Shop): void {
    this.shopForm.patchValue({
      name: shop.name,
      description: shop.description,
      address: shop.address,
      phone: shop.phone,
      email: shop.email,
      website: shop.website || '',
      facebook: shop.socialLinks?.facebook || '',
      instagram: shop.socialLinks?.instagram || '',
      twitter: shop.socialLinks?.twitter || ''
    });

    if (shop.imageUrl) {
      this.imagePreview.set(shop.imageUrl);
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      
      this.selectedImage.set(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.selectedImage.set(null);
    this.imagePreview.set(null);
    
    // Reset file input
    const fileInput = document.getElementById('shop-image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onSubmit(): void {
    if (this.shopForm.invalid) {
      this.shopForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formValue = this.shopForm.value;
    
    const shopData: Shop = {
      name: formValue.name,
      description: formValue.description,
      address: formValue.address,
      phone: formValue.phone,
      email: formValue.email,
      website: formValue.website || undefined,
      socialLinks: {
        facebook: formValue.facebook || undefined,
        instagram: formValue.instagram || undefined,
        twitter: formValue.twitter || undefined
      },
      isActive: true
    };

    // TODO: Replace with actual API call
    // const request = this.hasShop() 
    //   ? this.shopService.updateShop(this.currentShop()!.id!, shopData)
    //   : this.shopService.createShop(shopData);
    
    // request.subscribe({
    //   next: (shop) => {
    //     this.currentShop.set(shop);
    //     this.hasShop.set(true);
    //     this.isSaving.set(false);
    //     console.log('✅ Shop saved successfully');
    //   },
    //   error: (error) => {
    //     console.error('❌ Failed to save shop:', error);
    //     this.isSaving.set(false);
    //   }
    // });

    // Mock save for now
    setTimeout(() => {
      const savedShop: Shop = {
        ...shopData,
        id: this.currentShop()?.id || 'shop-' + Date.now(),
        imageUrl: this.imagePreview() || undefined,
        createdAt: this.currentShop()?.createdAt || new Date(),
        updatedAt: new Date()
      };
      
      this.currentShop.set(savedShop);
      this.hasShop.set(true);
      this.isSaving.set(false);
      
      console.log('✅ Shop saved successfully:', savedShop);
      alert(this.hasShop() ? 'Shop updated successfully!' : 'Shop created successfully!');
    }, 1500);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.shopForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.shopForm.get(fieldName);
    if (!field?.errors) return '';
    
    if (field.errors['required']) return 'This field is required';
    if (field.errors['email']) return 'Invalid email format';
    if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} characters`;
    if (field.errors['maxlength']) return `Maximum ${field.errors['maxlength'].requiredLength} characters`;
    if (field.errors['pattern']) return 'Invalid format';
    
    return 'Invalid input';
  }

  toggleImageUpload(): void {
    this.showImageUpload.update(v => !v);
  }
}