import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environment';

export interface ShopListItemDto {
  id: string;
  ownerId?: string;
}

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
          <p class="text-secondary font-bold">Loading…</p>
        } @else if (error()) {
          <p class="text-red-600 font-bold">{{ error() }}</p>
        } @else {
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            @for (shop of shops(); track shop.id) {
              <a
                [routerLink]="['/products']"
                [queryParams]="{ shop: shop.id }"
                class="block bg-white rounded-3xl border border-secondary/10 p-6 shadow-sm hover:border-primary/30 transition-colors">
                <h2 class="text-lg font-black text-dark tracking-tight">Shop</h2>
                <p class="text-xs font-mono text-secondary mt-2 break-all">{{ shop.id }}</p>
              </a>
            } @empty {
              <p class="text-secondary font-bold col-span-full">No shops yet.</p>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class MarketplaceShop implements OnInit {
  private http = inject(HttpClient);

  shops = signal<ShopListItemDto[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.http.get<ShopListItemDto[]>(`${environment.apiUrl}/shops`).subscribe({
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
