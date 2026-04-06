import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MarketplaceAdminService } from '../../core/services/marketplace-admin.service';

@Component({
  selector: 'app-marketplace-hub',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

      <!-- Header -->
      <div class="bg-white p-8 rounded-3xl shadow-soft border border-gray-100">
        <h1 class="text-3xl font-black text-dark tracking-tight">Marketplace</h1>
        <p class="text-secondary font-medium mt-1">Manage products, categories, services, favorites and shops</p>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-xl">📦</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Products</p>
            <p class="text-2xl font-black text-dark">{{ productCount() }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-xl">🏷️</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Categories</p>
            <p class="text-2xl font-black text-dark">{{ categoryCount() }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-xl">🔧</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Services</p>
            <p class="text-2xl font-black text-dark">{{ serviceCount() }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-xl">🏪</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Shops</p>
            <p class="text-2xl font-black text-dark">{{ shopCount() }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-xl">❤️</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Favorites</p>
            <p class="text-2xl font-black text-dark">{{ favCount() }}</p>
          </div>
        </div>
      </div>

      <!-- Navigation Cards -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

        <a routerLink="/admin/marketplace/products"
          class="bg-white rounded-3xl border border-gray-100 shadow-soft p-6 hover:border-primary/40 hover:shadow-md transition-all group cursor-pointer">
          <div class="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📦</div>
          <h3 class="font-black text-dark text-lg mb-1">Products</h3>
          <p class="text-secondary text-sm font-medium mb-4">Add, edit, delete and approve products. Link to categories.</p>
          <span class="text-[10px] font-black text-primary uppercase tracking-widest">Manage Products →</span>
        </a>

        <a routerLink="/admin/marketplace/categories"
          class="bg-white rounded-3xl border border-gray-100 shadow-soft p-6 hover:border-primary/40 hover:shadow-md transition-all group cursor-pointer">
          <div class="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">🏷️</div>
          <h3 class="font-black text-dark text-lg mb-1">Categories</h3>
          <p class="text-secondary text-sm font-medium mb-4">Create and manage product categories used in the marketplace.</p>
          <span class="text-[10px] font-black text-primary uppercase tracking-widest">Manage Categories →</span>
        </a>

        <a routerLink="/admin/marketplace/services"
          class="bg-white rounded-3xl border border-gray-100 shadow-soft p-6 hover:border-primary/40 hover:shadow-md transition-all group cursor-pointer">
          <div class="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">🔧</div>
          <h3 class="font-black text-dark text-lg mb-1">Services</h3>
          <p class="text-secondary text-sm font-medium mb-4">Manage services offered by sellers on the platform.</p>
          <span class="text-[10px] font-black text-primary uppercase tracking-widest">Manage Services →</span>
        </a>

        <a routerLink="/admin/marketplace/favorites"
          class="bg-white rounded-3xl border border-gray-100 shadow-soft p-6 hover:border-primary/40 hover:shadow-md transition-all group cursor-pointer">
          <div class="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">❤️</div>
          <h3 class="font-black text-dark text-lg mb-1">Favorites</h3>
          <p class="text-secondary text-sm font-medium mb-4">View which users have favorited which products and services.</p>
          <span class="text-[10px] font-black text-primary uppercase tracking-widest">View Favorites →</span>
        </a>

        <a routerLink="/admin/marketplace/shop"
          class="bg-white rounded-3xl border border-gray-100 shadow-soft p-6 hover:border-primary/40 hover:shadow-md transition-all group cursor-pointer">
          <div class="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">🏪</div>
          <h3 class="font-black text-dark text-lg mb-1">Shops</h3>
          <p class="text-secondary text-sm font-medium mb-4">Overview of all seller storefronts registered on the platform.</p>
          <span class="text-[10px] font-black text-primary uppercase tracking-widest">View Shops →</span>
        </a>

        <a routerLink="/shop" target="_blank"
          class="bg-white rounded-3xl border border-gray-100 shadow-soft p-6 hover:border-primary/40 hover:shadow-md transition-all group cursor-pointer">
          <div class="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">🛒</div>
          <h3 class="font-black text-dark text-lg mb-1">Client Shop View</h3>
          <p class="text-secondary text-sm font-medium mb-4">Preview the marketplace as a client sees it.</p>
          <span class="text-[10px] font-black text-primary uppercase tracking-widest">Open Client View ↗</span>
        </a>

      </div>
    </div>
  `,
  styles: [`.shadow-soft { box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); }`]
})
export class MarketplaceHubComponent implements OnInit {
  private svc = inject(MarketplaceAdminService);

  productCount = signal(0);
  categoryCount = signal(0);
  serviceCount = signal(0);
  shopCount = signal(0);
  favCount = signal(0);

  ngOnInit(): void {
    this.svc.getProductsAdmin().subscribe({ next: d => this.productCount.set(d.length), error: () => {} });
    this.svc.getCategories().subscribe({ next: d => this.categoryCount.set(d.length), error: () => {} });
    this.svc.getServices().subscribe({ next: d => this.serviceCount.set(d.length), error: () => {} });
    this.svc.getShops().subscribe({ next: d => this.shopCount.set(d.length), error: () => {} });
    this.svc.getFavoris().subscribe({ next: d => this.favCount.set(d.length), error: () => {} });
  }
}
