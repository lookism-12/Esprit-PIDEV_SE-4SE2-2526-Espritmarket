import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { Product, StockStatus, ProductCondition, ProductStatus } from '../../models/product';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService, Category } from '../../../core/services/category.service';
import { AuthService } from '../../core/auth.service';
import { ImageUrlHelper } from '../../../shared/utils/image-url.helper';
import { MarketplaceMLService, MarketplaceMLInsight } from '../../core/marketplace-ml.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ProductCard, FormsModule, RouterLink],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products implements OnInit {
  protected readonly Math = Math;
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService);
  readonly mlService = inject(MarketplaceMLService);

  // ML insights: productId → insight
  readonly mlInsights = signal<Map<string, MarketplaceMLInsight>>(new Map());
  readonly mlLoading = signal(false);

  // Auth State
  isAdmin = computed(() => this.authService.isAdmin());
  isSeller = computed(() => this.authService.isSeller());
  isAuthenticated = computed(() => this.authService.isAuthenticated());
  readonly currentUserId = computed(() => this.authService.currentUser()?.id ?? null);

  // Products data
  products = signal<Product[]>([]);

  // Filter state
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('All');
  selectedCondition = signal<string>('All');
  priceRange = signal<{ min: number; max: number }>({ min: 0, max: 10000 });
  sortBy = signal<string>('newest');
  showOnlyInStock = signal<boolean>(false);
  showOnlyNegotiable = signal<boolean>(false);
  
  // ✅ Added shop filtering
  selectedShopId = signal<string | null>(null);
  selectedShopName = signal<string | null>(null);

  // Pagination
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(9);

  // UI State
  isLoading = signal<boolean>(false);
  viewMode = signal<'grid' | 'list'>('grid');
  showFilters = signal<boolean>(true);

  // Categories from MongoDB
  categoriesFromDB = signal<Category[]>([]);
  categories = computed(() => {
    const dbCategories = this.categoriesFromDB().map(c => c.name);
    return ['All', ...dbCategories];
  });
  conditions = ['All', 'NEW', 'LIKE_NEW', 'GOOD', 'FAIR'];

  // Price filter fields for template binding
  minPrice = 0;
  maxPrice = 10000;

  // Template-bound helpers

  // Template event handlers
  onSearchChange(): void { this.currentPage.set(1); }
  onCategoryChange(): void { this.currentPage.set(1); }
  onSortChange(): void { this.currentPage.set(1); }
  resetFilters(): void { this.clearFilters(); }
  changePage(page: number): void { this.goToPage(page); }

  // Computed
  filteredProducts = computed(() => {
    let filtered = this.products();

    // Search filter
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        (p.category && p.category.toLowerCase().includes(query))
      );
    }

    // Category filter - hybrid approach (checks both categoryIds and category name)
    if (this.selectedCategory() !== 'All') {
      const selectedCatName = this.selectedCategory();
      const selectedCat = this.categoriesFromDB().find(c => c.name === selectedCatName);
      
      filtered = filtered.filter(p => {
        const hasMatchingId = selectedCat && p.categoryIds && p.categoryIds.includes(selectedCat.id);
        const hasMatchingName = p.category && p.category.toLowerCase() === selectedCatName.toLowerCase();
        return hasMatchingId || hasMatchingName;
      });
    }

    // ✅ Shop filter
    if (this.selectedShopId()) {
      filtered = filtered.filter(p => p.shopId === this.selectedShopId());
    }

    // Condition filter
    if (this.selectedCondition() !== 'All') {
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
        filtered = [...filtered].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
    }

    // Status filter: guests/clients only see approved; sellers and admins see all loaded items
    if (!this.isAdmin() && !this.isSeller()) {
      filtered = filtered.filter(p => p.status === ProductStatus.APPROVED);
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
    // Load categories and products in PARALLEL
    this.categoryService.getAll().subscribe({
      next: (categories) => this.categoriesFromDB.set(categories),
      error: () => this.categoriesFromDB.set([])
    });

    this.loadProducts();

    // Check for search query and shop filter in URL
    this.route.queryParams.subscribe(params => {
      if (params['q']) this.searchQuery.set(params['q']);
      if (params['category']) this.selectedCategory.set(params['category']);
      if (params['shop']) this.filterByShop(params['shop'], params['shopName']);
    });
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.productService.getAll().subscribe({
      next: (data) => {
        const mapped = data.map(p => this.mapProduct(p));
        this.products.set(mapped);
        this.isLoading.set(false);
        // Load ML insights for all products (non-blocking)
        this.loadMLInsights(mapped.map(p => p.id));
      },
      error: () => this.isLoading.set(false)
    });
  }

  private loadMLInsights(productIds: string[]): void {
    if (!productIds.length) return;
    this.mlLoading.set(true);
    this.mlService.getBatchInsights(productIds).subscribe({
      next: insights => {
        this.mlInsights.set(insights);
        this.mlLoading.set(false);
      },
      error: () => this.mlLoading.set(false)
    });
  }

  /** Get ML insight for a product (used in template) */
  getInsight(productId: string): MarketplaceMLInsight | null {
    return this.mlInsights().get(productId) ?? null;
  }

  mapProduct(product: any): Product {
    const catIds = product.categoryIds as string[] | undefined;
    
    // Try to resolve category name from categoryIds
    let categoryName = product.category || 'Others';
    if (catIds && catIds.length > 0 && this.categoriesFromDB().length > 0) {
      const firstCat = this.categoriesFromDB().find(c => c.id === catIds[0]);
      if (firstCat) {
        categoryName = firstCat.name;
      }
    }
    
    return {
      id: product.id || product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      categoryIds: catIds,
      category: categoryName,
      imageUrl: ImageUrlHelper.toAbsoluteUrl((product.images && product.images.length > 0) ? product.images[0].url || product.images[0] : null),
      sellerId: product.shopId || 'Unknown',
      shopId: product.shopId || 'Unknown',
      sellerName: product.shopName || 'Marketplace Seller', // ✅ Use shop name from backend
      rating: 4.5,
      reviewsCount: 12,
      stock: product.stock || 0,
      stockStatus: product.stock > 0 ? StockStatus.IN_STOCK : StockStatus.OUT_OF_STOCK,
      condition: product.condition || ProductCondition.NEW,
      isNegotiable: product.isNegotiable || false,
      status: (product.status as ProductStatus) || ProductStatus.PENDING,
      createdAt: product.createdAt ? new Date(product.createdAt) : undefined
    };
  }

  // --- Marketplace Actions ---

  approveProduct(id: string): void {
    this.productService.approveProduct(id).subscribe({
      next: () => this.loadProducts(),
      error: (err) => console.error('Failed to approve product', err)
    });
  }

  rejectProduct(id: string): void {
    this.productService.rejectProduct(id).subscribe({
      next: () => this.loadProducts(),
      error: (err) => console.error('Failed to reject product', err)
    });
  }

  deleteProduct(id: string): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => this.loadProducts(),
        error: (err) => console.error('Failed to delete product', err)
      });
    }
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
    this.selectedCategory.set('All');
    this.selectedCondition.set('All');
    this.priceRange.set({ min: 0, max: 10000 });
    this.minPrice = 0;
    this.maxPrice = 10000;
    this.showOnlyInStock.set(false);
    this.showOnlyNegotiable.set(false);
    this.sortBy.set('newest');
    this.currentPage.set(1);
    // ✅ Clear shop filter
    this.selectedShopId.set(null);
    this.selectedShopName.set(null);
  }

  // ✅ Added shop filtering method
  filterByShop(shopId: string, shopName?: string): void {
    console.log('🏪 Filtering products by shop:', shopId, shopName);
    this.selectedShopId.set(shopId);
    this.selectedShopName.set(shopName || 'Shop');
    this.currentPage.set(1);
  }

  // ✅ Clear shop filter
  clearShopFilter(): void {
    this.selectedShopId.set(null);
    this.selectedShopName.set(null);
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
      case StockStatus.IN_STOCK: return 'In Stock';
      case StockStatus.LOW_STOCK: return 'Low Stock';
      case StockStatus.OUT_OF_STOCK: return 'Out of Stock';
      default: return 'Unknown';
    }
  }
}
