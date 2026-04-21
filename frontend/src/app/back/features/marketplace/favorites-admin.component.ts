import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MarketplaceAdminService, FavorisDto, ProductAdminDto, ServiceAdminDto } from '../../core/services/marketplace-admin.service';
import { ImageUrlHelper } from '../../../shared/utils/image-url.helper';

interface ProductWithFavorites {
  product: ProductAdminDto;
  favoriteCount: number;
  userIds: string[];
}

interface ServiceWithFavorites {
  service: ServiceAdminDto;
  favoriteCount: number;
  userIds: string[];
}

@Component({
  selector: 'app-admin-favorites',
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
          <h1 class="text-3xl font-black text-dark tracking-tight">Favorites</h1>
          <p class="text-secondary font-medium mt-1">View all user favorites across the platform</p>
        </div>
        <button (click)="loadData()" class="px-6 py-3 bg-gray-50 hover:bg-gray-100 text-dark font-black rounded-xl transition-all uppercase tracking-widest text-[10px] border border-gray-100">
          🔄 Refresh
        </button>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-xl">❤️</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Total Favorites</p>
            <p class="text-2xl font-black text-dark">{{ totalFavorites() }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-xl">👥</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Unique Users</p>
            <p class="text-2xl font-black text-dark">{{ uniqueUsers() }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-xl">📦</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Products Liked</p>
            <p class="text-2xl font-black text-dark">{{ totalProductFavorites() }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-xl">🔧</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Services Liked</p>
            <p class="text-2xl font-black text-dark">{{ totalServiceFavorites() }}</p>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-soft p-2 inline-flex gap-2">
        <button (click)="setActiveTab('products')" 
                [class.bg-primary]="activeTab() === 'products'"
                [class.text-white]="activeTab() === 'products'"
                [class.bg-transparent]="activeTab() !== 'products'"
                [class.text-secondary]="activeTab() !== 'products'"
                class="px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all">
          📦 Products ({{ totalProductFavorites() }})
        </button>
        <button (click)="setActiveTab('services')"
                [class.bg-primary]="activeTab() === 'services'"
                [class.text-white]="activeTab() === 'services'"
                [class.bg-transparent]="activeTab() !== 'services'"
                [class.text-secondary]="activeTab() !== 'services'"
                class="px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all">
          🔧 Services ({{ totalServiceFavorites() }})
        </button>
      </div>

      <!-- Content: Products Tab -->
      @if (activeTab() === 'products') {
        @if (isLoading()) {
          <div class="flex flex-col items-center gap-3 py-20">
            <div class="w-10 h-10 border-4 border-gray-100 border-t-primary rounded-full animate-spin"></div>
            <p class="text-xs font-black text-secondary uppercase tracking-widest">Loading...</p>
          </div>
        } @else if (productsWithFavorites().length === 0) {
          <div class="bg-white rounded-3xl border border-gray-100 shadow-soft p-16 text-center">
            <span class="text-6xl block mb-4">📦</span>
            <p class="text-lg font-black text-dark mb-2">No products favorited yet</p>
            <p class="text-secondary font-medium">Products will appear here once users start adding them to favorites</p>
          </div>
        } @else {
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            @for (item of productsWithFavorites(); track item.product.id) {
              <div class="bg-white rounded-3xl border border-gray-100 shadow-soft hover:shadow-lg hover:border-red-200 transition-all duration-300 overflow-hidden group">
                <!-- Header -->
                <div class="bg-gradient-to-br from-red-50 to-pink-50 p-6 border-b border-gray-100">
                  <div class="flex items-start justify-between mb-3">
                    <div class="w-16 h-16 bg-white rounded-2xl overflow-hidden flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      @if (item.product.imageUrl || item.product.images[0]?.url) {
                        <img [src]="getProductImage(item.product)" 
                             [alt]="item.product.name"
                             class="w-full h-full object-cover">
                      } @else {
                        <span class="text-3xl">📦</span>
                      }
                    </div>
                    <div class="flex items-center gap-2 px-3 py-1 bg-white rounded-lg shadow-sm">
                      <span class="text-red-500 text-lg">❤️</span>
                      <span class="text-lg font-black text-dark">{{ item.favoriteCount }}</span>
                    </div>
                  </div>
                  <h3 class="font-black text-dark text-lg mb-1 truncate">{{ item.product.name }}</h3>
                  <p class="text-xs text-secondary font-medium truncate">{{ item.product.description || 'No description' }}</p>
                </div>

                <!-- Details -->
                <div class="p-6 space-y-4">
                  <!-- Price -->
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center text-sm">
                      💰
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Price</p>
                      <p class="text-sm font-bold text-dark">{{ item.product.price }} TND</p>
                    </div>
                  </div>

                  <!-- Favorite Count -->
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-red-100 to-red-50 rounded-xl flex items-center justify-center text-sm">
                      ❤️
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Liked By</p>
                      <p class="text-sm font-bold text-dark">{{ item.favoriteCount }} {{ item.favoriteCount === 1 ? 'person' : 'people' }}</p>
                    </div>
                  </div>

                  <!-- Status -->
                  @if (item.product.status) {
                    <div class="pt-3 border-t border-gray-100">
                      <p class="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Status</p>
                      <span class="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest"
                            [class.bg-green-100]="item.product.status === 'APPROVED'"
                            [class.text-green-700]="item.product.status === 'APPROVED'"
                            [class.bg-yellow-100]="item.product.status === 'PENDING'"
                            [class.text-yellow-700]="item.product.status === 'PENDING'"
                            [class.bg-red-100]="item.product.status === 'REJECTED'"
                            [class.text-red-700]="item.product.status === 'REJECTED'">
                        {{ item.product.status }}
                      </span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- Content: Services Tab -->
      @if (activeTab() === 'services') {
        @if (isLoading()) {
          <div class="flex flex-col items-center gap-3 py-20">
            <div class="w-10 h-10 border-4 border-gray-100 border-t-primary rounded-full animate-spin"></div>
            <p class="text-xs font-black text-secondary uppercase tracking-widest">Loading...</p>
          </div>
        } @else if (servicesWithFavorites().length === 0) {
          <div class="bg-white rounded-3xl border border-gray-100 shadow-soft p-16 text-center">
            <span class="text-6xl block mb-4">🔧</span>
            <p class="text-lg font-black text-dark mb-2">No services favorited yet</p>
            <p class="text-secondary font-medium">Services will appear here once users start adding them to favorites</p>
          </div>
        } @else {
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            @for (item of servicesWithFavorites(); track item.service.id) {
              <div class="bg-white rounded-3xl border border-gray-100 shadow-soft hover:shadow-lg hover:border-red-200 transition-all duration-300 overflow-hidden group">
                <!-- Header -->
                <div class="bg-gradient-to-br from-green-50 to-emerald-50 p-6 border-b border-gray-100">
                  <div class="flex items-start justify-between mb-3">
                    <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform">
                      🔧
                    </div>
                    <div class="flex items-center gap-2 px-3 py-1 bg-white rounded-lg shadow-sm">
                      <span class="text-red-500 text-lg">❤️</span>
                      <span class="text-lg font-black text-dark">{{ item.favoriteCount }}</span>
                    </div>
                  </div>
                  <h3 class="font-black text-dark text-lg mb-1 truncate">{{ item.service.name }}</h3>
                  <p class="text-xs text-secondary font-medium truncate">{{ item.service.description || 'No description' }}</p>
                </div>

                <!-- Details -->
                <div class="p-6 space-y-4">
                  <!-- Price -->
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center text-sm">
                      💰
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Price</p>
                      <p class="text-sm font-bold text-dark">{{ item.service.price }} TND</p>
                    </div>
                  </div>

                  <!-- Favorite Count -->
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-red-100 to-red-50 rounded-xl flex items-center justify-center text-sm">
                      ❤️
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Liked By</p>
                      <p class="text-sm font-bold text-dark">{{ item.favoriteCount }} {{ item.favoriteCount === 1 ? 'person' : 'people' }}</p>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`.shadow-soft { box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); }`]
})
export class FavoritesAdminComponent implements OnInit {
  private svc = inject(MarketplaceAdminService);

  favorites = signal<FavorisDto[]>([]);
  products = signal<ProductAdminDto[]>([]);
  services = signal<ServiceAdminDto[]>([]);
  isLoading = signal(false);
  
  activeTab = signal<'products' | 'services'>('products');

  // Computed: Products with favorite counts
  productsWithFavorites = computed(() => {
    const favs = this.favorites();
    const prods = this.products();
    
    // Group favorites by product
    const productFavMap = new Map<string, string[]>();
    favs.forEach(fav => {
      if (fav.productId) {
        if (!productFavMap.has(fav.productId)) {
          productFavMap.set(fav.productId, []);
        }
        productFavMap.get(fav.productId)!.push(fav.userId);
      }
    });
    
    // Create products with favorites
    const result: ProductWithFavorites[] = [];
    productFavMap.forEach((userIds, productId) => {
      const product = prods.find(p => p.id === productId);
      if (product) {
        result.push({
          product,
          favoriteCount: userIds.length,
          userIds
        });
      }
    });
    
    // Sort by favorite count (descending)
    return result.sort((a, b) => b.favoriteCount - a.favoriteCount);
  });

  // Computed: Services with favorite counts
  servicesWithFavorites = computed(() => {
    const favs = this.favorites();
    const servs = this.services();
    
    // Group favorites by service
    const serviceFavMap = new Map<string, string[]>();
    favs.forEach(fav => {
      if (fav.serviceId) {
        if (!serviceFavMap.has(fav.serviceId)) {
          serviceFavMap.set(fav.serviceId, []);
        }
        serviceFavMap.get(fav.serviceId)!.push(fav.userId);
      }
    });
    
    // Create services with favorites
    const result: ServiceWithFavorites[] = [];
    serviceFavMap.forEach((userIds, serviceId) => {
      const service = servs.find(s => s.id === serviceId);
      if (service) {
        result.push({
          service,
          favoriteCount: userIds.length,
          userIds
        });
      }
    });
    
    // Sort by favorite count (descending)
    return result.sort((a, b) => b.favoriteCount - a.favoriteCount);
  });

  totalFavorites = computed(() => this.favorites().length);
  uniqueUsers = computed(() => new Set(this.favorites().map(f => f.userId)).size);
  totalProductFavorites = computed(() => this.productsWithFavorites().length);
  totalServiceFavorites = computed(() => this.servicesWithFavorites().length);

  ngOnInit(): void {
    console.log('🔄 Favorites component initialized');
    this.loadData();
  }

  loadData(): void {
    console.log('🔄 Loading favorites data...');
    this.isLoading.set(true);
    
    // Load favorites
    this.svc.getFavoris().subscribe({
      next: (data) => {
        console.log('✅ Favorites loaded:', data.length);
        this.favorites.set(data);
      },
      error: (err) => {
        console.error('❌ Failed to load favorites:', err);
      }
    });
    
    // Load products
    this.svc.getProductsAdmin().subscribe({
      next: (data) => {
        console.log('✅ Products loaded:', data.length);
        this.products.set(data);
      },
      error: (err) => {
        console.error('❌ Failed to load products:', err);
      }
    });
    
    // Load services
    this.svc.getServices().subscribe({
      next: (data) => {
        console.log('✅ Services loaded:', data.length);
        this.services.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Failed to load services:', err);
        this.isLoading.set(false);
      }
    });
  }

  setActiveTab(tab: 'products' | 'services'): void {
    this.activeTab.set(tab);
  }

  getProductImage(product: ProductAdminDto): string {
    const imageUrl = product.imageUrl || product.images?.[0]?.url;
    return ImageUrlHelper.toAbsoluteUrl(imageUrl);
  }
}
