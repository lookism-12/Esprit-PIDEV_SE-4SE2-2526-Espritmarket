import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { RecommendationWidget } from '../../shared/components/recommendation-widget/recommendation-widget';
import { Product, StockStatus, ProductCondition } from '../../models/product';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ProductService } from '../../core/product.service';
import { AuthService } from '../../core/auth.service';

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
  imports: [ProductCard, RecommendationWidget, CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Current logged-in user ID for recommendations
  readonly currentUserId = computed(() => this.authService.currentUser()?.id ?? null);
  readonly isLoggedIn = computed(() => !!this.authService.currentUser());

  // Wheel of Fortune popup
  showWheelPopup = signal(false);

  // Countdown timer
  countdown = signal({ days: 3, hours: 23, minutes: 19, seconds: 56 });
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  featuredProducts = signal<Product[]>([]);
  recommendedProducts = signal<Product[]>([]);

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
    this.loadProducts();

    // Show wheel popup after 1.5s if user is logged in
    setTimeout(() => {
      if (this.isLoggedIn()) {
        const dismissed = sessionStorage.getItem('wheelPopupDismissed');
        if (!dismissed) {
          this.showWheelPopup.set(true);
        }
      }
    }, 1500);
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  private loadProducts(): void {
    this.productService.getAll().subscribe({
      next: (products) => {
        const sorted = [...products].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        this.featuredProducts.set(sorted.slice(0, 4) as any);
        this.recommendedProducts.set(sorted.slice(4, 6) as any);
        console.log('✅ Home products loaded:', sorted.length);
      },
      error: () => this.setFallbackProducts()
    });
  }

  private setFallbackProducts(): void {
    this.featuredProducts.set([
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
        name: 'Wireless Noise Cancelling Headphones',
        description: 'Premium sound quality with long battery life.',
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
      }
    ]);

    this.recommendedProducts.set([
      {
        id: '5',
        name: 'Mechanical Keyboard RGB',
        description: 'Cherry MX switches, full RGB backlighting.',
        price: 180,
        category: 'Gaming',
        imageUrl: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=870&auto=format&fit=crop',
        sellerId: 'seller5',
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
        name: 'USB-C Hub 7-in-1',
        description: 'All ports you need in one compact hub.',
        price: 65,
        category: 'Electronics',
        imageUrl: 'https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?q=80&w=870&auto=format&fit=crop',
        sellerId: 'seller6',
        sellerName: 'Ahmed S.',
        rating: 4.6,
        reviewsCount: 9,
        stock: 12,
        stockStatus: StockStatus.IN_STOCK,
        condition: ProductCondition.NEW,
        isNegotiable: true
      }
    ]);
  }

  private startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.countdown.update(c => {
        let { days, hours, minutes, seconds } = c;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; days--; }
        if (days < 0) { days = 0; hours = 0; minutes = 0; seconds = 0; }
        return { days, hours, minutes, seconds };
      });
    }, 1000);
  }

  copyPromoCode(code: string): void {
    navigator.clipboard.writeText(code);
  }

  dismissWheelPopup(): void {
    this.showWheelPopup.set(false);
    sessionStorage.setItem('wheelPopupDismissed', '1');
  }

  goToWheel(): void {
    this.showWheelPopup.set(false);
    this.router.navigate(['/wheel']);
  }
}
