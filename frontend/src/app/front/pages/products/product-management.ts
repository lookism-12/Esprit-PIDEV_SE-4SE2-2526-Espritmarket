import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/product.service';
import { Product, StockStatus } from '../../models/product';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink],
  templateUrl: './product-management.html',
  styleUrl: './product-management.scss'
})
export class ProductManagement implements OnInit {
  private productService = inject(ProductService);
  private authService = inject(AuthService);

  // State
  products = signal<Product[]>([]);
  isLoading = signal(false);
  
  // Stats
  totalProducts = computed(() => this.products().length);
  totalStockValue = computed(() => 
    this.products().reduce((sum, p) => sum + (p.price * p.stock), 0)
  );
  lowStockCount = computed(() => 
    this.products().filter(p => p.stockStatus === StockStatus.LOW_STOCK).length
  );

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.productService.getProviderProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading provider products:', err);
        this.isLoading.set(false);
      }
    });
  }

  deleteProduct(id: string): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.delete(id).subscribe({
        next: () => {
          this.products.update(products => products.filter(p => p.id !== id));
        },
        error: (err) => console.error('Error deleting product:', err)
      });
    }
  }

  getStockStatusClass(status: StockStatus): string {
    switch (status) {
      case StockStatus.IN_STOCK: return 'bg-green-100 text-green-700';
      case StockStatus.LOW_STOCK: return 'bg-yellow-100 text-yellow-700';
      case StockStatus.OUT_OF_STOCK: return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}
