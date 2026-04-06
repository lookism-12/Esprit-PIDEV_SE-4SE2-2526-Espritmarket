import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { Product, StockStatus, ProductCondition } from '../../models/product';
import { ProductService } from '../../core/product.service';
import { CategoryService } from '../../core/shop.service';
import { AuthService } from '../../core/auth.service';
import { UserRole } from '../../models/user.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ProductCard, FormsModule, RouterLink],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService);

  // Check if user is a provider/seller
  isProvider = computed(() => this.authService.userRole() === UserRole.PROVIDER);
  isAuthenticated = computed(() => this.authService.isAuthenticated());

  // Products data - Start empty, load from backend
  products = signal<Product[]>([]);

  // Filter state
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('Toutes');
  selectedCondition = signal<string>('Tous');
  priceRange = signal<{ min: number; max: number }>({ min: 0, max: 1000 });
  sortBy = signal<string>('newest');
  showOnlyInStock = signal<boolean>(false);
  showOnlyNegotiable = signal<boolean>(false);

  // Pagination
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(9);

  // UI State
  isLoading = signal<boolean>(false);
  viewMode = signal<'grid' | 'list'>('grid');
  showFilters = signal<boolean>(true);

  // Categories - loaded from backend  
  categories = signal<string[]>(['Toutes', 'Électronique', 'Livres', 'Mobilier', 'Gaming', 'Services', 'Autres']);
  conditions = ['Tous', 'NEUF', 'COMME_NEUF', 'BON', 'CORRECT'];

  // Computed
  filteredProducts = computed(() => {
    let filtered = this.products();

    // Search filter
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (this.selectedCategory() !== 'Toutes') {
      filtered = filtered.filter(p => p.category === this.selectedCategory());
    }

    // Condition filter
    if (this.selectedCondition() !== 'Tous') {
      filtered = filtered.filter(p => p.condition === this.selectedCondition());
    }

    // Price range filter
    const { min, max } = this.priceRange();
    filtered = filtered.filter(p => p.price >= min && p.price <= max);

    // Stock filter
    if (this.showOnlyInStock()) {
      filtered = filtered.filter(p => p.stockStatus !== StockStatus.OUT_OF_STOCK);
    }

    // Negotiable filter
    if (this.showOnlyNegotiable()) {
      filtered = filtered.filter(p => p.isNegotiable);
    }

    // Sorting
    switch (this.sortBy()) {
      case 'price-low':
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered = [...filtered].sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
      default:
        // Keep original order (newest first)
        break;
    }

    return filtered;
  });

  paginatedProducts = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.filteredProducts().slice(start, end);
  });

  totalPages = computed(() => Math.ceil(this.filteredProducts().length / this.itemsPerPage()));

  // AI Recommendations (placeholder)
  recommendedProducts = computed(() => {
    return this.products().slice(0, 4);
  });

  ngOnInit(): void {
    // Load real products from backend - ONLY APPROVED PRODUCTS for marketplace
    this.isLoading.set(true);
    this.productService.getApprovedProducts().subscribe({
      next: (products) => {
        // ✅ SHOW ONLY APPROVED PRODUCTS: Everyone sees only approved products
        // PENDING products are visible only in dashboards
        this.products.set(products);
        this.isLoading.set(false);
        console.log(`✅ Approved products loaded successfully: ${products.length} products`);
        
        const outOfStock = products.filter(p => p.stock === 0).length;
        if (outOfStock > 0) {
          console.log(`   📦 ${products.length - outOfStock} in stock, ${outOfStock} out of stock (displayed as blocked)`);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('❌ Failed to load approved products:', err);
        console.log('⚠️ No fallback products - marketplace will show empty state');
        // Products stays empty array to show proper empty state
      }
    });

    // Load categories from backend
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        const categoryNames = categories.map(cat => cat.name);
        this.categories.set(['Toutes', ...categoryNames]);
        console.log('✅ Categories loaded successfully:', categoryNames.length);
      },
      error: (err) => {
        console.error('❌ Failed to load categories:', err);
        console.log('⚠️ Using default categories as fallback');
      }
    });

    // Check for search query in URL
    this.route.queryParams.subscribe(params => {
      if (params['q']) {
        this.searchQuery.set(params['q']);
      }
      if (params['category']) {
        this.selectedCategory.set(params['category']);
      }
    });
  }

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
    this.currentPage.set(1);
  }

  selectCondition(condition: string): void {
    this.selectedCondition.set(condition);
    this.currentPage.set(1);
  }

  updatePriceRange(min: number, max: number): void {
    this.priceRange.set({ min, max });
    this.currentPage.set(1);
  }

  updateSort(sort: string): void {
    this.sortBy.set(sort);
  }

  toggleStockFilter(): void {
    this.showOnlyInStock.update(v => !v);
    this.currentPage.set(1);
  }

  toggleNegotiableFilter(): void {
    this.showOnlyNegotiable.update(v => !v);
    this.currentPage.set(1);
  }

  toggleFilters(): void {
    this.showFilters.update(v => !v);
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('Toutes');
    this.selectedCondition.set('Tous');
    this.priceRange.set({ min: 0, max: 1000 });
    this.showOnlyInStock.set(false);
    this.showOnlyNegotiable.set(false);
    this.sortBy.set('newest');
    this.currentPage.set(1);
  }

  getStockStatusClass(status: StockStatus): string {
    switch (status) {
      case StockStatus.IN_STOCK: return 'text-green-600 bg-green-50';
      case StockStatus.LOW_STOCK: return 'text-orange-600 bg-orange-50';
      case StockStatus.OUT_OF_STOCK: return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }

  getStockStatusText(status: StockStatus): string {
    switch (status) {
      case StockStatus.IN_STOCK: return 'En stock';
      case StockStatus.LOW_STOCK: return 'Stock faible';
      case StockStatus.OUT_OF_STOCK: return 'Rupture de stock';
      default: return 'Inconnu';
    }
  }
}
