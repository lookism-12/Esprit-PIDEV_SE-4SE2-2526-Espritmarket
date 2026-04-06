import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ShopService, ShopDto } from '../../../core/services/shop.service';

export interface Shop extends ShopDto {} // Use the DTO as the interface

// Mock service for now - replace with real service
const mockShops: Shop[] = [
  {
    id: '1',
    name: 'Tech Store ESPRIT',
    description: 'Your one-stop shop for all tech gadgets, laptops, phones, and accessories. Quality products at student-friendly prices.',
    address: 'ESPRIT Campus, Tunis',
    phone: '+216 71 000 001',
    logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
    ownerId: 'owner1',
    ownerName: 'Ahmed Ben Ali',
    ownerEmail: 'ahmed.benali@esprit.tn',
    productCount: 25,
    createdAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'Campus Books & Supplies',
    description: 'Academic books, stationery, and study materials. Everything you need for your studies at competitive prices.',
    address: 'Near Library, ESPRIT',
    phone: '+216 71 000 002',
    logo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    ownerId: 'owner2',
    ownerName: 'Fatma Trabelsi',
    ownerEmail: 'fatma.trabelsi@esprit.tn',
    productCount: 18,
    createdAt: new Date('2024-02-10')
  },
  {
    id: '3',
    name: 'Student Fashion Hub',
    description: 'Trendy clothes, shoes, and accessories for students. Stay stylish without breaking the bank.',
    address: 'Student Center, ESPRIT',
    phone: '+216 71 000 003',
    logo: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400',
    ownerId: 'owner3',
    ownerName: 'Youssef Mansouri',
    ownerEmail: 'youssef.mansouri@esprit.tn',
    productCount: 32,
    createdAt: new Date('2024-01-20')
  },
  {
    id: '4',
    name: 'Healthy Bites Café',
    description: 'Fresh snacks, healthy meals, and beverages. Perfect for study breaks and quick meals between classes.',
    address: 'Main Cafeteria, ESPRIT',
    phone: '+216 71 000 004',
    logo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
    ownerId: 'owner4',
    ownerName: 'Salma Khediri',
    ownerEmail: 'salma.khediri@esprit.tn',
    productCount: 15,
    createdAt: new Date('2024-03-01')
  }
];

@Component({
  selector: 'app-shops',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Header -->
        <div class="text-center mb-16">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-6 shadow-lg">
            <span class="text-3xl">🏪</span>
          </div>
          <h1 class="text-5xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Campus Marketplace
          </h1>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover amazing shops run by ESPRIT community members. From tech gadgets to study materials, find everything you need on campus.
          </p>
        </div>

        <!-- Search and Filters -->
        <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 mb-12">
          <div class="flex flex-col md:flex-row gap-6">
            <!-- Search -->
            <div class="flex-1">
              <div class="relative">
                <div class="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input 
                  type="text"
                  [(ngModel)]="searchQuery"
                  (input)="onSearchChange()"
                  class="w-full pl-14 pr-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-lg placeholder-gray-400"
                  placeholder="Search shops, products, or owners..."
                />
              </div>
            </div>
            
            <!-- Sort -->
            <div class="md:w-64">
              <select 
                [(ngModel)]="sortBy"
                (change)="onSortChange()"
                class="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white text-lg">
                <option value="newest">✨ Newest First</option>
                <option value="oldest">📅 Oldest First</option>
                <option value="name">🔤 Name A-Z</option>
                <option value="products">📦 Most Products</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div class="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div class="flex items-center justify-between mb-4">
              <div class="text-5xl font-black">{{ filteredShops().length }}</div>
              <div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <span class="text-2xl">🏪</span>
              </div>
            </div>
            <div class="text-emerald-100 font-semibold text-lg">Active Shops</div>
          </div>
          
          <div class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div class="flex items-center justify-between mb-4">
              <div class="text-5xl font-black">{{ totalProducts() }}</div>
              <div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <span class="text-2xl">📦</span>
              </div>
            </div>
            <div class="text-blue-100 font-semibold text-lg">Total Products</div>
          </div>
          
          <div class="bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl p-8 text-white shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div class="flex items-center justify-between mb-4">
              <div class="text-5xl font-black">{{ averageProducts() }}</div>
              <div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <span class="text-2xl">📊</span>
              </div>
            </div>
            <div class="text-purple-100 font-semibold text-lg">Avg Products/Shop</div>
          </div>
        </div>

        <!-- Loading State -->
        @if (isLoading()) {
          <div class="text-center py-20">
            <div class="inline-block w-16 h-16 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
            <p class="text-xl text-gray-600 font-medium">Loading amazing shops...</p>
          </div>
        }

        <!-- Shops Grid -->
        @else {
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            @for (shop of paginatedShops(); track shop.id; let i = $index) {
              <div 
                (click)="goToShopProducts(shop)"
                class="group bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:border-indigo-200 transition-all duration-500 cursor-pointer transform hover:-translate-y-2 shop-card"
                [style.animation-delay]="(i * 100) + 'ms'">
                
                <!-- Shop Header with Image and Badge -->
                <div class="relative">
                  <!-- Dynamic Background Pattern -->
                  <div class="absolute inset-0 bg-gradient-to-br" 
                       [ngClass]="getShopGradient(i)"></div>
                  <div class="absolute inset-0 opacity-20 pattern-dots"></div>
                  
                  <!-- Floating Elements -->
                  <div class="absolute top-4 left-4 w-8 h-8 bg-white/20 rounded-full animate-pulse"></div>
                  <div class="absolute top-8 right-8 w-4 h-4 bg-white/30 rounded-full animate-bounce" style="animation-delay: 1s;"></div>
                  
                  <!-- Shop Image/Logo -->
                  <div class="relative p-8 pb-4">
                    <div class="flex items-start gap-6">
                      <!-- Logo with Enhanced Design -->
                      <div class="flex-shrink-0 relative">
                        @if (shop.logo) {
                          <div class="w-28 h-28 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white group-hover:ring-indigo-200 transition-all duration-300 transform group-hover:scale-110">
                            <img 
                              [src]="shop.logo" 
                              [alt]="shop.name"
                              class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                        } @else {
                          <div class="w-28 h-28 bg-gradient-to-br from-white to-gray-100 rounded-3xl flex items-center justify-center shadow-2xl ring-4 ring-white group-hover:ring-indigo-200 transition-all duration-300 transform group-hover:scale-110">
                            <span class="text-4xl">{{ getShopEmoji(i) }}</span>
                          </div>
                        }
                        
                        <!-- Status Indicator -->
                        <div class="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                          <span class="text-white text-xs font-bold">✓</span>
                        </div>
                      </div>
                      
                      <!-- Shop Name and Product Count -->
                      <div class="flex-1 min-w-0">
                        <h3 class="text-2xl font-black text-white mb-3 group-hover:text-yellow-200 transition-colors duration-300 drop-shadow-lg">
                          {{ shop.name }}
                        </h3>
                        
                        <!-- Enhanced Product Count Badge -->
                        <div class="inline-flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-lg">
                          <div class="flex items-center gap-2">
                            <div class="w-4 h-4 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-pulse"></div>
                            <span class="text-sm font-bold text-gray-700">{{ shop.productCount || 0 }} Products</span>
                          </div>
                          <div class="w-px h-4 bg-gray-300"></div>
                          <div class="flex items-center gap-1">
                            <span class="text-yellow-500">⭐</span>
                            <span class="text-sm font-bold text-gray-700">{{ getRandomRating() }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Shop Content with Enhanced Design -->
                <div class="px-8 pb-8">
                  <!-- Description with Better Typography -->
                  <div class="mb-6">
                    <p class="text-gray-600 leading-relaxed text-base line-clamp-3 font-medium">
                      {{ shop.description }}
                    </p>
                  </div>
                  
                  <!-- Enhanced Contact Information -->
                  <div class="bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/20 rounded-2xl p-6 mb-6 border border-gray-100 relative overflow-hidden">
                    <!-- Background Pattern -->
                    <div class="absolute inset-0 opacity-5 pattern-grid"></div>
                    
                    <!-- Owner Info with Avatar -->
                    <div class="flex items-center gap-4 mb-6 relative">
                      <div class="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg transform group-hover:rotate-6 transition-transform duration-300">
                        {{ getOwnerInitials(shop.ownerName) }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="font-bold text-gray-900 text-lg">
                          {{ shop.ownerName || 'Shop Owner' }}
                        </div>
                        <div class="text-indigo-600 text-sm font-medium flex items-center gap-2">
                          <span class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                          {{ shop.ownerEmail || 'owner@esprit.tn' }}
                        </div>
                      </div>
                      
                      <!-- Verified Badge -->
                      <div class="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <span>✓</span>
                        Verified
                      </div>
                    </div>
                    
                    <!-- Contact Details Grid -->
                    <div class="grid grid-cols-1 gap-4 relative">
                      @if (shop.phone) {
                        <div class="flex items-center gap-4 p-4 bg-white/80 rounded-xl shadow-sm border border-white/50 hover:shadow-md transition-shadow">
                          <div class="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <div class="flex-1">
                            <div class="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</div>
                            <div class="font-bold text-gray-900">{{ shop.phone }}</div>
                          </div>
                        </div>
                      }
                      
                      @if (shop.address) {
                        <div class="flex items-center gap-4 p-4 bg-white/80 rounded-xl shadow-sm border border-white/50 hover:shadow-md transition-shadow">
                          <div class="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div class="flex-1">
                            <div class="text-xs font-bold text-gray-500 uppercase tracking-wider">Location</div>
                            <div class="font-bold text-gray-900">{{ shop.address }}</div>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                  
                  <!-- Enhanced Action Button -->
                  <button class="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold py-5 px-6 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl transform group-hover:scale-105 flex items-center justify-center gap-3 relative overflow-hidden">
                    <!-- Button Background Animation -->
                    <div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    
                    <span class="text-lg font-black relative z-10">Explore Products</span>
                    <svg class="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- Empty State -->
          @if (filteredShops().length === 0) {
            <div class="text-center py-20">
              <div class="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8">
                <span class="text-6xl">🔍</span>
              </div>
              <h3 class="text-3xl font-bold text-gray-900 mb-4">No shops found</h3>
              <p class="text-xl text-gray-600 mb-8">Try adjusting your search or filters to discover more shops</p>
              <button 
                (click)="searchQuery.set(''); onSearchChange()"
                class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3 px-8 rounded-2xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-lg">
                Clear Filters
              </button>
            </div>
          }

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="flex justify-center items-center gap-3 mt-16">
              <button 
                (click)="goToPage(currentPage() - 1)"
                [disabled]="currentPage() === 1"
                class="px-6 py-3 bg-white border-2 border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium">
                ← Previous
              </button>
              
              @for (page of getPageNumbers(); track page) {
                <button 
                  (click)="goToPage(page)"
                  [class]="page === currentPage() 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-transparent shadow-lg' 
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-indigo-300'"
                  class="px-4 py-3 border-2 rounded-2xl transition-all duration-300 font-bold min-w-[3rem]">
                  {{ page }}
                </button>
              }
              
              <button 
                (click)="goToPage(currentPage() + 1)"
                [disabled]="currentPage() === totalPages()"
                class="px-6 py-3 bg-white border-2 border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium">
                Next →
              </button>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Custom animations */
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }

    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .float-animation {
      animation: float 6s ease-in-out infinite;
    }

    .slide-in-up {
      animation: slideInUp 0.6s ease-out forwards;
    }

    /* Gradient text */
    .gradient-text {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* Glass morphism effect */
    .glass-card {
      background: rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.18);
    }

    /* Hover glow effect */
    .hover-glow:hover {
      box-shadow: 0 20px 40px rgba(99, 102, 241, 0.15);
    }

    /* Custom scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
    }

    ::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
    }

    /* Pulse animation for loading */
    .pulse-slow {
      animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    /* Card hover effects */
    .shop-card {
      transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      animation: slideInUp 0.6s ease-out forwards;
    }

    .shop-card:hover {
      transform: translateY(-8px) scale(1.02);
    }

    /* Background patterns */
    .pattern-dots {
      background-image: radial-gradient(circle, rgba(99, 102, 241, 0.1) 1px, transparent 1px);
      background-size: 20px 20px;
    }

    .pattern-grid {
      background-image: 
        linear-gradient(rgba(99, 102, 241, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(99, 102, 241, 0.05) 1px, transparent 1px);
      background-size: 20px 20px;
    }

    /* Shimmer effect */
    @keyframes shimmer {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }

    .shimmer {
      position: relative;
      overflow: hidden;
    }

    .shimmer::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
      animation: shimmer 2s infinite;
    }

    /* Staggered animation for cards */
    .shop-card:nth-child(1) { animation-delay: 0ms; }
    .shop-card:nth-child(2) { animation-delay: 100ms; }
    .shop-card:nth-child(3) { animation-delay: 200ms; }
    .shop-card:nth-child(4) { animation-delay: 300ms; }
    .shop-card:nth-child(5) { animation-delay: 400ms; }
    .shop-card:nth-child(6) { animation-delay: 500ms; }
  `]
})
export class Shops implements OnInit {
  private router = inject(Router);
  private shopService = inject(ShopService);

  // State
  shops = signal<Shop[]>([]);
  isLoading = signal(false);
  searchQuery = signal('');
  sortBy = signal('newest');
  currentPage = signal(1);
  itemsPerPage = signal(9);

  // Computed
  filteredShops = computed(() => {
    let filtered = this.shops();

    // Search filter
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(shop =>
        shop.name.toLowerCase().includes(query) ||
        shop.description.toLowerCase().includes(query) ||
        (shop.ownerName && shop.ownerName.toLowerCase().includes(query))
      );
    }

    // Sort
    switch (this.sortBy()) {
      case 'name':
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'products':
        filtered = [...filtered].sort((a, b) => (b.productCount || 0) - (a.productCount || 0));
        break;
      case 'oldest':
        filtered = [...filtered].sort((a, b) => 
          new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );
        break;
      case 'newest':
      default:
        filtered = [...filtered].sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        break;
    }

    return filtered;
  });

  paginatedShops = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.filteredShops().slice(start, end);
  });

  totalPages = computed(() => Math.ceil(this.filteredShops().length / this.itemsPerPage()));

  totalProducts = computed(() => 
    this.shops().reduce((sum, shop) => sum + (shop.productCount || 0), 0)
  );

  averageProducts = computed(() => {
    const shops = this.shops();
    if (shops.length === 0) return 0;
    return Math.round(this.totalProducts() / shops.length);
  });

  ngOnInit(): void {
    this.loadShops();
  }

  loadShops(): void {
    this.isLoading.set(true);
    
    this.shopService.getAll().subscribe({
      next: (shops) => {
        console.log('🏪 Shops loaded:', shops.length);
        this.shops.set(shops);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Failed to load shops:', err);
        // Fallback to mock data if API fails
        this.shops.set(mockShops);
        this.isLoading.set(false);
      }
    });
  }

  onSearchChange(): void {
    this.currentPage.set(1);
  }

  onSortChange(): void {
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
      pages.push(i);
    }
    
    return pages;
  }

  getOwnerInitials(name?: string): string {
    if (!name) return 'SO';
    const parts = name.split(' ');
    return parts.map(part => part.charAt(0).toUpperCase()).join('').slice(0, 2);
  }

  goToShopProducts(shop: Shop): void {
    console.log('🏪 Navigating to shop products:', shop.name);
    // Navigate to products page with shop filter
    this.router.navigate(['/products'], { 
      queryParams: { 
        shop: shop.id,
        shopName: shop.name 
      } 
    });
  }

  // Helper methods for enhanced design
  getShopGradient(index: number): string {
    const gradients = [
      'from-indigo-500 to-purple-600',
      'from-emerald-500 to-teal-600',
      'from-blue-500 to-indigo-600',
      'from-purple-500 to-pink-600',
      'from-orange-500 to-red-600',
      'from-cyan-500 to-blue-600'
    ];
    return gradients[index % gradients.length];
  }

  getShopEmoji(index: number): string {
    const emojis = ['🏪', '🛍️', '📱', '📚', '👕', '🍕', '⚡', '🎮'];
    return emojis[index % emojis.length];
  }

  getRandomRating(): string {
    const ratings = ['4.8', '4.9', '4.7', '4.6', '4.5', '5.0'];
    return ratings[Math.floor(Math.random() * ratings.length)];
  }
}