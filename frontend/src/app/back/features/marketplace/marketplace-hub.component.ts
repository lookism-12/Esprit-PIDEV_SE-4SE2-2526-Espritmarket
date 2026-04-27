import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MarketplaceAdminService } from '../../core/services/marketplace-admin.service';

@Component({
  selector: 'app-marketplace-hub',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div class="max-w-7xl mx-auto p-8 space-y-8">

        <!-- Header Section with Gradient -->
        <div class="relative overflow-hidden bg-gradient-to-br from-primary via-[#8B0000] to-[#5a0000] rounded-3xl shadow-2xl">
          <!-- Background Pattern -->
          <div class="absolute inset-0 opacity-10">
            <div class="absolute inset-0" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 32px 32px;"></div>
          </div>
          
          <!-- Decorative Circles -->
          <div class="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div class="absolute -left-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          
          <!-- Content -->
          <div class="relative z-10 p-10">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl border border-white/30">
                🏪
              </div>
              <div>
                <h1 class="text-4xl font-black text-white tracking-tight">Marketplace Management</h1>
                <p class="text-white/80 font-medium mt-1">Comprehensive control center for your e-commerce platform</p>
              </div>
            </div>
            
            <!-- Quick Actions -->
            <div class="flex flex-wrap gap-3 mt-6">
              <a routerLink="/admin/marketplace/products" 
                 class="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold rounded-xl transition-all border border-white/30 hover:scale-105 text-sm">
                📦 Products
              </a>
              <a routerLink="/admin/marketplace/categories" 
                 class="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold rounded-xl transition-all border border-white/30 hover:scale-105 text-sm">
                🏷️ Categories
              </a>
              <a routerLink="/admin/marketplace/services" 
                 class="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold rounded-xl transition-all border border-white/30 hover:scale-105 text-sm">
                🔧 Services
              </a>
              <a routerLink="/admin/marketplace/shop" 
                 class="px-5 py-2.5 bg-white text-primary hover:bg-white/90 font-bold rounded-xl transition-all hover:scale-105 text-sm shadow-lg">
                🏪 Shops
              </a>
            </div>
          </div>
        </div>

        <!-- Statistics Dashboard -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          @for (stat of stats(); track stat.label) {
            <div class="group relative bg-white rounded-2xl border-2 border-gray-100 hover:border-{{stat.color}}-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
              <!-- Gradient Background on Hover -->
              <div class="absolute inset-0 bg-gradient-to-br from-{{stat.color}}-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <!-- Content -->
              <div class="relative z-10 p-6">
                <div class="flex items-start justify-between mb-4">
                  <div class="w-14 h-14 bg-{{stat.color}}-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-sm">
                    {{stat.icon}}
                  </div>
                  @if (stat.trend) {
                    <div class="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                      <span>↗</span>
                      <span>{{stat.trend}}</span>
                    </div>
                  }
                </div>
                
                <div>
                  <p class="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">{{stat.label}}</p>
                  <p class="text-3xl font-black text-dark mb-1">{{stat.value()}}</p>
                  @if (stat.subtitle) {
                    <p class="text-xs text-secondary font-medium">{{stat.subtitle}}</p>
                  }
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Main Navigation Grid -->
        <div>
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-black text-dark">Management Modules</h2>
            <div class="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-bold">
              <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>All Systems Operational</span>
            </div>
          </div>

          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            @for (module of modules; track module.title) {
              <a [routerLink]="module.route"
                 class="group relative bg-white rounded-3xl border-2 border-gray-100 hover:border-{{module.color}}-300 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden">
                
                <!-- Gradient Background -->
                <div class="absolute inset-0 bg-gradient-to-br from-{{module.color}}-50 via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <!-- Content -->
                <div class="relative z-10 p-8">
                  <!-- Icon with Badge -->
                  <div class="relative inline-block mb-5">
                    <div class="w-16 h-16 bg-{{module.color}}-100 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-md">
                      {{module.icon}}
                    </div>
                    @if (module.badge) {
                      <div class="absolute -top-2 -right-2 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center text-xs font-black shadow-lg">
                        {{module.badge}}
                      </div>
                    }
                  </div>
                  
                  <!-- Title & Description -->
                  <h3 class="font-black text-dark text-xl mb-2 group-hover:text-{{module.color}}-700 transition-colors">
                    {{module.title}}
                  </h3>
                  <p class="text-secondary text-sm font-medium mb-6 leading-relaxed">
                    {{module.description}}
                  </p>
                  
                  <!-- Action Button -->
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-black text-{{module.color}}-600 uppercase tracking-widest group-hover:tracking-wider transition-all">
                      {{module.action}}
                    </span>
                    <div class="w-8 h-8 bg-{{module.color}}-100 rounded-lg flex items-center justify-center group-hover:bg-{{module.color}}-200 transition-colors">
                      <span class="text-{{module.color}}-600 group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                  
                  <!-- Stats Footer -->
                  @if (module.stats) {
                    <div class="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                      @for (s of module.stats; track s.label) {
                        <div>
                          <p class="text-xs text-secondary font-medium">{{s.label}}</p>
                          <p class="text-lg font-black text-dark">{{s.value}}</p>
                        </div>
                      }
                    </div>
                  }
                </div>
              </a>
            }
          </div>
        </div>

        <!-- Quick Insights Section -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Recent Activity -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div class="flex items-center gap-3 mb-5">
              <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-lg">📊</div>
              <h3 class="font-black text-dark">Quick Stats</h3>
            </div>
            <div class="space-y-4">
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span class="text-sm font-medium text-secondary">Total Items</span>
                <span class="text-lg font-black text-dark">{{totalItems()}}</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span class="text-sm font-medium text-secondary">Active Shops</span>
                <span class="text-lg font-black text-dark">{{shopCount()}}</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span class="text-sm font-medium text-secondary">User Favorites</span>
                <span class="text-lg font-black text-dark">{{favCount()}}</span>
              </div>
            </div>
          </div>

          <!-- System Health -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div class="flex items-center gap-3 mb-5">
              <div class="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-lg">💚</div>
              <h3 class="font-black text-dark">System Health</h3>
            </div>
            <div class="space-y-4">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-secondary">Database</span>
                  <span class="text-xs font-bold text-green-600">Optimal</span>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-green-500 rounded-full" style="width: 98%"></div>
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-secondary">API Response</span>
                  <span class="text-xs font-bold text-green-600">Fast</span>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-green-500 rounded-full" style="width: 95%"></div>
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-secondary">Storage</span>
                  <span class="text-xs font-bold text-blue-600">Good</span>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-blue-500 rounded-full" style="width: 72%"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Links -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div class="flex items-center gap-3 mb-5">
              <div class="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-lg">⚡</div>
              <h3 class="font-black text-dark">Quick Actions</h3>
            </div>
            <div class="space-y-3">
              <a routerLink="/admin/marketplace/products" 
                 class="flex items-center gap-3 p-3 bg-gray-50 hover:bg-primary/5 rounded-xl transition-colors group">
                <span class="text-lg">📦</span>
                <span class="text-sm font-bold text-dark group-hover:text-primary transition-colors">Add New Product</span>
              </a>
              <a routerLink="/admin/marketplace/categories" 
                 class="flex items-center gap-3 p-3 bg-gray-50 hover:bg-primary/5 rounded-xl transition-colors group">
                <span class="text-lg">🏷️</span>
                <span class="text-sm font-bold text-dark group-hover:text-primary transition-colors">Manage Categories</span>
              </a>
              <a routerLink="/admin/marketplace/favorites" 
                 class="flex items-center gap-3 p-3 bg-gray-50 hover:bg-primary/5 rounded-xl transition-colors group">
                <span class="text-lg">❤️</span>
                <span class="text-sm font-bold text-dark group-hover:text-primary transition-colors">View Favorites</span>
              </a>
              <a routerLink="/admin/marketplace/shop" 
                 class="flex items-center gap-3 p-3 bg-primary text-white hover:bg-primary-dark rounded-xl transition-colors group">
                <span class="text-lg">🏪</span>
                <span class="text-sm font-bold">Manage Shops</span>
              </a>
            </div>
          </div>
        </div>

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
  `]
})
export class MarketplaceHubComponent implements OnInit {
  private svc = inject(MarketplaceAdminService);

  productCount = signal(0);
  categoryCount = signal(0);
  serviceCount = signal(0);
  shopCount = signal(0);
  favCount = signal(0);

  totalItems = computed(() => 
    this.productCount() + this.serviceCount()
  );

  stats = computed(() => [
    {
      label: 'Products',
      value: this.productCount,
      icon: '📦',
      color: 'primary',
      trend: '+12%',
      subtitle: 'Total listings'
    },
    {
      label: 'Categories',
      value: this.categoryCount,
      icon: '🏷️',
      color: 'yellow',
      subtitle: 'Active categories'
    },
    {
      label: 'Services',
      value: this.serviceCount,
      icon: '🔧',
      color: 'green',
      trend: '+8%',
      subtitle: 'Service offerings'
    },
    {
      label: 'Shops',
      value: this.shopCount,
      icon: '🏪',
      color: 'blue',
      subtitle: 'Registered stores'
    },
    {
      label: 'Favorites',
      value: this.favCount,
      icon: '❤️',
      color: 'red',
      trend: '+24%',
      subtitle: 'User favorites'
    }
  ]);

  modules = [
    {
      title: 'Products',
      description: 'Comprehensive product management including approval workflows, inventory tracking, and category assignments.',
      icon: '📦',
      color: 'primary',
      route: '/admin/marketplace/products',
      action: 'Manage Products →',
      badge: this.productCount(),
      stats: [
        { label: 'Active', value: this.productCount() },
        { label: 'Categories', value: this.categoryCount() }
      ]
    },
    {
      title: 'Categories',
      description: 'Organize your marketplace with hierarchical categories. Create, edit, and manage product classifications.',
      icon: '🏷️',
      color: 'yellow',
      route: '/admin/marketplace/categories',
      action: 'Manage Categories →'
    },
    {
      title: 'Services',
      description: 'Oversee service offerings from sellers. Approve, monitor, and manage all service-based listings.',
      icon: '🔧',
      color: 'green',
      route: '/admin/marketplace/services',
      action: 'Manage Services →',
      badge: this.serviceCount()
    },
    {
      title: 'Favorites',
      description: 'Analyze user engagement through favorite tracking. Identify trending products and popular items.',
      icon: '❤️',
      color: 'red',
      route: '/admin/marketplace/favorites',
      action: 'View Analytics →',
      stats: [
        { label: 'Total', value: this.favCount() }
      ]
    },
    {
      title: 'Shops',
      description: 'Monitor all seller storefronts. View shop performance, manage registrations, and track activity.',
      icon: '🏪',
      color: 'blue',
      route: '/admin/marketplace/shop',
      action: 'View Shops →',
      badge: this.shopCount()
    }
  ];

  ngOnInit(): void {
    this.svc.getProductsAdmin().subscribe({ next: d => this.productCount.set(d.length), error: () => {} });
    this.svc.getCategories().subscribe({ next: d => this.categoryCount.set(d.length), error: () => {} });
    this.svc.getServices().subscribe({ next: d => this.serviceCount.set(d.length), error: () => {} });
    this.svc.getShops().subscribe({ next: d => this.shopCount.set(d.length), error: () => {} });
    this.svc.getFavoris().subscribe({ next: d => this.favCount.set(d.length), error: () => {} });
  }
}
