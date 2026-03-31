import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { ServiceCard } from '../../shared/components/service-card/service-card';
import { Product, StockStatus, ProductCondition, ProductStatus } from '../../models/product';
import { Service, ServiceService } from '../../../core/services/service.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService, Category } from '../../../core/services/category.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-home',
  imports: [ProductCard, ServiceCard, CommonModule, RouterLink, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  protected readonly Math = Math;
  private productService = inject(ProductService);
  private serviceService = inject(ServiceService);
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService);
  
  // Auth State
  isAdmin = computed(() => this.authService.isAdmin());
  isSeller = computed(() => this.authService.isSeller());
  
  // Countdown timer
  countdown = signal({ days: 3, hours: 23, minutes: 19, seconds: 56 });
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  // All products from MongoDB
  allProducts = signal<Product[]>([]);
  featuredProducts = signal<Product[]>([]);
  isLoadingProducts = signal(true);
  
  // All services from MongoDB
  allServices = signal<Service[]>([]);
  featuredServices = signal<Service[]>([]);
  isLoadingServices = signal(true);
  
  // Filter state
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('All');
  selectedCondition = signal<string>('All');
  sortBy = signal<string>('newest');
  showOnlyInStock = signal<boolean>(false);
  
  // Pagination
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(12);
  
  conditions = ['All', 'NEW', 'LIKE_NEW', 'GOOD', 'FAIR'];

  
  // Real categories from MongoDB
  categoriesFromDB = signal<Category[]>([]);
  categories = computed(() => {
    const dbCategories = this.categoriesFromDB().map(c => c.name);
    return ['All', ...dbCategories];
  });
  categoriesWithIcons = computed(() => {
    const categoryIcons: Record<string, string> = {
      'Electronics': '💻',
      'Electronique': '💻',
      'Books': '📚',
      'Livres': '📚',
      'Gaming': '🎮',
      'Jeux': '🎮',
      'Furniture': '🪑',
      'Meubles': '🪑',
      'Services': '🛠️',
      'Sports': '⚽',
      'General Services': '🛠️',
      'art': '🎨',
      'fourniture': '📝'
    };
    
    return this.categoriesFromDB().map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: categoryIcons[cat.name] || '📦',
      count: cat.productIds?.length || 0,
      slug: cat.name.toLowerCase().replace(/\s+/g, '-')
    }));
  });
  isLoadingCategories = signal(true);
  
  // Computed filtered products
  filteredProducts = computed(() => {
    let filtered = this.allProducts();

    // Search filter
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        (p.category && p.category.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (this.selectedCategory() !== 'All') {
      const selectedCatName = this.selectedCategory();
      const selectedCat = this.categoriesFromDB().find(c => c.name === selectedCatName);
      
      filtered = filtered.filter(p => {
        const hasMatchingId = selectedCat && p.categoryIds && p.categoryIds.includes(selectedCat.id);
        const hasMatchingName = p.category && p.category.toLowerCase() === selectedCatName.toLowerCase();
        return hasMatchingId || hasMatchingName;
      });
    }

    // Condition filter
    if (this.selectedCondition() !== 'All') {
      filtered = filtered.filter(p => p.condition === this.selectedCondition());
    }

    // Stock filter
    if (this.showOnlyInStock()) {
      filtered = filtered.filter(p => p.stockStatus !== StockStatus.OUT_OF_STOCK);
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
        break;
    }

    // Status filter: guests/clients only see approved
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

  ngOnInit(): void {
    this.startCountdown();
    this.loadCategories();
    this.loadProducts();
    this.loadServices();
  }

  loadCategories(): void {
    console.log('🏷️ Loading categories for home page...');
    this.isLoadingCategories.set(true);
    
    this.categoryService.getAll().subscribe({
      next: (data) => {
        console.log('✅ Categories loaded:', data.length);
        this.categoriesFromDB.set(data);
        this.isLoadingCategories.set(false);
      },
      error: (err) => {
        console.error('❌ Failed to load categories:', err);
        this.categoriesFromDB.set([]);
        this.isLoadingCategories.set(false);
      }
    });
  }

  loadProducts(): void {
    console.log('🏠 Loading products for home page...');
    this.isLoadingProducts.set(true);
    
    // Admin sees all products, others see approved only
    const request = this.isAdmin()
      ? this.productService.getAllAdmin()
      : this.productService.getAll();
    
    request.subscribe({
      next: (data) => {
        console.log('✅ Products loaded:', data.length);
        
        // Map products to the correct format
        const products = data.map(p => this.mapProduct(p));
        
        // Sort by date (newest first) - assuming createdAt field exists
        const sortedProducts = products.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA; // Newest first
        });
        
        // Store all products
        this.allProducts.set(sortedProducts);
        
        // Featured products: first 4 products (newest)
        this.featuredProducts.set(sortedProducts.slice(0, 4));
        
        this.isLoadingProducts.set(false);
      },
      error: (err) => {
        console.error('❌ Failed to load products:', err);
        this.isLoadingProducts.set(false);
      }
    });
  }

  loadServices(): void {
    console.log('🛠️ Loading services for home page...');
    this.isLoadingServices.set(true);
    
    this.serviceService.getAll().subscribe({
      next: (data) => {
        console.log('✅ Services loaded:', data.length);
        
        // Sort by date (newest first) if createdAt exists
        const sortedServices = [...data].sort((a: any, b: any) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA; // Newest first
        });
        
        // Store all services
        this.allServices.set(sortedServices);
        
        // Featured services: first 3 services (newest)
        this.featuredServices.set(sortedServices.slice(0, 3));
        
        this.isLoadingServices.set(false);
      },
      error: (err) => {
        console.error('❌ Failed to load services:', err);
        this.isLoadingServices.set(false);
      }
    });
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
      imageUrl: (product.images && product.images.length > 0) ? product.images[0].url || product.images[0] : 'assets/placeholder.png',
      sellerId: product.shopId || 'Unknown',
      sellerName: 'Marketplace Seller',
      rating: 4.5,
      reviewsCount: 12,
      stock: product.stock || 0,
      stockStatus: product.stock > 0 ? StockStatus.IN_STOCK : StockStatus.OUT_OF_STOCK,
      condition: product.condition || ProductCondition.NEW,
      isNegotiable: product.isNegotiable || false,
      status: (product.status as ProductStatus) || ProductStatus.APPROVED
    };
  }
  
  // Filter methods
  selectCategory(category: string): void {
    this.selectedCategory.set(category);
    this.currentPage.set(1);
  }

  selectCondition(condition: string): void {
    this.selectedCondition.set(condition);
    this.currentPage.set(1);
  }

  updateSort(sort: string): void {
    this.sortBy.set(sort);
  }

  toggleStockFilter(): void {
    this.showOnlyInStock.update(v => !v);
    this.currentPage.set(1);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('All');
    this.selectedCondition.set('All');
    this.showOnlyInStock.set(false);
    this.sortBy.set('newest');
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      // Scroll to products section
      document.getElementById('all-products')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  private startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.countdown.update(c => {
        let { days, hours, minutes, seconds } = c;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) {
          hours = 23;
          days--;
        }
        if (days < 0) {
          days = 0;
          hours = 0;
          minutes = 0;
          seconds = 0;
        }
        return { days, hours, minutes, seconds };
      });
    }, 1000);
  }


}
