import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { Product, StockStatus, ProductCondition } from '../../models/product';
import { ProductService } from '../../core/product.service';

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

  // Products data
  products = signal<Product[]>([
    {
      id: '1',
      name: 'Modern Laptop Stand',
      description: 'Ergonomic aluminum laptop stand for better productivity.',
      price: 120,
      category: 'Electronics',
      imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=870&auto=format&fit=crop',
      sellerId: 'seller1',
      sellerName: 'Amine K.',
      rating: 4.8,
      reviewsCount: 12,
      stock: 5,
      stockStatus: StockStatus.IN_STOCK,
      condition: ProductCondition.NEW,
      isNegotiable: false
    },
    {
      id: '2',
      name: 'Wireless Headphones',
      description: 'Noise cancelling premium headphones.',
      price: 350,
      originalPrice: 400,
      category: 'Electronics',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=870&auto=format&fit=crop',
      sellerId: 'seller2',
      sellerName: 'Sarra M.',
      rating: 4.5,
      reviewsCount: 25,
      stock: 2,
      stockStatus: StockStatus.LOW_STOCK,
      condition: ProductCondition.LIKE_NEW,
      isNegotiable: true
    },
    {
      id: '5',
      name: 'Mechanical Keyboard',
      description: 'RGB mechanical keyboard with Cherry MX switches.',
      price: 180,
      category: 'Gaming',
      imageUrl: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=870&auto=format&fit=crop',
      sellerId: 'seller3',
      sellerName: 'Yassine R.',
      rating: 4.7,
      reviewsCount: 18,
      stock: 8,
      stockStatus: StockStatus.IN_STOCK,
      condition: ProductCondition.NEW,
      isNegotiable: false
    },
    {
      id: '6',
      name: 'Organic Chemistry Notes',
      description: 'Comprehensive notes for engineering students.',
      price: 15,
      category: 'Books',
      imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=773&auto=format&fit=crop',
      sellerId: 'seller4',
      sellerName: 'Leila J.',
      rating: 5.0,
      reviewsCount: 42,
      stock: 20,
      stockStatus: StockStatus.IN_STOCK,
      condition: ProductCondition.GOOD,
      isNegotiable: true
    },
    {
      id: '7',
      name: 'IKEA Desk Lamp',
      description: 'LED desk lamp with adjustable arm.',
      price: 35,
      category: 'Furniture',
      imageUrl: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?q=80&w=774&auto=format&fit=crop',
      sellerId: 'seller5',
      sellerName: 'Karim O.',
      rating: 4.3,
      reviewsCount: 10,
      stock: 0,
      stockStatus: StockStatus.OUT_OF_STOCK,
      condition: ProductCondition.GOOD,
      isNegotiable: true
    },
    {
      id: '8',
      name: 'Scientific Calculator TI-84',
      description: 'Essential for engineering exams.',
      price: 85,
      category: 'Electronics',
      imageUrl: 'https://images.unsplash.com/photo-1564466809058-bf4114d55352?q=80&w=400',
      sellerId: 'seller6',
      sellerName: 'Ahmed S.',
      rating: 4.9,
      reviewsCount: 33,
      stock: 4,
      stockStatus: StockStatus.IN_STOCK,
      condition: ProductCondition.LIKE_NEW,
      isNegotiable: false
    }
  ]);

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
}
