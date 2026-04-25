import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environment';

interface Coupon {
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
  scope: 'GLOBAL' | 'SHOP_SPECIFIC';
  shopId?: string;
}

@Component({
  selector: 'app-coupons-discounts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <span class="text-3xl">🎟️</span>
              Coupons & Discounts
            </h1>
            <p class="text-gray-600 mt-1">Create and manage discount coupons for shops and users</p>
          </div>
          <button 
            (click)="showCreateForm = true"
            class="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg flex items-center gap-2">
            <span class="text-xl">➕</span>
            Create Coupon
          </button>
        </div>
      </div>

      <!-- Create/Edit Form -->
      @if (showCreateForm) {
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <span>✨</span>
              {{ editingCoupon ? 'Edit Coupon' : 'Create New Coupon' }}
            </h2>
          </div>
          
          <div class="p-6 space-y-6">
            <!-- Coupon Code -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Coupon Code *
              </label>
              <input 
                type="text" 
                [(ngModel)]="newCoupon.code"
                placeholder="e.g., SUMMER2024"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent uppercase">
              <p class="text-xs text-gray-500 mt-1">Use uppercase letters and numbers only</p>
            </div>

            <!-- Discount Type & Value -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Discount Type *
                </label>
                <select 
                  [(ngModel)]="newCoupon.discountType"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount ($)</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Discount Value *
                </label>
                <input 
                  type="number" 
                  [(ngModel)]="newCoupon.discountValue"
                  [placeholder]="newCoupon.discountType === 'PERCENTAGE' ? 'e.g., 20' : 'e.g., 50'"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
              </div>
            </div>

            <!-- Min Order & Max Discount -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Order Amount ($)
                </label>
                <input 
                  type="number" 
                  [(ngModel)]="newCoupon.minOrderAmount"
                  placeholder="Optional"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Discount ($)
                </label>
                <input 
                  type="number" 
                  [(ngModel)]="newCoupon.maxDiscount"
                  placeholder="Optional"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
              </div>
            </div>

            <!-- Usage Limit -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Usage Limit
              </label>
              <input 
                type="number" 
                [(ngModel)]="newCoupon.usageLimit"
                placeholder="Leave empty for unlimited"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
            </div>

            <!-- Validity Period -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Valid From *
                </label>
                <input 
                  type="date" 
                  [(ngModel)]="newCoupon.validFrom"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Valid Until *
                </label>
                <input 
                  type="date" 
                  [(ngModel)]="newCoupon.validUntil"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
              </div>
            </div>

            <!-- Scope -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Coupon Scope *
              </label>
              <select 
                [(ngModel)]="newCoupon.scope"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                <option value="GLOBAL">Global (All Users)</option>
                <option value="SHOP_SPECIFIC">Shop Specific</option>
              </select>
            </div>

            <!-- Shop ID (if shop specific) -->
            @if (newCoupon.scope === 'SHOP_SPECIFIC') {
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Shop ID *
                </label>
                <input 
                  type="text" 
                  [(ngModel)]="newCoupon.shopId"
                  placeholder="Enter shop ID"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
              </div>
            }

            <!-- Active Status -->
            <div class="flex items-center gap-3">
              <input 
                type="checkbox" 
                [(ngModel)]="newCoupon.isActive"
                id="isActive"
                class="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500">
              <label for="isActive" class="text-sm font-medium text-gray-700">
                Activate coupon immediately
              </label>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
              <button 
                (click)="cancelForm()"
                class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button 
                (click)="saveCoupon()"
                [disabled]="isSaving"
                class="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg disabled:opacity-50">
                {{ isSaving ? 'Saving...' : 'Save Coupon' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Coupons List -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Active Coupons</h2>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scope</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Until</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              @for (coupon of coupons; track coupon.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="font-mono font-bold text-red-600">{{ coupon.code }}</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm text-gray-900">
                      {{ coupon.discountType === 'PERCENTAGE' ? coupon.discountValue + '%' : '$' + coupon.discountValue }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs rounded-full" 
                          [class]="coupon.scope === 'GLOBAL' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'">
                      {{ coupon.scope === 'GLOBAL' ? '🌍 Global' : '🏪 Shop' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ coupon.usageCount || 0 }} / {{ coupon.usageLimit || '∞' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ coupon.validUntil | date:'short' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs rounded-full" 
                          [class]="coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                      {{ coupon.isActive ? '✅ Active' : '⏸️ Inactive' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <button 
                      (click)="toggleCouponStatus(coupon)"
                      class="text-blue-600 hover:text-blue-800 mr-3">
                      {{ coupon.isActive ? 'Deactivate' : 'Activate' }}
                    </button>
                    <button 
                      (click)="deleteCoupon(coupon)"
                      class="text-red-600 hover:text-red-800">
                      Delete
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                    <div class="text-4xl mb-2">🎟️</div>
                    <p>No coupons created yet. Click "Create Coupon" to get started.</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
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
export class CouponsDiscountsComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  showCreateForm = false;
  isSaving = false;
  editingCoupon: Coupon | null = null;
  
  coupons: Coupon[] = [];
  
  newCoupon: Coupon = {
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true,
    scope: 'GLOBAL'
  };

  ngOnInit(): void {
    // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.loadCoupons();
    }, 0);
  }

  private loadCoupons(): void {
    this.http.get<Coupon[]>(`${environment.apiUrl}/admin/coupons`).subscribe({
      next: (data) => {
        this.coupons = data;
      },
      error: () => {
        // Mock data for demonstration
        this.coupons = [
          {
            id: '1',
            code: 'WELCOME20',
            discountType: 'PERCENTAGE',
            discountValue: 20,
            minOrderAmount: 50,
            usageLimit: 100,
            usageCount: 45,
            validFrom: '2024-01-01',
            validUntil: '2024-12-31',
            isActive: true,
            scope: 'GLOBAL'
          }
        ];
      }
    });
  }

  saveCoupon(): void {
    if (!this.newCoupon.code || !this.newCoupon.discountValue) {
      alert('Please fill in all required fields');
      return;
    }

    this.isSaving = true;
    
    const endpoint = this.editingCoupon 
      ? `${environment.apiUrl}/admin/coupons/${this.editingCoupon.id}`
      : `${environment.apiUrl}/admin/coupons`;
    
    const request$ = this.editingCoupon 
      ? this.http.put<Coupon>(endpoint, this.newCoupon)
      : this.http.post<Coupon>(endpoint, this.newCoupon);

    request$.subscribe({
      next: () => {
        this.isSaving = false;
        this.loadCoupons();
        this.cancelForm();
        alert('Coupon saved successfully!');
      },
      error: () => {
        this.isSaving = false;
        alert('Failed to save coupon. Please try again.');
      }
    });
  }

  toggleCouponStatus(coupon: Coupon): void {
    coupon.isActive = !coupon.isActive;
    this.http.patch(`${environment.apiUrl}/admin/coupons/${coupon.id}/status`, { isActive: coupon.isActive }).subscribe({
      next: () => {
        alert(`Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully!`);
      },
      error: () => {
        coupon.isActive = !coupon.isActive; // Revert on error
        alert('Failed to update coupon status.');
      }
    });
  }

  deleteCoupon(coupon: Coupon): void {
    if (confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) {
      this.http.delete(`${environment.apiUrl}/admin/coupons/${coupon.id}`).subscribe({
        next: () => {
          this.loadCoupons();
          alert('Coupon deleted successfully!');
        },
        error: () => {
          alert('Failed to delete coupon.');
        }
      });
    }
  }

  cancelForm(): void {
    this.showCreateForm = false;
    this.editingCoupon = null;
    this.newCoupon = {
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: 0,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
      scope: 'GLOBAL'
    };
  }
}
