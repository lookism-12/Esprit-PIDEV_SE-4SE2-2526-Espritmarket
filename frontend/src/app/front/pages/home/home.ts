import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { Product, StockStatus, ProductCondition } from '../../models/product';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ProductService } from '../../core/product.service';

interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: number;
  type: 'percentage' | 'fixed';
  code: string;
  expiresAt: Date;
  imageUrl: string;
  backgroundColor: string;
}

@Component({
  selector: 'app-home',
  imports: [ProductCard, CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private productService = inject(ProductService);
  isAuthenticated = this.authService.isAuthenticated;
  selectedProduct = signal<Product | null>(null);

  // Countdown timer
  countdown = signal({ days: 3, hours: 23, minutes: 19, seconds: 56 });
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  featuredProducts = signal<Product[]>([]);

  // Promotions
  promotions = signal<Promotion[]>([
    {
      id: '1',
      title: 'Student Welcome',
      description: 'New to ESPRIT Market? Get 15% off your first purchase!',
      discount: 15,
      type: 'percentage',
      code: 'WELCOME15',
      expiresAt: new Date('2024-03-31'),
      imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=400',
      backgroundColor: 'from-primary to-primary-dark'
    },
    {
      id: '2',
      title: 'Electronics Week',
      description: 'Save big on laptops, headphones, and more!',
      discount: 20,
      type: 'percentage',
      code: 'TECH20',
      expiresAt: new Date('2024-03-15'),
      imageUrl: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?q=80&w=400',
      backgroundColor: 'from-blue-600 to-blue-800'
    },
    {
      id: '3',
      title: 'Books Sale',
      description: 'All textbooks and study materials at reduced prices',
      discount: 10,
      type: 'fixed',
      code: 'BOOKS10',
      expiresAt: new Date('2024-03-20'),
      imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=400',
      backgroundColor: 'from-green-600 to-green-800'
    }
  ]);

  // AI Recommendations (placeholder)
  recommendedProducts = signal<Product[]>([]);

  // Categories
  categories = signal([
    { name: 'Electronics', icon: '💻', count: 156, slug: 'electronics' },
    { name: 'Books', icon: '📚', count: 89, slug: 'books' },
    { name: 'Gaming', icon: '🎮', count: 45, slug: 'gaming' },
    { name: 'Furniture', icon: '🪑', count: 32, slug: 'furniture' },
    { name: 'Services', icon: '🛠️', count: 28, slug: 'services' },
    { name: 'Sports', icon: '⚽', count: 21, slug: 'sports' }
  ]);

  ngOnInit(): void {
    this.startCountdown();
    this.fetchProducts();
  }
 
  private fetchProducts(): void {
    this.productService.getAll({ limit: 8 }).subscribe({
      next: (products) => {
        this.featuredProducts.set(products.slice(0, 4));
        this.recommendedProducts.set(products.slice(4, 6));
      },
      error: (err) => {
        console.error('Error fetching home products:', err);
      }
    });
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

  copyPromoCode(code: string): void {
    navigator.clipboard.writeText(code);
  }

  openQuickView(product: Product): void {
    this.selectedProduct.set(product);
    document.body.style.overflow = 'hidden';
  }

  closeQuickView(): void {
    this.selectedProduct.set(null);
    document.body.style.overflow = '';
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

  getConditionText(condition: ProductCondition): string {
    return condition.replace('_', ' ');
  }
}
