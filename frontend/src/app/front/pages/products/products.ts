import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { ProductService, ProductFilter } from '../../core/product.service';
import { AuthService } from '../../core/auth.service';
import { Product, StockStatus, ProductCondition } from '../../models/product';
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
  private authService = inject(AuthService);

  // Auth signals
  isProvider = computed(() => this.authService.userRole() === UserRole.PROVIDER);

  // Products data
  products = signal<Product[]>([]);

  // Filter state
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('All');
  selectedCondition = signal<string>('All');
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
  selectedProduct = signal<Product | null>(null);
  showAddMenu = signal<boolean>(false);

  // Categories
  categories = ['All', 'Electronics', 'Books', 'Furniture', 'Gaming', 'Services', 'Others'];
  conditions = ['All', 'NEW', 'LIKE_NEW', 'GOOD', 'FAIR'];

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
    if (this.selectedCategory() !== 'All') {
      filtered = filtered.filter(p => p.category === this.selectedCategory());
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
    // Check for search query in URL
    this.route.queryParams.subscribe(params => {
      if (params['q']) {
        this.searchQuery.set(params['q']);
      }
      if (params['category']) {
        this.selectedCategory.set(params['category']);
      }
      this.fetchProducts();
    });
  }
 
  fetchProducts(): void {
    const filter: ProductFilter = {};
    if (this.selectedCategory() !== 'All') filter.category = this.selectedCategory();
    if (this.searchQuery()) filter.search = this.searchQuery();
    
    this.isLoading.set(true);
    this.productService.getAll(filter).subscribe({
      next: (products) => {
        this.products.set(products);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching products:', err);
        this.isLoading.set(false);
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
    this.selectedCategory.set('All');
    this.selectedCondition.set('All');
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
      case StockStatus.IN_STOCK: return 'In Stock';
      case StockStatus.LOW_STOCK: return 'Low Stock';
      case StockStatus.OUT_OF_STOCK: return 'Out of Stock';
      default: return 'Unknown';
    }
  }

  openQuickView(product: Product): void {
    this.selectedProduct.set(product);
    document.body.style.overflow = 'hidden';
  }

  closeQuickView(): void {
    this.selectedProduct.set(null);
    document.body.style.overflow = '';
  }

  getConditionText(condition: ProductCondition): string {
    return condition.replace('_', ' ');
  }
}
