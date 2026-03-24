import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product, StockStatus, ProductCondition } from '../../models/product';
import { FavoriteService } from '../../core/favorite.service';

interface FavoriteItem {
  product: Product;
  originalPrice: number;
  priceChange: {
    type: 'increased' | 'decreased' | 'unchanged';
    amount: number;
    percentage: number;
  };
  addedAt: Date;
}

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './favorites.html',
  styleUrl: './favorites.scss',
})
export class Favorites {
  private favoriteService = inject(FavoriteService);

  favoriteItems = signal<FavoriteItem[]>([
    {
      product: {
        id: '2',
        name: 'Wireless Noise Cancelling Headphones',
        description: 'Premium sound quality with long battery life.',
        price: 320,
        originalPrice: 350,
        category: 'Electronics',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=870&auto=format&fit=crop',
        sellerId: 'seller1',
        sellerName: 'Sarra M.',
        rating: 4.5,
        reviewsCount: 25,
        stock: 5,
        stockStatus: StockStatus.IN_STOCK,
        condition: ProductCondition.LIKE_NEW,
        isNegotiable: true,
        isFavorite: true
      },
      originalPrice: 350,
      priceChange: { type: 'decreased', amount: 30, percentage: 8.57 },
      addedAt: new Date('2024-02-20')
    },
    {
      product: {
        id: '3',
        name: 'Modern Laptop Stand',
        description: 'Ergonomic aluminum laptop stand for better productivity.',
        price: 135,
        category: 'Electronics',
        imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=870&auto=format&fit=crop',
        sellerId: 'seller2',
        sellerName: 'Amine K.',
        rating: 4.8,
        reviewsCount: 12,
        stock: 2,
        stockStatus: StockStatus.LOW_STOCK,
        condition: ProductCondition.NEW,
        isNegotiable: false,
        isFavorite: true
      },
      originalPrice: 120,
      priceChange: { type: 'increased', amount: 15, percentage: 12.5 },
      addedAt: new Date('2024-02-15')
    },
    {
      product: {
        id: '4',
        name: 'Calculus Made Easy',
        description: 'Perfect textbook for first-year engineering students.',
        price: 45,
        category: 'Books',
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=774&auto=format&fit=crop',
        sellerId: 'seller3',
        sellerName: 'Mehdi B.',
        rating: 4.9,
        reviewsCount: 8,
        stock: 10,
        stockStatus: StockStatus.IN_STOCK,
        condition: ProductCondition.GOOD,
        isNegotiable: true,
        isFavorite: true
      },
      originalPrice: 45,
      priceChange: { type: 'unchanged', amount: 0, percentage: 0 },
      addedAt: new Date('2024-02-10')
    },
    {
      product: {
        id: '5',
        name: 'Mechanical Keyboard RGB',
        description: 'Cherry MX switches, full RGB backlighting.',
        price: 180,
        category: 'Electronics',
        imageUrl: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=870&auto=format&fit=crop',
        sellerId: 'seller4',
        sellerName: 'Yassine R.',
        rating: 4.7,
        reviewsCount: 18,
        stock: 0,
        stockStatus: StockStatus.OUT_OF_STOCK,
        condition: ProductCondition.NEW,
        isNegotiable: false,
        isFavorite: true
      },
      originalPrice: 200,
      priceChange: { type: 'decreased', amount: 20, percentage: 10 },
      addedAt: new Date('2024-02-05')
    }
  ]);

  // Computed
  itemCount = computed(() => this.favoriteItems().length);
  priceDropCount = computed(() => 
    this.favoriteItems().filter(f => f.priceChange.type === 'decreased').length
  );
  outOfStockCount = computed(() => 
    this.favoriteItems().filter(f => f.product.stockStatus === StockStatus.OUT_OF_STOCK).length
  );

  // Products for product card
  favoriteProducts = computed(() => this.favoriteItems().map(f => f.product));

  removeFromFavorites(productId: string): void {
    this.favoriteItems.update(items => 
      items.filter(f => f.product.id !== productId)
    );
  }

  clearAllFavorites(): void {
    if (confirm('Are you sure you want to clear all favorites?')) {
      this.favoriteItems.set([]);
    }
  }

  getPriceChangeClass(type: string): string {
    switch (type) {
      case 'decreased': return 'text-green-600 bg-green-50';
      case 'increased': return 'text-red-600 bg-red-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  }

  getPriceChangeIcon(type: string): string {
    switch (type) {
      case 'decreased': return '↓';
      case 'increased': return '↑';
      default: return '−';
    }
  }

  getStockStatusClass(status: StockStatus): string {
    switch (status) {
      case StockStatus.IN_STOCK: return 'text-green-600';
      case StockStatus.LOW_STOCK: return 'text-orange-500';
      case StockStatus.OUT_OF_STOCK: return 'text-red-500';
      default: return 'text-gray-500';
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
