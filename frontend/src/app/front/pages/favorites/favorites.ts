import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FavoriteService } from '../../core/favorite.service';
import { ProductService } from '../../core/product.service';
import { CartService } from '../../core/cart.service';
import { ToastService } from '../../core/toast.service';
import { Product, StockStatus } from '../../models/product';

interface FavoriteItem {
  favoriteId: string;
  product: Product;
}

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './favorites.html',
  styleUrl: './favorites.scss',
})
export class Favorites implements OnInit {
  private favoriteService = inject(FavoriteService);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private toastService = inject(ToastService);

  favoriteItems = signal<FavoriteItem[]>([]);
  isLoading = signal(true);

  itemCount = computed(() => this.favoriteItems().length);
  outOfStockCount = computed(() =>
    this.favoriteItems().filter(f => f.product.stock <= 0).length
  );
  // Price drops: products where current price < original (if originalPrice exists)
  priceDropCount = computed(() =>
    this.favoriteItems().filter(f => f.product.originalPrice && f.product.price < f.product.originalPrice).length
  );

  ngOnInit(): void {
    this.loadFavorites();
  }

  loadFavorites(): void {
    this.isLoading.set(true);
    this.favoriteService.loadMyFavorites();

    // Wait a tick for the signal to update, then fetch product details
    setTimeout(() => {
      const favs = this.favoriteService.favorites();
      const productFavs = favs.filter(f => f.productId);

      if (productFavs.length === 0) {
        this.favoriteItems.set([]);
        this.isLoading.set(false);
        return;
      }

      const calls = productFavs.map(fav =>
        this.productService.getById(fav.productId!).pipe(catchError(() => of(null)))
      );

      forkJoin(calls).subscribe(products => {
        const items: FavoriteItem[] = [];
        products.forEach((product, i) => {
          if (product) {
            items.push({ favoriteId: productFavs[i].id, product });
          }
        });
        this.favoriteItems.set(items);
        this.isLoading.set(false);
      });
    }, 600);
  }

  removeFromFavorites(favoriteId: string, productName: string): void {
    this.favoriteService.removeById(favoriteId).subscribe(() => {
      this.favoriteItems.update(items => items.filter(f => f.favoriteId !== favoriteId));
      this.toastService.success(`${productName} removed from favorites`);
    });
  }

  clearAllFavorites(): void {
    if (!confirm('Remove all favorites?')) return;
    const items = this.favoriteItems();
    const calls = items.map(item => this.favoriteService.removeById(item.favoriteId));
    forkJoin(calls).subscribe(() => {
      this.favoriteItems.set([]);
      this.toastService.success('All favorites cleared');
    });
  }

  addToCart(product: Product): void {
    if (product.stock <= 0) { this.toastService.error('Out of stock'); return; }
    this.cartService.addItem({ productId: product.id, quantity: 1 }).subscribe({
      next: () => this.toastService.success(`${product.name} added to cart`),
      error: () => this.toastService.error('Failed to add to cart')
    });
  }

  isOutOfStock(product: Product): boolean { return product.stock <= 0; }
  isLowStock(product: Product): boolean { return product.stock > 0 && product.stock <= 5; }

  getPriceChangeType(product: Product): 'decreased' | 'increased' | 'unchanged' {
    if (!product.originalPrice) return 'unchanged';
    if (product.price < product.originalPrice) return 'decreased';
    if (product.price > product.originalPrice) return 'increased';
    return 'unchanged';
  }

  getPriceChangeAmount(product: Product): number {
    if (!product.originalPrice) return 0;
    return Math.abs(product.price - product.originalPrice);
  }

  getPriceChangePercent(product: Product): number {
    if (!product.originalPrice) return 0;
    return Math.abs(((product.price - product.originalPrice) / product.originalPrice) * 100);
  }

  getPriceChangeClass(type: string): string {
    if (type === 'decreased') return 'text-green-600 bg-green-50';
    if (type === 'increased') return 'text-red-600 bg-red-50';
    return 'text-gray-500 bg-gray-50';
  }

  getPriceChangeIcon(type: string): string {
    if (type === 'decreased') return '↓';
    if (type === 'increased') return '↑';
    return '−';
  }
}
