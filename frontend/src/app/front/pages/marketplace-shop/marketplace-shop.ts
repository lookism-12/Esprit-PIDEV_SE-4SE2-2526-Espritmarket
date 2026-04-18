import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ShopService } from '../../core/shop.service';
import { Shop } from '../../models/product';

@Component({
  selector: 'app-marketplace-shop',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50/50 pt-28 pb-20 px-4 md:px-8">
      <div class="max-w-7xl mx-auto">
        <nav class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-secondary mb-4">
          <a routerLink="/" class="hover:text-primary transition-colors">Home</a>
          <span class="text-gray-300">/</span>
          <a routerLink="/products" class="hover:text-primary transition-colors">Marketplace</a>
          <span class="text-gray-300">/</span>
          <span class="text-dark">Shops</span>
        </nav>
        <h1 class="text-5xl md:text-6xl font-black text-dark tracking-tighter leading-none mb-4">
          Shops<span class="text-primary">.</span>
        </h1>
        <p class="text-secondary font-bold max-w-lg mb-10">
          Explore seller storefronts on campus.
        </p>

        @if (isLoading()) {
          <div class="flex items-center justify-center py-20">
            <div class="text-center">
              <svg class="animate-spin h-12 w-12 text-primary mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p class="text-secondary font-bold">Loading shops...</p>
            </div>
          </div>
        } @else if (error()) {
          <div class="bg-red-50 border border-red-200 rounded-2xl p-6">
            <p class="text-red-600 font-bold">{{ error() }}</p>
          </div>
        } @else {
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            @for (shop of shops(); track shop.id) {
              <a
                [routerLink]="['/products']"
                [queryParams]="{ shop: shop.id }"
                class="block bg-white rounded-3xl border border-secondary/10 p-8 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 group">
                <div class="flex items-center gap-4 mb-4">
                  <div class="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    🏪
                  </div>
                  <div class="flex-1">
                    <h2 class="text-xl font-black text-dark tracking-tight group-hover:text-primary transition-colors">
                      {{ shop.name || 'Shop' }}
                    </h2>
                    @if (shop.isActive) {
                      <span class="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full mt-1">
                        ✅ Active
                      </span>
                    }
                  </div>
                </div>
                
                @if (shop.description) {
                  <p class="text-sm text-secondary mb-4 line-clamp-2">{{ shop.description }}</p>
                }
                
                <div class="flex items-center justify-between text-xs text-secondary">
                  <span class="font-bold">{{ shop.totalProducts || 0 }} Products</span>
                  <span class="text-primary font-black group-hover:translate-x-1 transition-transform inline-block">→</span>
                </div>
              </a>
            } @empty {
              <div class="col-span-full text-center py-20">
                <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span class="text-4xl">🏪</span>
                </div>
                <h3 class="text-xl font-bold text-dark mb-2">No Shops Yet</h3>
                <p class="text-secondary font-bold">Check back later for new shops!</p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class MarketplaceShop implements OnInit {
  private shopService = inject(ShopService);

  shops = signal<Shop[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.shopService.getAllShops().subscribe({
      next: (data) => {
        this.shops.set(data ?? []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Could not load shops.');
        this.isLoading.set(false);
      },
    });
  }
}
