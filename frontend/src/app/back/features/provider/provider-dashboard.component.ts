import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProviderShopService, ShopDto } from '../../../core/services/provider-shop.service';
import { AuthService } from '../../../front/core/auth.service';
import { NegotiationService } from '../../../front/core/negotiation.service';

@Component({
  selector: 'app-provider-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Header -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-black text-gray-900 mb-2">
                Provider Dashboard
              </h1>
              <p class="text-gray-600">
                Welcome back, {{ currentUser()?.firstName }}! Manage your shop and products.
              </p>
            </div>
            <div class="text-right">
              <div class="text-sm text-gray-500">Account Status</div>
              <div class="flex items-center gap-2 mt-1">
                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                <span class="font-semibold text-green-600">Active Provider</span>
              </div>
            </div>
          </div>
        </div>

        @if (isLoading()) {
          <!-- Loading State -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
            <div class="inline-block w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-4"></div>
            <p class="text-gray-600">Loading dashboard...</p>
          </div>
        } @else {
          <!-- Quick Actions -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            
            <!-- Shop Management -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group">
              <div class="flex items-center gap-4 mb-4">
                <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🏪
                </div>
                <div>
                  <h3 class="font-bold text-gray-900">Shop Management</h3>
                  <p class="text-sm text-gray-600">
                    {{ hasShop() ? 'Manage your shop' : 'Create your shop' }}
                  </p>
                </div>
              </div>
              
              @if (hasShop() && currentShop()) {
                <div class="space-y-2 mb-4">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Shop Name:</span>
                    <span class="font-medium">{{ currentShop()?.name }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Products:</span>
                    <span class="font-medium">{{ currentShop()?.productCount || 0 }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Status:</span>
                    <span class="font-medium" 
                          [class.text-green-600]="currentShop()?.isActive"
                          [class.text-red-600]="!currentShop()?.isActive">
                      {{ currentShop()?.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                </div>
              } @else {
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p class="text-sm text-yellow-800">
                    <span class="font-medium">⚠️ No shop found.</span>
                    Create your shop to start selling.
                  </p>
                </div>
              }
              
              <a routerLink="/admin/provider/shop" 
                 class="block w-full text-center py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-all">
                {{ hasShop() ? 'Manage Shop' : 'Create Shop' }}
              </a>
            </div>

            <!-- Product Management -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group">
              <div class="flex items-center gap-4 mb-4">
                <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  📦
                </div>
                <div>
                  <h3 class="font-bold text-gray-900">Products</h3>
                  <p class="text-sm text-gray-600">Manage your inventory</p>
                </div>
              </div>
              
              @if (hasShop()) {
                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div class="text-center p-3 bg-blue-50 rounded-lg">
                    <div class="text-lg font-bold text-blue-600">{{ currentShop()?.productCount || 0 }}</div>
                    <div class="text-xs text-blue-700">Total</div>
                  </div>
                  <div class="text-center p-3 bg-green-50 rounded-lg">
                    <div class="text-lg font-bold text-green-600">{{ currentShop()?.approvedProductCount || 0 }}</div>
                    <div class="text-xs text-green-700">Approved</div>
                  </div>
                </div>
              } @else {
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                  <p class="text-sm text-gray-600 text-center">
                    Create a shop first to manage products
                  </p>
                </div>
              }
              
              <a routerLink="/admin/marketplace/products" 
                 class="block w-full text-center py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all"
                 [class.opacity-50]="!hasShop()"
                 [class.pointer-events-none]="!hasShop()">
                Manage Products
              </a>
            </div>

            <!-- Negotiations -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group">
              <div class="flex items-center gap-4 mb-4">
                <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🤝
                </div>
                <div>
                  <h3 class="font-bold text-gray-900">Negotiations</h3>
                  <p class="text-sm text-gray-600">Handle price offers</p>
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="text-center p-3 bg-orange-50 rounded-lg">
                  <div class="text-lg font-bold text-orange-600">{{ activeNegotiationsCount() }}</div>
                  <div class="text-xs text-orange-700">Active</div>
                </div>
                <div class="text-center p-3 bg-blue-50 rounded-lg">
                  <div class="text-lg font-bold text-blue-600">{{ totalNegotiationsCount() }}</div>
                  <div class="text-xs text-blue-700">Total</div>
                </div>
              </div>
              
              <a routerLink="/admin/negotiations" 
                 class="block w-full text-center py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-all">
                View Negotiations
              </a>
            </div>

            <!-- Orders & Sales -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group">
              <div class="flex items-center gap-4 mb-4">
                <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  📊
                </div>
                <div>
                  <h3 class="font-bold text-gray-900">Orders & Sales</h3>
                  <p class="text-sm text-gray-600">Track your performance</p>
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="text-center p-3 bg-purple-50 rounded-lg">
                  <div class="text-lg font-bold text-purple-600">0</div>
                  <div class="text-xs text-purple-700">Orders</div>
                </div>
                <div class="text-center p-3 bg-orange-50 rounded-lg">
                  <div class="text-lg font-bold text-orange-600">0 TND</div>
                  <div class="text-xs text-orange-700">Revenue</div>
                </div>
              </div>
              
              <a routerLink="/admin/orders" 
                 class="block w-full text-center py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-all">
                View Orders
              </a>
            </div>
          </div>

          <!-- Shop Overview (if shop exists) -->
          @if (hasShop() && currentShop()) {
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
              <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span class="text-2xl">🏪</span>
                {{ currentShop()?.name }}
              </h2>
              
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Shop Info -->
                <div class="lg:col-span-2">
                  <div class="flex items-start gap-4 mb-6">
                    @if (currentShop()?.logo) {
                      <img 
                        [src]="currentShop()?.logo" 
                        [alt]="currentShop()?.name"
                        class="w-16 h-16 object-cover rounded-xl border border-gray-200"
                      />
                    } @else {
                      <div class="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                        🏪
                      </div>
                    }
                    <div class="flex-1">
                      <h3 class="font-bold text-gray-900 text-lg">{{ currentShop()?.name }}</h3>
                      <p class="text-gray-600 text-sm mb-2">{{ currentShop()?.description }}</p>
                      @if (currentShop()?.address) {
                        <p class="text-gray-500 text-sm flex items-center gap-1">
                          📍 {{ currentShop()?.address }}
                        </p>
                      }
                    </div>
                  </div>

                  <!-- Contact Info -->
                  @if (currentShop()?.email || currentShop()?.phone) {
                    <div class="border-t border-gray-100 pt-4 mb-6">
                      <h4 class="font-semibold text-gray-900 mb-3">Contact Information</h4>
                      <div class="space-y-2">
                        @if (currentShop()?.email) {
                          <div class="flex items-center gap-2 text-sm">
                            <span class="text-gray-400">📧</span>
                            <span class="text-gray-600">{{ currentShop()?.email }}</span>
                          </div>
                        }
                        @if (currentShop()?.phone) {
                          <div class="flex items-center gap-2 text-sm">
                            <span class="text-gray-400">📞</span>
                            <span class="text-gray-600">{{ currentShop()?.phone }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <!-- Social Links -->
                  @if (hasSocialLinks()) {
                    <div class="border-t border-gray-100 pt-4">
                      <h4 class="font-semibold text-gray-900 mb-3">Social Media</h4>
                      <div class="flex gap-3">
                        @if (currentShop()?.socialLinks?.facebook) {
                          <a [href]="currentShop()?.socialLinks?.facebook" target="_blank" 
                             class="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-200 transition-all">
                            📘
                          </a>
                        }
                        @if (currentShop()?.socialLinks?.instagram) {
                          <a [href]="currentShop()?.socialLinks?.instagram" target="_blank" 
                             class="w-8 h-8 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center hover:bg-pink-200 transition-all">
                            📷
                          </a>
                        }
                        @if (currentShop()?.socialLinks?.website) {
                          <a [href]="currentShop()?.socialLinks?.website" target="_blank" 
                             class="w-8 h-8 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-all">
                            🌍
                          </a>
                        }
                        @if (currentShop()?.socialLinks?.linkedin) {
                          <a [href]="currentShop()?.socialLinks?.linkedin" target="_blank" 
                             class="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center hover:bg-blue-200 transition-all">
                            💼
                          </a>
                        }
                      </div>
                    </div>
                  }
                </div>

                <!-- Statistics -->
                <div>
                  <h4 class="font-semibold text-gray-900 mb-4">Shop Statistics</h4>
                  <div class="space-y-4">
                    <div class="bg-blue-50 rounded-lg p-4 text-center">
                      <div class="text-2xl font-black text-blue-600">{{ currentShop()?.productCount || 0 }}</div>
                      <div class="text-sm text-blue-700 font-medium">Total Products</div>
                    </div>
                    <div class="bg-green-50 rounded-lg p-4 text-center">
                      <div class="text-2xl font-black text-green-600">{{ currentShop()?.approvedProductCount || 0 }}</div>
                      <div class="text-sm text-green-700 font-medium">Approved Products</div>
                    </div>
                    <div class="bg-yellow-50 rounded-lg p-4 text-center">
                      <div class="text-2xl font-black text-yellow-600">{{ currentShop()?.averageRating || 0 }}</div>
                      <div class="text-sm text-yellow-700 font-medium">Average Rating</div>
                    </div>
                    <div class="bg-purple-50 rounded-lg p-4 text-center">
                      <div class="text-2xl font-black text-purple-600">{{ currentShop()?.totalReviews || 0 }}</div>
                      <div class="text-sm text-purple-700 font-medium">Total Reviews</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Getting Started (if no shop) -->
          @if (!hasShop()) {
            <div class="bg-gradient-to-r from-primary to-primary-dark rounded-2xl shadow-sm p-8 text-white">
              <div class="max-w-3xl">
                <h2 class="text-2xl font-bold mb-4">🚀 Get Started with Your Shop</h2>
                <p class="text-primary-light mb-6">
                  Welcome to the ESPRIT Marketplace! To start selling your products, you'll need to create your shop first. 
                  This will be your storefront where customers can discover and purchase your products.
                </p>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div class="bg-white/10 rounded-lg p-4">
                    <div class="text-2xl mb-2">1️⃣</div>
                    <h3 class="font-semibold mb-1">Create Shop</h3>
                    <p class="text-sm text-primary-light">Set up your shop with name, description, and contact info</p>
                  </div>
                  <div class="bg-white/10 rounded-lg p-4">
                    <div class="text-2xl mb-2">2️⃣</div>
                    <h3 class="font-semibold mb-1">Add Products</h3>
                    <p class="text-sm text-primary-light">Upload your products with photos and descriptions</p>
                  </div>
                  <div class="bg-white/10 rounded-lg p-4">
                    <div class="text-2xl mb-2">3️⃣</div>
                    <h3 class="font-semibold mb-1">Start Selling</h3>
                    <p class="text-sm text-primary-light">Once approved, your products will be visible to customers</p>
                  </div>
                </div>
                
                <a routerLink="/admin/provider/shop" 
                   class="inline-block bg-white text-primary font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition-all">
                  Create Your Shop Now →
                </a>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `
})
export class ProviderDashboardComponent implements OnInit {
  private shopService = inject(ProviderShopService);
  private authService = inject(AuthService);
  private negotiationService = inject(NegotiationService);

  // State
  isLoading = signal(false);
  currentShop = signal<ShopDto | null>(null);
  activeNegotiationsCount = signal(0);
  totalNegotiationsCount = signal(0);
  currentUser = computed(() => this.authService.currentUser());
  hasShop = computed(() => !!this.currentShop());
  hasSocialLinks = computed(() => {
    const shop = this.currentShop();
    return shop?.socialLinks && Object.values(shop.socialLinks).some(link => !!link);
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    
    // Load shop info
    this.shopService.checkHasShop().subscribe({
      next: (hasShop) => {
        if (hasShop) {
          this.shopService.getMyShop().subscribe({
            next: (shop) => {
              this.currentShop.set(shop);
              this.isLoading.set(false);
            },
            error: (err) => {
              console.error('Failed to load shop:', err);
              this.currentShop.set(null);
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

    // Load negotiation stats
    this.negotiationService.getProviderNegotiations().subscribe({
      next: (list: any) => {
        const negotiations = list.negotiations || list || [];
        this.totalNegotiationsCount.set(negotiations.length);
        this.activeNegotiationsCount.set(
          negotiations.filter((n: any) => n.status === 'PENDING' || n.status === 'IN_PROGRESS').length
        );
      },
      error: (err) => console.error('Failed to load negotiation stats:', err)
    });
  }
}