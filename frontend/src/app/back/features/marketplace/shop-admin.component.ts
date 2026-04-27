import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MarketplaceAdminService, ShopAdminDto } from '../../core/services/marketplace-admin.service';
import { AdminAuthService } from '../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-shop',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div class="max-w-7xl mx-auto p-8 space-y-8">

        <!-- Back Button -->
        <div>
          <a routerLink="/admin/marketplace" 
             class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-secondary hover:text-primary transition-all hover:gap-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md">
            <span class="text-lg">←</span>
            <span>Back to Marketplace</span>
          </a>
        </div>

        <!-- Header Section with Gradient -->
        <div class="relative overflow-hidden bg-gradient-to-br from-primary via-[#8B0000] to-[#5a0000] rounded-3xl shadow-2xl">
          <!-- Background Pattern -->
          <div class="absolute inset-0 opacity-10">
            <div class="absolute inset-0" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 32px 32px;"></div>
          </div>
          
          <!-- Decorative Elements -->
          <div class="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div class="absolute -left-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          
          <!-- Content -->
          <div class="relative z-10 p-10">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-4 mb-4">
                <div class="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl border border-white/30 shadow-lg">
                  🏪
                </div>
                <div>
                  <h1 class="text-4xl font-black text-white tracking-tight mb-2">
                    {{ isAdmin() ? 'Shops Management' : 'My Shop' }}
                  </h1>
                  <p class="text-white/80 font-medium text-lg">
                    {{ isAdmin() ? 'Monitor and manage all seller storefronts' : 'Manage your shop information and products' }}
                  </p>
                </div>
              </div>
              
              <button (click)="loadData()" 
                      class="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold rounded-xl transition-all border border-white/30 hover:scale-105 shadow-lg">
                <span class="text-lg">🔄</span>
                <span class="ml-2">Refresh</span>
              </button>
            </div>
            
            <!-- Quick Stats in Header -->
            <div class="grid grid-cols-3 gap-4 mt-6">
              <div class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">🏪</div>
                  <div>
                    <p class="text-white/70 text-xs font-bold uppercase tracking-wider">Total Shops</p>
                    <p class="text-3xl font-black text-white">{{ shops().length }}</p>
                  </div>
                </div>
              </div>
              <div class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">📦</div>
                  <div>
                    <p class="text-white/70 text-xs font-bold uppercase tracking-wider">Total Products</p>
                    <p class="text-3xl font-black text-white">{{ totalProducts() }}</p>
                  </div>
                </div>
              </div>
              <div class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">📊</div>
                  <div>
                    <p class="text-white/70 text-xs font-bold uppercase tracking-wider">Avg Products</p>
                    <p class="text-3xl font-black text-white">{{ averageProducts() }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Filters & Search Section -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-lg">�</div>
              <div>
                <h3 class="font-black text-dark text-sm">Shop Directory</h3>
                <p class="text-xs text-secondary">{{ shops().length }} {{ shops().length === 1 ? 'shop' : 'shops' }} registered</p>
              </div>
            </div>
            
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-bold">
                <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>All Active</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Shops Grid -->
        @if (isLoading()) {
          <div class="flex flex-col items-center gap-4 py-20">
            <div class="relative">
              <div class="w-16 h-16 border-4 border-gray-100 border-t-primary rounded-full animate-spin"></div>
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-2xl">🏪</span>
              </div>
            </div>
            <p class="text-sm font-black text-secondary uppercase tracking-widest">Loading shops...</p>
          </div>
        } @else if (shops().length === 0) {
          <div class="bg-white rounded-3xl border-2 border-dashed border-gray-200 shadow-sm p-20 text-center">
            <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-5xl mx-auto mb-6">
              🏪
            </div>
            <h3 class="text-2xl font-black text-dark mb-3">
              {{ isAdmin() ? 'No shops registered yet' : 'No shop found' }}
            </h3>
            <p class="text-secondary font-medium text-lg max-w-md mx-auto">
              {{ isAdmin() ? 'Shops will appear here once sellers register their storefronts on the platform.' : 'Contact the administrator to create your shop and start selling.' }}
            </p>
          </div>
        } @else {
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            @for (shop of shops(); track shop.id; let i = $index) {
              <div class="group relative bg-white rounded-3xl border-2 border-gray-100 hover:border-primary/30 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden">
                
                <!-- Top 3 Badge -->
                @if (i === 0 && shops().length > 1) {
                  <div class="absolute top-4 left-4 z-20 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-xl shadow-lg flex items-center gap-2 font-black text-xs uppercase tracking-wider animate-pulse">
                    <span class="text-base">👑</span>
                    <span>#1 Top Shop</span>
                  </div>
                }
                @if (i === 1 && shops().length > 2) {
                  <div class="absolute top-4 left-4 z-20 px-3 py-1.5 bg-gradient-to-r from-gray-300 to-gray-400 text-white rounded-xl shadow-lg flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                    <span class="text-base">🥈</span>
                    <span>#2</span>
                  </div>
                }
                @if (i === 2 && shops().length > 3) {
                  <div class="absolute top-4 left-4 z-20 px-3 py-1.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-xl shadow-lg flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                    <span class="text-base">🥉</span>
                    <span>#3</span>
                  </div>
                }
                
                <!-- Gradient Background on Hover -->
                <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <!-- Shop Header -->
                <div class="relative z-10 bg-gradient-to-br from-primary/5 to-primary/10 p-6 border-b-2 border-gray-100">
                  <div class="flex items-start justify-between mb-4">
                    <div class="relative">
                      <div class="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-4xl shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                        🏪
                      </div>
                      <!-- Active Badge -->
                      <div class="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                        <span class="text-white text-xs">✓</span>
                      </div>
                    </div>
                    
                    <!-- Product Count Badge -->
                    <div class="px-4 py-2 bg-white rounded-xl shadow-sm border border-primary/20">
                      <p class="text-xs font-bold text-primary">{{ shop.productCount || 0 }} Products</p>
                    </div>
                  </div>
                  
                  <h3 class="font-black text-dark text-xl mb-2 truncate group-hover:text-primary transition-colors">
                    {{ shop.name || 'Unnamed Shop' }}
                  </h3>
                  <p class="text-sm text-secondary font-medium line-clamp-2 min-h-[40px]">
                    {{ shop.description || 'No description available for this shop.' }}
                  </p>
                </div>

                <!-- Shop Details -->
                <div class="relative z-10 p-6 space-y-4">
                  
                  <!-- Owner Info -->
                  <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl group-hover:bg-primary/5 transition-colors">
                    <div class="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl flex items-center justify-center text-xl shadow-sm">
                      👤
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Shop Owner</p>
                      <p class="text-sm font-bold text-dark truncate">{{ shop.ownerName || 'Unknown Owner' }}</p>
                      @if (shop.ownerEmail) {
                        <p class="text-xs text-secondary truncate">{{ shop.ownerEmail }}</p>
                      }
                    </div>
                  </div>

                  <!-- Contact Info -->
                  @if (shop.phone || shop.address) {
                    <div class="space-y-2">
                      @if (shop.phone) {
                        <div class="flex items-center gap-2 text-sm">
                          <span class="text-primary">📞</span>
                          <span class="text-secondary font-medium">{{ shop.phone }}</span>
                        </div>
                      }
                      @if (shop.address) {
                        <div class="flex items-center gap-2 text-sm">
                          <span class="text-primary">📍</span>
                          <span class="text-secondary font-medium truncate">{{ shop.address }}</span>
                        </div>
                      }
                    </div>
                  }

                  <!-- Stats Grid -->
                  <div class="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                    <div class="text-center p-3 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl">
                      <p class="text-2xl font-black text-green-700">{{ shop.productCount || 0 }}</p>
                      <p class="text-[10px] font-bold text-green-600 uppercase tracking-wider">Products</p>
                    </div>
                    <div class="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl">
                      <p class="text-2xl font-black text-purple-700">{{ getShopRating(shop) }}</p>
                      <p class="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Rating</p>
                    </div>
                  </div>

                  <!-- Shop ID -->
                  <div class="pt-3 border-t border-gray-100">
                    <p class="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">Shop ID</p>
                    <div class="flex items-center gap-2">
                      <p class="flex-1 font-mono text-[10px] text-dark bg-gray-50 px-3 py-2 rounded-lg truncate">
                        {{ shop.id }}
                      </p>
                      <button class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" title="Copy ID">
                        📋
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Actions Footer -->
                <div class="relative z-10 p-6 pt-0 space-y-3">
                  <a [routerLink]="['/admin/marketplace/products']" [queryParams]="{shopId: shop.id}"
                     class="block text-center py-3.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-[#5a0000] text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-xl hover:scale-105">
                    <span class="mr-2">📦</span>
                    View Products
                  </a>
                  
                  @if (isAdmin()) {
                    <div class="grid grid-cols-2 gap-2">
                      <button class="py-2.5 bg-gray-100 hover:bg-gray-200 text-dark font-bold text-xs uppercase tracking-wider rounded-lg transition-all">
                        ✏️ Edit
                      </button>
                      <button class="py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs uppercase tracking-wider rounded-lg transition-all">
                        🗑️ Delete
                      </button>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- Summary Footer -->
        @if (!isLoading() && shops().length > 0) {
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-lg">📊</div>
                <div>
                  <p class="text-sm font-black text-dark">Platform Summary</p>
                  <p class="text-xs text-secondary">{{ shops().length }} active {{ shops().length === 1 ? 'shop' : 'shops' }} with {{ totalProducts() }} total products</p>
                </div>
              </div>
              
              <div class="flex items-center gap-4 text-sm">
                <div class="text-center">
                  <p class="text-2xl font-black text-primary">{{ averageProducts() }}</p>
                  <p class="text-xs text-secondary font-medium">Avg Products/Shop</p>
                </div>
                <div class="w-px h-12 bg-gray-200"></div>
                <div class="text-center">
                  <p class="text-2xl font-black text-green-600">{{ shops().length }}</p>
                  <p class="text-xs text-secondary font-medium">Active Sellers</p>
                </div>
              </div>
            </div>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    :host {
      animation: fadeIn 0.6s ease-out;
    }
    
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class ShopAdminComponent implements OnInit {
  private svc = inject(MarketplaceAdminService);
  private authService = inject(AdminAuthService);

  shops = signal<ShopAdminDto[]>([]);
  isLoading = signal(false);
  isAdmin = signal(false);
  isSeller = signal(false);

  totalProducts = computed(() => 
    this.shops().reduce((sum, shop) => sum + (shop.productCount || 0), 0)
  );

  averageProducts = computed(() => {
    const total = this.totalProducts();
    const count = this.shops().length;
    return count > 0 ? Math.round(total / count) : 0;
  });

  getShopRating(shop: ShopAdminDto): string {
    // Placeholder rating logic - can be enhanced with real data
    const productCount = shop.productCount || 0;
    if (productCount > 20) return '⭐⭐⭐⭐⭐';
    if (productCount > 10) return '⭐⭐⭐⭐';
    if (productCount > 5) return '⭐⭐⭐';
    if (productCount > 0) return '⭐⭐';
    return '⭐';
  }

  ngOnInit(): void {
    this.isAdmin.set(this.authService.isAdmin());
    this.isSeller.set(this.authService.isSeller());
    console.log('👤 User role - Admin:', this.isAdmin(), 'Seller:', this.isSeller());
    
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    
    if (this.isSeller()) {
      // Seller: load only their shop
      this.svc.getMyShop().subscribe({
        next: (shop) => {
          console.log('✅ Seller shop loaded:', shop);
          this.shops.set([shop]);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('❌ Failed to load seller shop:', err);
          this.shops.set([]);
          this.isLoading.set(false);
        }
      });
    } else {
      // Admin: load all shops
      this.svc.getShops().subscribe({
        next: (data) => {
          console.log('✅ All shops loaded:', data.length);
          // ✅ Sort shops by product count (highest rating first)
          const sortedShops = [...data].sort((a, b) => {
            const countA = a.productCount || 0;
            const countB = b.productCount || 0;
            return countB - countA; // Descending order
          });
          this.shops.set(sortedShops);
          console.log('✅ Shops sorted by rating (product count)');
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('❌ Failed to load shops:', err);
          this.isLoading.set(false);
        }
      });
    }
  }
}
