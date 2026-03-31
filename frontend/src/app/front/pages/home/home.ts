import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { Product } from '../../models/product';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

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
  standalone: true,
  imports: [ProductCard, CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  private productService = inject(ProductService);

  // Countdown timer
  countdown = signal({ days: 3, hours: 23, minutes: 19, seconds: 56 });
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  featuredProducts = signal<Product[]>([]);
  recommendedProducts = signal<Product[]>([]);
  isLoading = signal<boolean>(true);

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
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.productService.getAll().subscribe({
      next: (res) => {
        // Take first 4 for featured, next 2 for recommended
        this.featuredProducts.set(res.slice(0, 4));
        this.recommendedProducts.set(res.slice(4, 6));
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Failed to load home products', err);
        this.isLoading.set(false);
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
}
