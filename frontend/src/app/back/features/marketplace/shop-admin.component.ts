import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MarketplaceAdminService, ShopAdminDto } from '../../core/services/marketplace-admin.service';
import { AdminAuthService } from '../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-shop',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">

      <!-- Back Button -->
      <div>
        <a routerLink="/admin/marketplace" class="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-secondary hover:text-primary transition-colors">
          <span class="text-lg">←</span>
          <span>Back to Marketplace</span>
        </a>
      </div>

      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl shadow-soft border border-gray-100">
        <div>
          <h1 class="text-3xl font-black text-dark tracking-tight">{{ isAdmin() ? 'All Shops' : 'My Shop' }}</h1>
          <p class="text-secondary font-medium mt-1">{{ isAdmin() ? 'View all seller shops on the platform' : 'Manage your shop information' }}</p>
        </div>
        <div class="flex gap-3">
          <button (click)="loadData()" class="px-6 py-3 bg-gray-50 hover:bg-gray-100 text-dark font-black rounded-xl transition-all uppercase tracking-widest text-[10px] border border-gray-100">
            🔄 Refresh
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-xl">🏪</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">{{ isAdmin() ? 'Total Shops' : 'Your Shop' }}</p>
            <p class="text-2xl font-black text-dark">{{ shops().length }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-xl">📦</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Total Products</p>
            <p class="text-2xl font-black text-dark">{{ totalProducts() }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-xl">👤</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Active Sellers</p>
            <p class="text-2xl font-black text-dark">{{ shops().length }}</p>
          </div>
        </div>
      </div>

      <!-- Grid -->
      @if (isLoading()) {
        <div class="flex flex-col items-center gap-3 py-20">
          <div class="w-10 h-10 border-4 border-gray-100 border-t-primary rounded-full animate-spin"></div>
          <p class="text-xs font-black text-secondary uppercase tracking-widest">Loading shops...</p>
        </div>
      } @else if (shops().length === 0) {
        <div class="bg-white rounded-3xl border border-gray-100 shadow-soft p-16 text-center">
          <span class="text-6xl block mb-4">🏪</span>
          <p class="text-lg font-black text-dark mb-2">{{ isAdmin() ? 'No shops registered yet' : 'No shop found' }}</p>
          <p class="text-secondary font-medium">{{ isAdmin() ? 'Shops will appear here once sellers register' : 'Contact admin to create your shop' }}</p>
        </div>
      } @else {
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          @for (shop of shops(); track shop.id) {
            <div class="bg-white rounded-3xl border border-gray-100 shadow-soft hover:shadow-lg hover:border-primary/30 transition-all duration-300 overflow-hidden group">
              <!-- Shop Header -->
              <div class="bg-gradient-to-br from-primary/5 to-primary/10 p-6 border-b border-gray-100">
                <div class="flex items-start justify-between mb-3">
                  <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform">
                    🏪
                  </div>
                  <div class="px-3 py-1 bg-white rounded-lg shadow-sm">
                    <p class="text-[10px] font-black text-primary uppercase tracking-widest">Active</p>
                  </div>
                </div>
                <h3 class="font-black text-dark text-lg mb-1 truncate">{{ shop.name || 'Unnamed Shop' }}</h3>
                <p class="text-xs text-secondary font-medium truncate">{{ shop.description || 'No description' }}</p>
              </div>

              <!-- Shop Details -->
              <div class="p-6 space-y-4">
                <!-- Owner -->
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center text-sm">
                    👤
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Owner</p>
                    <p class="text-sm font-bold text-dark truncate">{{ shop.ownerName || 'Unknown' }}</p>
                  </div>
                </div>

                <!-- Products Count -->
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center text-sm">
                    📦
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Products</p>
                    <p class="text-sm font-bold text-dark">{{ shop.productCount || 0 }} items</p>
                  </div>
                </div>

                <!-- Shop ID -->
                <div class="pt-3 border-t border-gray-100">
                  <p class="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Shop ID</p>
                  <p class="font-mono text-[10px] text-dark bg-gray-50 px-3 py-2 rounded-lg truncate">{{ shop.id }}</p>
                </div>
              </div>

              <!-- Actions -->
              <div class="p-6 pt-0">
                <a [routerLink]="['/admin/marketplace/products']" [queryParams]="{shopId: shop.id}"
                  class="block text-center py-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm hover:shadow-md">
                  View Products →
                </a>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`.shadow-soft { box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); }`]
})
export class ShopAdminComponent implements OnInit {
  private svc = inject(MarketplaceAdminService);
  private authService = inject(AdminAuthService);

  shops = signal<ShopAdminDto[]>([]);
  isLoading = signal(false);
  isAdmin = signal(false);
  isSeller = signal(false);

  totalProducts = () => this.shops().reduce((sum, shop) => sum + (shop.productCount || 0), 0);

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
          this.shops.set([shop]);  // Wrap in array for consistent display
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
          this.shops.set(data);
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
