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

interface ShopInfo {
  id: string;
  name: string;
  orderCount: number;
  revenue: number;
  productCount: number;
  ownerEmail?: string;
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
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-sm font-medium text-gray-700">Shop ID *</label>
                  <button (click)="openShopAI()"
                          class="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white rounded-lg transition-all"
                          style="background: linear-gradient(135deg, #4a9e7f, #2d7a5f);">
                    🤖 Find Most Active Shops
                  </button>
                </div>
                <input
                  type="text"
                  [(ngModel)]="newCoupon.shopId"
                  placeholder="Enter shop ID or use AI to find active shops"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                @if (newCoupon.shopId) {
                  <p class="text-xs mt-1" style="color: #4a9e7f;">
                    ✅ Shop ID set: {{ newCoupon.shopId }}
                  </p>
                }
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
            <div class="flex items-center justify-between pt-4 border-t border-gray-200">
              <!-- 🤖 Help with AI -->
              <button
                (click)="openCouponFormAI()"
                class="flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-xl transition-all shadow-md"
                style="background: linear-gradient(135deg, #4a9e7f, #2d7a5f);">
                🤖 Help with AI
              </button>
              <div class="flex items-center gap-3">
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

    <!-- ============================================================ -->
    <!-- 🤖 AI SHOP FINDER MODAL                                      -->
    <!-- ============================================================ -->
    @if (showShopAI) {
      <div class="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm flex items-center justify-center p-4"
           (click)="closeShopAI()">
        <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
             (click)="$event.stopPropagation()"
             style="animation: popIn 0.22s cubic-bezier(0.34,1.56,0.64,1);">

          <div class="px-6 pt-6 pb-4 flex items-start justify-between"
               style="background: linear-gradient(135deg, #f0faf5, #e6f5ee); border-bottom: 1px solid #c8e6d4;">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                   style="background: linear-gradient(135deg, #4a9e7f, #2d7a5f);">🏪</div>
              <div>
                <h2 class="font-black text-lg" style="color: #1a3d2e;">AI Shop Finder</h2>
                <p class="text-xs" style="color: #5a8a72;">Most active shops — best candidates for targeted coupons</p>
              </div>
            </div>
            <button (click)="closeShopAI()"
                    class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style="background: #d4ede0; color: #2d7a5f;">✕</button>
          </div>

          <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            @if (shopAILoading) {
              <div class="text-center py-10">
                <div class="flex justify-center mb-3">
                  <div class="w-8 h-8 rounded-full animate-spin"
                       style="border: 3px solid #c8e6d4; border-top-color: #4a9e7f;"></div>
                </div>
                <p class="font-semibold" style="color: #1a3d2e;">Loading all shops...</p>
              </div>
            }

            @if (!shopAILoading && topShops.length > 0) {
              <p class="text-xs" style="color: #5a8a72;">
                Click a shop to select it for your coupon. Shops are ranked by activity.
              </p>
              @for (shop of topShops; track shop.id; let i = $index) {
                <div class="rounded-xl p-4 cursor-pointer transition-all hover:shadow-md"
                     [style.border]="newCoupon.shopId === shop.id ? '2px solid #4a9e7f' : '1px solid #e0f0e8'"
                     [style.background]="newCoupon.shopId === shop.id ? '#f0faf5' : '#f8fdfb'"
                     (click)="selectShop(shop)">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
                            [style.background]="i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : i === 2 ? '#b45309' : '#4a9e7f'">
                        {{ i + 1 }}
                      </span>
                      <p class="font-bold text-sm" style="color: #1a3d2e;">{{ shop.name }}</p>
                    </div>
                    @if (newCoupon.shopId === shop.id) {
                      <span class="text-xs font-bold px-2 py-0.5 rounded-full"
                            style="background: #d4ede0; color: #2d7a5f;">✅ Selected</span>
                    }
                  </div>
                  <div class="grid grid-cols-3 gap-2 text-xs" style="color: #5a8a72;">
                    <div>
                      <p class="font-semibold" style="color: #1a3d2e;">{{ shop.orderCount }}</p>
                      <p>Orders</p>
                    </div>
                    <div>
                      <p class="font-semibold" style="color: #1a3d2e;">{{ shop.revenue | number:'1.0-0' }} TND</p>
                      <p>Revenue</p>
                    </div>
                    <div>
                      <p class="font-semibold" style="color: #1a3d2e;">{{ shop.productCount }}</p>
                      <p>Products</p>
                    </div>
                  </div>
                  <p class="text-xs mt-1" style="color: #8aaa96;">ID: {{ shop.id }}</p>
                </div>
              }
            }

            @if (!shopAILoading && topShops.length === 0) {
              <div class="text-center py-8">
                <p class="text-gray-500">No shops found</p>
              </div>
            }
          </div>

          <div class="px-6 py-4 flex gap-3" style="border-top: 1px solid #e0f0e8; background: #f8fdfb;">
            <button (click)="loadTopShops()"
                    [disabled]="shopAILoading"
                    class="px-4 py-2.5 text-sm font-bold rounded-xl disabled:opacity-40"
                    style="background: #e0f0e8; color: #2d7a5f;">🔄</button>
            <button (click)="closeShopAI()"
                    class="flex-1 py-2.5 text-sm font-bold rounded-xl"
                    style="background: #f0f0f0; color: #555;">Close</button>
          </div>
        </div>
      </div>
    }

    <!-- ============================================================ -->
    <!-- 🤖 AI COUPON FORM ADVISOR MODAL                              -->
    <!-- ============================================================ -->
    @if (showCouponFormAI) {
      <div class="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm flex items-center justify-center p-4"
           (click)="closeCouponFormAI()">
        <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
             (click)="$event.stopPropagation()"
             style="animation: popIn 0.22s cubic-bezier(0.34,1.56,0.64,1);">

          <!-- Header -->
          <div class="px-6 pt-6 pb-4 flex items-start justify-between"
               style="background: linear-gradient(135deg, #f0faf5, #e6f5ee); border-bottom: 1px solid #c8e6d4;">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                   style="background: linear-gradient(135deg, #4a9e7f, #2d7a5f);">🤖</div>
              <div>
                <h2 class="font-black text-lg" style="color: #1a3d2e;">AI Coupon Advisor</h2>
                <p class="text-xs" style="color: #5a8a72;">Smart suggestions based on your current form</p>
              </div>
            </div>
            <button (click)="closeCouponFormAI()"
                    class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style="background: #d4ede0; color: #2d7a5f;">✕</button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            @if (couponFormAILoading) {
              <div class="text-center py-10">
                <div class="flex justify-center mb-3">
                  <div class="w-8 h-8 rounded-full animate-spin"
                       style="border: 3px solid #c8e6d4; border-top-color: #4a9e7f;"></div>
                </div>
                <p class="font-semibold" style="color: #1a3d2e;">Analyzing platform data...</p>
              </div>
            }

            @if (!couponFormAILoading && couponFormAISuggestion) {

              <!-- Verdict -->
              <div class="rounded-2xl p-5 text-center"
                   style="background: linear-gradient(135deg, #e6f5ee, #d4ede0); border: 1px solid #b8dfc8;">
                <div class="text-4xl mb-2">{{ couponFormAISuggestion.verdict === 'GOOD' ? '✅' : '⚠️' }}</div>
                <p class="font-black text-lg" style="color: #1a3d2e;">{{ couponFormAISuggestion.title }}</p>
                <p class="text-sm mt-1" style="color: #2d7a5f;">{{ couponFormAISuggestion.summary }}</p>
              </div>

              <!-- Suggested values -->
              <div class="rounded-xl p-4" style="background: #f8fdfb; border: 1px solid #e0f0e8;">
                <p class="text-xs font-bold mb-3" style="color: #2d7a5f;">💡 Suggested Values</p>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <p class="text-xs" style="color: #5a8a72;">Discount</p>
                    <p class="font-black text-xl" style="color: #1a3d2e;">{{ couponFormAISuggestion.suggestedDiscount }}%</p>
                  </div>
                  <div>
                    <p class="text-xs" style="color: #5a8a72;">Duration</p>
                    <p class="font-bold text-lg" style="color: #1a3d2e;">{{ couponFormAISuggestion.suggestedDays }} days</p>
                  </div>
                  <div>
                    <p class="text-xs" style="color: #5a8a72;">Min Order</p>
                    <p class="font-bold" style="color: #1a3d2e;">
                      {{ couponFormAISuggestion.suggestedMinOrder > 0 ? couponFormAISuggestion.suggestedMinOrder + ' TND' : 'None' }}
                    </p>
                  </div>
                  <div>
                    <p class="text-xs" style="color: #5a8a72;">Scope</p>
                    <p class="font-bold" style="color: #1a3d2e;">{{ couponFormAISuggestion.suggestedScope }}</p>
                  </div>
                </div>
              </div>

              <!-- Expected impact -->
              <div class="rounded-xl p-4" style="background: #f0faf5; border: 1px solid #c8e6d4;">
                <p class="text-xs font-bold mb-1" style="color: #2d7a5f;">📈 Expected Impact</p>
                <p class="text-sm" style="color: #1a3d2e;">{{ couponFormAISuggestion.impact }}</p>
              </div>

              <!-- Tips -->
              <div class="rounded-xl p-4" style="background: #fffbf0; border: 1px solid #f0e0a0;">
                <p class="text-xs font-bold mb-2" style="color: #8a6d00;">💡 Tips</p>
                <ul class="space-y-1.5">
                  @for (tip of couponFormAISuggestion.tips; track $index) {
                    <li class="text-xs flex items-start gap-1.5" style="color: #5a4a00;">
                      <span style="color: #4a9e7f;">•</span><span>{{ tip }}</span>
                    </li>
                  }
                </ul>
              </div>

            }
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 flex gap-3" style="border-top: 1px solid #e0f0e8; background: #f8fdfb;">
            @if (couponFormAISuggestion) {
              <button (click)="applyCouponFormAI()"
                      class="flex-1 py-2.5 text-white text-sm font-bold rounded-xl"
                      style="background: linear-gradient(135deg, #4a9e7f, #2d7a5f);">
                ✅ Apply Suggestions
              </button>
            }
            <button (click)="analyzeCouponForm()"
                    [disabled]="couponFormAILoading"
                    class="px-4 py-2.5 text-sm font-bold rounded-xl disabled:opacity-40"
                    style="background: #e0f0e8; color: #2d7a5f;">🔄</button>
            <button (click)="closeCouponFormAI()"
                    class="px-5 py-2.5 text-sm font-bold rounded-xl"
                    style="background: #f0f0f0; color: #555;">Close</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    @keyframes popIn {
      from { transform: scale(0.88) translateY(16px); opacity: 0; }
      to   { transform: scale(1) translateY(0); opacity: 1; }
    }
  `]
})
export class CouponsDiscountsComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  // ── AI Shop Finder ───────────────────────────────────────────
  showShopAI = false;
  shopAILoading = false;
  topShops: ShopInfo[] = [];

  openShopAI(): void {
    this.showShopAI = true;
    if (this.topShops.length === 0) this.loadTopShops();
  }

  closeShopAI(): void { this.showShopAI = false; }

  // ── AI Coupon Form Advisor ───────────────────────────────────
  showCouponFormAI = false;
  couponFormAILoading = false;
  couponFormAISuggestion: any = null;

  openCouponFormAI(): void {
    this.showCouponFormAI = true;
    this.couponFormAISuggestion = null;
    this.analyzeCouponForm();
  }

  closeCouponFormAI(): void { this.showCouponFormAI = false; }

  analyzeCouponForm(): void {
    this.couponFormAILoading = true;
    this.couponFormAISuggestion = null;

    // Load platform stats to give context-aware advice
    this.http.get<any[]>(`${environment.apiUrl}/admin/coupons`).subscribe({
      next: (existingCoupons) => {
        const activeCoupons = existingCoupons.filter(c => c.isActive).length;
        const globalCoupons = existingCoupons.filter(c => c.scope === 'GLOBAL').length;
        const shopCoupons   = existingCoupons.filter(c => c.scope === 'SHOP_SPECIFIC').length;

        setTimeout(() => {
          this.couponFormAISuggestion = this.buildCouponFormSuggestion({
            activeCoupons, globalCoupons, shopCoupons,
            currentDiscount: this.newCoupon.discountValue,
            currentScope: this.newCoupon.scope,
            currentType: this.newCoupon.discountType
          });
          this.couponFormAILoading = false;
        }, 700);
      },
      error: () => {
        setTimeout(() => {
          this.couponFormAISuggestion = this.buildCouponFormSuggestion({
            activeCoupons: 0, globalCoupons: 0, shopCoupons: 0,
            currentDiscount: this.newCoupon.discountValue,
            currentScope: this.newCoupon.scope,
            currentType: this.newCoupon.discountType
          });
          this.couponFormAILoading = false;
        }, 700);
      }
    });
  }

  private buildCouponFormSuggestion(data: any): any {
    const { activeCoupons, globalCoupons, currentDiscount, currentScope } = data;

    // Determine best discount
    let suggestedDiscount = 10;
    let verdict: 'GOOD' | 'WARN' = 'GOOD';
    let title = 'Good Coupon Setup';
    let summary = 'Your coupon configuration looks solid.';
    const tips: string[] = [];

    if (currentDiscount > 30) {
      verdict = 'WARN';
      title = 'Discount May Be Too High';
      summary = 'Discounts above 30% can hurt your margin significantly.';
      suggestedDiscount = 20;
      tips.push('Keep discounts between 5–20% to stay profitable');
    } else if (currentDiscount === 0) {
      title = 'Set a Discount Value';
      summary = 'AI suggests 10% for a balanced first coupon.';
      suggestedDiscount = 10;
    } else {
      suggestedDiscount = currentDiscount || 10;
      tips.push(`${currentDiscount}% is a reasonable discount — good balance of attraction and margin`);
    }

    if (activeCoupons > 5) {
      tips.push(`You already have ${activeCoupons} active coupons — avoid coupon fatigue`);
    }

    if (globalCoupons > 3) {
      tips.push('Consider SHOP_SPECIFIC scope to target underperforming shops');
    }

    // Suggested duration based on scope
    const suggestedDays = currentScope === 'GLOBAL' ? 7 : 14;
    const suggestedMinOrder = suggestedDiscount >= 15 ? 100 : 50;
    const suggestedScope = globalCoupons < 2 ? 'GLOBAL' : 'SHOP_SPECIFIC';

    tips.push(`Set validity to ${suggestedDays} days — creates urgency without being too short`);
    tips.push(`Minimum order of ${suggestedMinOrder} TND protects your platform margin`);
    tips.push('Use uppercase alphanumeric codes for easy sharing (e.g., SAVE10MAY)');

    const month = new Date().toLocaleString('en', { month: 'short' }).toUpperCase();
    const suggestedCode = `ADMIN${suggestedDiscount}${month}`;

    return {
      verdict, title, summary,
      suggestedDiscount, suggestedDays, suggestedMinOrder,
      suggestedScope, suggestedCode,
      impact: `Expected +${Math.round(suggestedDiscount * 1.5)}% order volume over ${suggestedDays} days`,
      tips
    };
  }

  applyCouponFormAI(): void {
    const s = this.couponFormAISuggestion;
    if (!s) return;
    if (!this.newCoupon.code) this.newCoupon.code = s.suggestedCode;
    this.newCoupon.discountValue = s.suggestedDiscount;
    this.newCoupon.discountType = 'PERCENTAGE';
    this.newCoupon.minOrderAmount = s.suggestedMinOrder;
    this.newCoupon.validUntil = new Date(Date.now() + s.suggestedDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    this.closeCouponFormAI();
  }

  loadTopShops(): void {
    this.shopAILoading = true;
    this.topShops = [];

    // Load all shops
    this.http.get<any[]>(`${environment.apiUrl}/shops`).subscribe({
      next: (shops) => {
        // Load order stats for each shop (best effort)
        this.http.get<any[]>(`${environment.apiUrl}/admin/orders`).subscribe({
          next: (orders) => {
            const shopMap = new Map<string, ShopInfo>();
            shops.forEach(s => shopMap.set(s.id, {
              id: s.id, name: s.name || 'Unknown Shop',
              orderCount: 0, revenue: 0,
              productCount: s.productCount || 0,
              ownerEmail: s.ownerEmail
            }));
            orders.forEach((o: any) => {
              if (o.shopId && shopMap.has(o.shopId)) {
                const info = shopMap.get(o.shopId)!;
                info.orderCount++;
                info.revenue += o.total || 0;
              }
            });
            this.topShops = Array.from(shopMap.values())
              .sort((a, b) => b.orderCount - a.orderCount)
              .slice(0, 10);
            this.shopAILoading = false;
          },
          error: () => {
            // Fallback: just show shops without order stats
            this.topShops = shops.slice(0, 10).map(s => ({
              id: s.id, name: s.name || 'Unknown Shop',
              orderCount: 0, revenue: 0,
              productCount: s.productCount || 0,
              ownerEmail: s.ownerEmail
            }));
            this.shopAILoading = false;
          }
        });
      },
      error: () => { this.shopAILoading = false; }
    });
  }

  selectShop(shop: ShopInfo): void {
    this.newCoupon.shopId = shop.id;
    this.closeShopAI();
  }
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
