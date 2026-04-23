import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ProviderShopService, ShopDto, SocialLinks } from '../../../core/services/provider-shop.service';

@Component({
  selector: 'app-shop-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Header -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-black text-gray-900 mb-2">
                {{ hasShop() ? 'Manage Your Shop' : 'Create Your Shop' }}
              </h1>
              <p class="text-gray-600">
                {{ hasShop() ? 'Update your shop information and settings' : 'Set up your marketplace presence' }}
              </p>
            </div>
            @if (hasShop() && currentShop()) {
              <div class="text-right">
                <div class="text-sm text-gray-500">Shop Status</div>
                <div class="flex items-center gap-2 mt-1">
                  <div class="w-2 h-2 rounded-full" 
                       [class.bg-green-500]="currentShop()?.isActive"
                       [class.bg-red-500]="!currentShop()?.isActive"></div>
                  <span class="font-semibold" 
                        [class.text-green-600]="currentShop()?.isActive"
                        [class.text-red-600]="!currentShop()?.isActive">
                    {{ currentShop()?.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
            }
          </div>
        </div>

        @if (isLoading()) {
          <!-- Loading State -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
            <div class="inline-block w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-4"></div>
            <p class="text-gray-600">Loading shop information...</p>
          </div>
        } @else {
          <!-- Shop Form -->
          <form [formGroup]="shopForm" (ngSubmit)="onSubmit()" class="space-y-8">
            
            <!-- Basic Information -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span class="text-2xl">🏪</span>
                Basic Information
              </h2>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Shop Name -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Shop Name *
                  </label>
                  <input
                    type="text"
                    formControlName="name"
                    placeholder="Enter your shop name"
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    [class.border-red-300]="isFieldInvalid('name')"
                  />
                  @if (isFieldInvalid('name')) {
                    <p class="text-red-600 text-sm mt-1">Shop name is required</p>
                  }
                </div>

                <!-- Description -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    formControlName="description"
                    rows="4"
                    placeholder="Describe your shop and what you offer..."
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
                    [class.border-red-300]="isFieldInvalid('description')"
                  ></textarea>
                  @if (isFieldInvalid('description')) {
                    <p class="text-red-600 text-sm mt-1">Description is required</p>
                  }
                </div>

                <!-- Logo URL -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    formControlName="logo"
                    placeholder="https://example.com/logo.png"
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                  @if (shopForm.get('logo')?.value) {
                    <div class="mt-3 flex items-center gap-3">
                      <img 
                        [src]="shopForm.get('logo')?.value" 
                        alt="Shop logo preview"
                        class="w-16 h-16 object-cover rounded-xl border border-gray-200"
                        (error)="$event.target.style.display='none'"
                      />
                      <span class="text-sm text-gray-600">Logo preview</span>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Contact Information -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span class="text-2xl">📞</span>
                Contact Information
              </h2>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Email -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    formControlName="email"
                    placeholder="shop@example.com"
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>

                <!-- Phone -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    formControlName="phone"
                    placeholder="+216 XX XXX XXX"
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>

                <!-- Address -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    formControlName="address"
                    placeholder="Enter your shop address"
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <!-- Social Media Links -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span class="text-2xl">🌐</span>
                Social Media & Links
              </h2>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6" formGroupName="socialLinks">
                <!-- Facebook -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span class="text-blue-600">📘</span>
                    Facebook
                  </label>
                  <input
                    type="url"
                    formControlName="facebook"
                    placeholder="https://facebook.com/yourshop"
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>

                <!-- Instagram -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span class="text-pink-600">📷</span>
                    Instagram
                  </label>
                  <input
                    type="url"
                    formControlName="instagram"
                    placeholder="https://instagram.com/yourshop"
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>

                <!-- Website -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span class="text-gray-600">🌍</span>
                    Website
                  </label>
                  <input
                    type="url"
                    formControlName="website"
                    placeholder="https://yourshop.com"
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>

                <!-- LinkedIn -->
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span class="text-blue-700">💼</span>
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    formControlName="linkedin"
                    placeholder="https://linkedin.com/company/yourshop"
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <!-- Shop Settings -->
            @if (hasShop()) {
              <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span class="text-2xl">⚙️</span>
                  Shop Settings
                </h2>
                
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h3 class="font-semibold text-gray-900">Shop Status</h3>
                    <p class="text-sm text-gray-600">Control whether your shop is visible to customers</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      formControlName="isActive"
                      class="sr-only peer"
                    />
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            }

            <!-- Shop Statistics (if shop exists) -->
            @if (hasShop() && currentShop()) {
              <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span class="text-2xl">📊</span>
                  Shop Statistics
                </h2>
                
                <div class="grid grid-cols-2 md:grid-cols-5 gap-6">
                  <div class="text-center p-4 bg-blue-50 rounded-xl">
                    <div class="text-2xl font-black text-blue-600">{{ currentShop()?.productCount || 0 }}</div>
                    <div class="text-sm text-blue-700 font-medium">Total Products</div>
                  </div>
                  <div class="text-center p-4 bg-green-50 rounded-xl">
                    <div class="text-2xl font-black text-green-600">{{ currentShop()?.approvedProductCount || 0 }}</div>
                    <div class="text-sm text-green-700 font-medium">Approved</div>
                  </div>
                  <div class="text-center p-4 bg-yellow-50 rounded-xl">
                    <div class="text-2xl font-black text-yellow-600">{{ currentShop()?.averageRating || 0 }}</div>
                    <div class="text-sm text-yellow-700 font-medium">Avg Rating</div>
                  </div>
                  <div class="text-center p-4 bg-purple-50 rounded-xl">
                    <div class="text-2xl font-black text-purple-600">{{ currentShop()?.totalReviews || 0 }}</div>
                    <div class="text-sm text-purple-700 font-medium">Reviews</div>
                  </div>
                  <!-- ✅ TRUST SCORE DISPLAY -->
                  <div class="text-center p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl border-2 border-orange-200">
                    <div class="text-2xl font-black text-orange-600">{{ currentShop()?.trustScore?.toFixed(1) || '0.0' }}</div>
                    <div class="text-sm text-orange-700 font-medium">Trust Score</div>
                    @if (currentShop()?.trustBadge) {
                      <div class="mt-1 text-xs text-orange-600">{{ formatBadge(currentShop()?.trustBadge) }}</div>
                    }
                  </div>
                </div>
              </div>
            }

            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-4 justify-end">
              @if (hasShop()) {
                <button
                  type="button"
                  (click)="onDelete()"
                  class="px-6 py-3 border border-red-300 text-red-700 font-semibold rounded-xl hover:bg-red-50 transition-all"
                  [disabled]="isSaving()"
                >
                  Delete Shop
                </button>
              }
              
              <button
                type="submit"
                class="px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                [disabled]="shopForm.invalid || isSaving()"
              >
                @if (isSaving()) {
                  <span class="flex items-center gap-2">
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </span>
                } @else {
                  {{ hasShop() ? 'Update Shop' : 'Create Shop' }}
                }
              </button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class ShopManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private shopService = inject(ProviderShopService);

  // State
  isLoading = signal(false);
  isSaving = signal(false);
  currentShop = signal<ShopDto | null>(null);
  hasShop = computed(() => !!this.currentShop());

  // Form
  shopForm: FormGroup;

  constructor() {
    this.shopForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      email: ['', [Validators.email]],
      phone: [''],
      address: [''],
      logo: [''],
      socialLinks: this.fb.group({
        facebook: [''],
        instagram: [''],
        website: [''],
        linkedin: ['']
      }),
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadShop();
  }

  loadShop(): void {
    this.isLoading.set(true);
    
    this.shopService.checkHasShop().subscribe({
      next: (hasShop) => {
        if (hasShop) {
          this.shopService.getMyShop().subscribe({
            next: (shop) => {
              this.currentShop.set(shop);
              this.populateForm(shop);
              this.isLoading.set(false);
            },
            error: (err) => {
              console.error('Failed to load shop:', err);
              this.isLoading.set(false);
            }
          });
        } else {
          this.currentShop.set(null);
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        console.error('Failed to check shop status:', err);
        this.isLoading.set(false);
      }
    });
  }

  populateForm(shop: ShopDto): void {
    this.shopForm.patchValue({
      name: shop.name,
      description: shop.description,
      email: shop.email || '',
      phone: shop.phone || '',
      address: shop.address || '',
      logo: shop.logo || '',
      socialLinks: {
        facebook: shop.socialLinks?.facebook || '',
        instagram: shop.socialLinks?.instagram || '',
        website: shop.socialLinks?.website || '',
        linkedin: shop.socialLinks?.linkedin || ''
      },
      isActive: shop.isActive !== false
    });
  }

  onSubmit(): void {
    if (this.shopForm.invalid) {
      this.shopForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formValue = this.shopForm.value;

    const shopData = {
      name: formValue.name,
      description: formValue.description,
      email: formValue.email || undefined,
      phone: formValue.phone || undefined,
      address: formValue.address || undefined,
      logo: formValue.logo || undefined,
      socialLinks: this.cleanSocialLinks(formValue.socialLinks),
      isActive: formValue.isActive
    };

    const operation = this.hasShop() 
      ? this.shopService.updateShop(shopData)
      : this.shopService.createShop(shopData);

    operation.subscribe({
      next: (shop) => {
        this.currentShop.set(shop);
        this.isSaving.set(false);
        
        // Show success message
        alert(this.hasShop() ? 'Shop updated successfully!' : 'Shop created successfully!');
      },
      error: (err) => {
        console.error('Failed to save shop:', err);
        this.isSaving.set(false);
        alert('Failed to save shop. Please try again.');
      }
    });
  }

  onDelete(): void {
    if (!confirm('Are you sure you want to delete your shop? This action cannot be undone.')) {
      return;
    }

    this.isSaving.set(true);
    
    this.shopService.deleteShop().subscribe({
      next: () => {
        this.currentShop.set(null);
        this.shopForm.reset();
        this.isSaving.set(false);
        alert('Shop deleted successfully!');
      },
      error: (err) => {
        console.error('Failed to delete shop:', err);
        this.isSaving.set(false);
        alert('Failed to delete shop. Please try again.');
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.shopForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private cleanSocialLinks(socialLinks: any): SocialLinks {
    const cleaned: SocialLinks = {};
    
    if (socialLinks.facebook?.trim()) cleaned.facebook = socialLinks.facebook.trim();
    if (socialLinks.instagram?.trim()) cleaned.instagram = socialLinks.instagram.trim();
    if (socialLinks.website?.trim()) cleaned.website = socialLinks.website.trim();
    if (socialLinks.linkedin?.trim()) cleaned.linkedin = socialLinks.linkedin.trim();
    
    return cleaned;
  }
  
  /**
   * Format trust badge for display
   */
  formatBadge(badge: string | undefined): string {
    if (!badge) return '';
    return badge.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}