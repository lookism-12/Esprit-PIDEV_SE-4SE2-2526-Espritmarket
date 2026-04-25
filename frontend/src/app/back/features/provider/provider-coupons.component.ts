import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environment';
import { AuthService } from '../../../front/core/auth.service';

interface ProviderCoupon {
  id?: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  scope: 'SHOP_SPECIFIC';  // Always shop-specific for providers
  shopId?: string;
  providerId?: string;
}

@Component({
  selector: 'app-provider-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Header -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-black text-gray-900 mb-2 flex items-center gap-3">
                <span class="text-4xl">🎟️</span>
                Coupons & Discounts
              </h1>
              <p class="text-gray-600">
                Create and manage discount coupons for your shop
              </p>
            </div>
            <button 
              (click)="showCreateForm = true"
              class="px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-all shadow-lg flex items-center gap-2">
              <span class="text-xl">➕</span>
              Create Coupon
            </button>
          </div>
        </div>

        <!-- Create/Edit Form -->
        @if (showCreateForm) {
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
            <div class="bg-gradient-to-r from-primary to-primary-dark px-8 py-6">
              <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                <span>✨</span>
                {{ editingCoupon ? 'Edit Coupon' : 'Create New Coupon' }}
              </h2>
              <p class="text-primary-light mt-1">
                This coupon will only apply to products in your shop
              </p>
            </div>
            
            <div class="p-8 space-y-6">
              <!-- Coupon Code -->
              <div>
                <label class="block text-sm font-bold text-gray-900 mb-2">
                  Coupon Code *
                </label>
                <input 
                  type="text" 
                  [(ngModel)]="newCoupon.code"
                  (input)="newCoupon.code = newCoupon.code.toUpperCase()"
                  placeholder="e.g., SUMMER2024"
                  maxlength="20"
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent uppercase font-mono text-lg">
                <p class="text-xs text-gray-500 mt-2">
                  Use uppercase letters and numbers only (max 20 characters)
                </p>
              </div>

              <!-- Discount Type & Value -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-bold text-gray-900 mb-2">
                    Discount Type *
                  </label>
                  <select 
                    [(ngModel)]="newCoupon.discountType"
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (TND)</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-bold text-gray-900 mb-2">
                    Discount Value *
                  </label>
                  <div class="relative">
                    <input 
                      type="number" 
                      [(ngModel)]="newCoupon.discountValue"
                      [placeholder]="newCoupon.discountType === 'PERCENTAGE' ? 'e.g., 20' : 'e.g., 50'"
                      min="0"
                      [max]="newCoupon.discountType === 'PERCENTAGE' ? 100 : null"
                      step="0.01"
                      class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
                    <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                      {{ newCoupon.discountType === 'PERCENTAGE' ? '%' : 'TND' }}
                    </span>
                  </div>
                  @if (newCoupon.discountType === 'PERCENTAGE') {
                    <p class="text-xs text-gray-500 mt-2">
                      Enter a value between 0 and 100
                    </p>
                  }
                </div>
              </div>

              <!-- Min Order & Max Discount -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-bold text-gray-900 mb-2">
                    Minimum Order Amount (TND)
                  </label>
                  <input 
                    type="number" 
                    [(ngModel)]="newCoupon.minOrderAmount"
                    placeholder="Optional - Leave empty for no minimum"
                    min="0"
                    step="0.01"
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
                  <p class="text-xs text-gray-500 mt-2">
                    Coupon only applies if order total exceeds this amount
                  </p>
                </div>

                @if (newCoupon.discountType === 'PERCENTAGE') {
                  <div>
                    <label class="block text-sm font-bold text-gray-900 mb-2">
                      Maximum Discount (TND)
                    </label>
                    <input 
                      type="number" 
                      [(ngModel)]="newCoupon.maxDiscount"
                      placeholder="Optional - Leave empty for no cap"
                      min="0"
                      step="0.01"
                      class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
                    <p class="text-xs text-gray-500 mt-2">
                      Maximum discount amount for percentage coupons
                    </p>
                  </div>
                }
              </div>

              <!-- Usage Limit -->
              <div>
                <label class="block text-sm font-bold text-gray-900 mb-2">
                  Usage Limit
                </label>
                <input 
                  type="number" 
                  [(ngModel)]="newCoupon.usageLimit"
                  placeholder="Leave empty for unlimited usage"
                  min="1"
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
                <p class="text-xs text-gray-500 mt-2">
                  Total number of times this coupon can be used (leave empty for unlimited)
                </p>
              </div>

              <!-- Validity Period -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-bold text-gray-900 mb-2">
                    Valid From *
                  </label>
                  <input 
                    type="date" 
                    [(ngModel)]="newCoupon.validFrom"
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
                </div>

                <div>
                  <label class="block text-sm font-bold text-gray-900 mb-2">
                    Valid Until *
                  </label>
                  <input 
                    type="date" 
                    [(ngModel)]="newCoupon.validUntil"
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
                </div>
              </div>

              <!-- Scope Info (Read-only) -->
              <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div class="flex items-start gap-3">
                  <span class="text-2xl">ℹ️</span>
                  <div>
                    <h4 class="font-bold text-blue-900 mb-1">Coupon Scope</h4>
                    <p class="text-sm text-blue-800">
                      This coupon will <strong>only apply to products in your shop</strong>. 
                      Customers can use it when purchasing items from your store.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Active Status -->
              <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <input 
                  type="checkbox" 
                  [(ngModel)]="newCoupon.isActive"
                  id="isActive"
                  class="w-6 h-6 text-primary border-gray-300 rounded focus:ring-primary">
                <label for="isActive" class="text-sm font-bold text-gray-900 cursor-pointer">
                  Activate coupon immediately
                </label>
              </div>

              <!-- Action Buttons -->
              <div class="flex items-center justify-end gap-4 pt-6 border-t-2 border-gray-200">
                <button 
                  (click)="cancelForm()"
                  class="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button 
                  (click)="saveCoupon()"
                  [disabled]="isSaving() || !isFormValid()"
                  class="px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                  {{ isSaving() ? 'Saving...' : (editingCoupon ? 'Update Coupon' : 'Create Coupon') }}
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Coupons List -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="px-8 py-6 border-b border-gray-200 bg-gray-50">
            <h2 class="text-xl font-bold text-gray-900">Your Coupons</h2>
            <p class="text-sm text-gray-600 mt-1">
              Manage all discount coupons for your shop
            </p>
          </div>
          
          @if (isLoading()) {
            <!-- Loading State -->
            <div class="p-16 text-center">
              <div class="inline-block w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-4"></div>
              <p class="text-gray-600">Loading coupons...</p>
            </div>
          } @else if (coupons().length === 0) {
            <!-- Empty State -->
            <div class="p-16 text-center">
              <div class="text-6xl mb-4">🎟️</div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">No coupons created yet</h3>
              <p class="text-gray-600 mb-6">
                Create your first coupon to offer discounts to your customers
              </p>
              <button 
                (click)="showCreateForm = true"
                class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-all">
                <span class="text-xl">➕</span>
                Create Your First Coupon
              </button>
            </div>
          } @else {
            <!-- Coupons Table -->
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Code</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Discount</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Min Order</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Usage</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Valid Until</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  @for (coupon of coupons(); track coupon.id) {
                    <tr class="hover:bg-gray-50 transition-colors">
                      <!-- Code -->
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="font-mono font-bold text-primary text-lg">{{ coupon.code }}</span>
                      </td>
                      
                      <!-- Discount -->
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center gap-2">
                          <span class="text-2xl">💰</span>
                          <div>
                            <div class="font-bold text-gray-900">
                              {{ coupon.discountType === 'PERCENTAGE' ? coupon.discountValue + '%' : coupon.discountValue + ' TND' }}
                            </div>
                            <div class="text-xs text-gray-500">
                              {{ coupon.discountType === 'PERCENTAGE' ? 'Percentage' : 'Fixed Amount' }}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <!-- Min Order -->
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-sm text-gray-600">
                          {{ coupon.minOrderAmount ? (coupon.minOrderAmount + ' TND') : 'No minimum' }}
                        </span>
                      </td>
                      
                      <!-- Usage -->
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center gap-2">
                          <div class="flex-1">
                            <div class="text-sm font-semibold text-gray-900">
                              {{ coupon.usageCount || 0 }} / {{ coupon.usageLimit || '∞' }}
                            </div>
                            @if (coupon.usageLimit) {
                              <div class="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                <div class="bg-primary h-1.5 rounded-full" 
                                     [style.width.%]="getUsagePercentage(coupon)"></div>
                              </div>
                            }
                          </div>
                        </div>
                      </td>
                      
                      <!-- Valid Until -->
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-600">
                          {{ coupon.validUntil | date:'MMM d, y' }}
                        </div>
                        @if (isExpired(coupon)) {
                          <span class="text-xs text-red-600 font-semibold">Expired</span>
                        } @else if (isExpiringSoon(coupon)) {
                          <span class="text-xs text-orange-600 font-semibold">Expiring soon</span>
                        }
                      </td>
                      
                      <!-- Status -->
                      <td class="px-6 py-4 whitespace-nowrap">
                        @if (isExpired(coupon)) {
                          <span class="px-3 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800">
                            ⏰ Expired
                          </span>
                        } @else if (coupon.isActive) {
                          <span class="px-3 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800">
                            ✅ Active
                          </span>
                        } @else {
                          <span class="px-3 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-800">
                            ⏸️ Inactive
                          </span>
                        }
                      </td>
                      
                      <!-- Actions -->
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center gap-2">
                          @if (!isExpired(coupon)) {
                            <button 
                              (click)="toggleCouponStatus(coupon)"
                              class="px-3 py-1 text-xs font-semibold rounded-lg transition-all"
                              [class]="coupon.isActive ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'">
                              {{ coupon.isActive ? 'Deactivate' : 'Activate' }}
                            </button>
                          }
                          <button 
                            (click)="editCoupon(coupon)"
                            class="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all">
                            Edit
                          </button>
                          <button 
                            (click)="deleteCoupon(coupon)"
                            class="px-3 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- Info Notice -->
        <div class="mt-8 bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
          <div class="flex items-start gap-4">
            <div class="text-3xl">💡</div>
            <div>
              <h3 class="font-bold text-blue-900 mb-2">About Provider Coupons</h3>
              <ul class="text-sm text-blue-800 space-y-1">
                <li>• Coupons you create only apply to products in <strong>your shop</strong></li>
                <li>• Customers can use your coupons when purchasing items from your store</li>
                <li>• You can track usage and deactivate coupons at any time</li>
                <li>• Expired coupons cannot be reactivated - create a new one instead</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ProviderCouponsComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  isLoading = signal(false);
  isSaving = signal(false);
  showCreateForm = false;
  editingCoupon: ProviderCoupon | null = null;
  
  coupons = signal<ProviderCoupon[]>([]);
  
  newCoupon: ProviderCoupon = this.getEmptyCoupon();

  ngOnInit(): void {
    this.loadCoupons();
  }

  private getEmptyCoupon(): ProviderCoupon {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    return {
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: 0,
      validFrom: today,
      validUntil: nextMonth,
      isActive: true,
      scope: 'SHOP_SPECIFIC'
    };
  }

  private loadCoupons(): void {
    this.isLoading.set(true);
    
    this.http.get<ProviderCoupon[]>(`${environment.apiUrl}/provider/coupons`).subscribe({
      next: (data) => {
        this.coupons.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load coupons:', error);
        this.isLoading.set(false);
        
        // Mock data for demonstration
        this.coupons.set([]);
      }
    });
  }

  isFormValid(): boolean {
    return !!(
      this.newCoupon.code &&
      this.newCoupon.code.length >= 3 &&
      this.newCoupon.discountValue > 0 &&
      this.newCoupon.validFrom &&
      this.newCoupon.validUntil &&
      new Date(this.newCoupon.validUntil) > new Date(this.newCoupon.validFrom)
    );
  }

  saveCoupon(): void {
    if (!this.isFormValid()) {
      alert('Please fill in all required fields correctly');
      return;
    }

    this.isSaving.set(true);
    
    const endpoint = this.editingCoupon 
      ? `${environment.apiUrl}/provider/coupons/${this.editingCoupon.id}`
      : `${environment.apiUrl}/provider/coupons`;
    
    const request$ = this.editingCoupon 
      ? this.http.put<ProviderCoupon>(endpoint, this.newCoupon)
      : this.http.post<ProviderCoupon>(endpoint, this.newCoupon);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.loadCoupons();
        this.cancelForm();
        alert(`✅ Coupon ${this.editingCoupon ? 'updated' : 'created'} successfully!`);
      },
      error: (error) => {
        this.isSaving.set(false);
        console.error('Failed to save coupon:', error);
        
        if (error.status === 409) {
          alert('❌ A coupon with this code already exists in your shop. Please use a different code.');
        } else if (error.status === 400) {
          alert('❌ Invalid coupon data. Please check your inputs.');
        } else {
          alert('❌ Failed to save coupon. Please try again.');
        }
      }
    });
  }

  editCoupon(coupon: ProviderCoupon): void {
    this.editingCoupon = coupon;
    this.newCoupon = { ...coupon };
    this.showCreateForm = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleCouponStatus(coupon: ProviderCoupon): void {
    const newStatus = !coupon.isActive;
    
    this.http.patch(`${environment.apiUrl}/provider/coupons/${coupon.id}/status`, { 
      isActive: newStatus 
    }).subscribe({
      next: () => {
        coupon.isActive = newStatus;
        this.coupons.update(list => [...list]);
        alert(`✅ Coupon ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      },
      error: () => {
        alert('❌ Failed to update coupon status.');
      }
    });
  }

  deleteCoupon(coupon: ProviderCoupon): void {
    if (!confirm(`Are you sure you want to delete coupon "${coupon.code}"? This action cannot be undone.`)) {
      return;
    }
    
    this.http.delete(`${environment.apiUrl}/provider/coupons/${coupon.id}`).subscribe({
      next: () => {
        this.loadCoupons();
        alert('✅ Coupon deleted successfully!');
      },
      error: () => {
        alert('❌ Failed to delete coupon. Please try again.');
      }
    });
  }

  cancelForm(): void {
    this.showCreateForm = false;
    this.editingCoupon = null;
    this.newCoupon = this.getEmptyCoupon();
  }

  getUsagePercentage(coupon: ProviderCoupon): number {
    if (!coupon.usageLimit) return 0;
    return Math.min(100, ((coupon.usageCount || 0) / coupon.usageLimit) * 100);
  }

  isExpired(coupon: ProviderCoupon): boolean {
    return new Date(coupon.validUntil) < new Date();
  }

  isExpiringSoon(coupon: ProviderCoupon): boolean {
    const daysUntilExpiry = Math.ceil(
      (new Date(coupon.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  }
}
