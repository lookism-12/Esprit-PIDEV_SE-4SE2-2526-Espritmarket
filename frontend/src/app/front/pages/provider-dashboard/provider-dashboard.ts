import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProviderService } from '../../core/provider.service';
import { ProductService } from '../../core/product.service';
import { ToastService } from '../../core/toast.service';
import { Product, ProductStatus } from '../../models/product';
import { environment } from '../../../../environment';

export interface ProviderOrder {
  id?: string; // Add this field
  orderId: string;
  cartItemId: string;
  clientName: string;
  clientEmail: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
  orderStatus: string;
  orderDate: Date;
}

export interface ProviderStats {
  pendingOrders: number;
  confirmedOrders: number;
  paidOrders: number;
  declinedOrders: number;
  totalOrders: number;
  totalRevenue: number;
}

@Component({
  selector: 'app-provider-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './provider-dashboard.html',
  styleUrl: './provider-dashboard.scss',
})
export class ProviderDashboard implements OnInit {
  private providerService = inject(ProviderService);
  private productService = inject(ProductService);
  private toastService = inject(ToastService);

  // State
  readonly orders = signal<ProviderOrder[]>([]);
  readonly stats = signal<ProviderStats | null>(null);
  readonly products = signal<Product[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedStatus = signal<string>('ALL');
  readonly searchText = signal<string>('');
  readonly activeTab = signal<'orders' | 'products'>('orders');

  // Product status enum for template
  readonly ProductStatus = ProductStatus;

  // Computed
  readonly filteredOrders = computed(() => {
    let filtered = this.orders();

    // Filter by status
    if (this.selectedStatus() !== 'ALL') {
      filtered = filtered.filter(order => order.orderStatus === this.selectedStatus());
    }

    // Filter by search
    const search = this.searchText().toLowerCase();
    if (search) {
      filtered = filtered.filter(order =>
        order.clientName.toLowerCase().includes(search) ||
        order.clientEmail.toLowerCase().includes(search) ||
        order.productName.toLowerCase().includes(search)
      );
    }

    return filtered;
  });

  readonly isEmpty = computed(() => this.filteredOrders().length === 0);

  readonly pendingCount = computed(() =>
    this.orders().filter(o => o.orderStatus === 'PENDING').length
  );

  readonly confirmedCount = computed(() =>
    this.orders().filter(o => o.orderStatus === 'CONFIRMED').length
  );

  readonly cancelledCount = computed(() =>
    this.orders().filter(o => o.orderStatus === 'DECLINED').length
  );

  readonly totalRevenue = computed(() => {
    return this.orders()
      .filter(o => o.orderStatus === 'PAID')
      .reduce((sum, order) => sum + (order.subTotal || 0), 0)
      .toFixed(2);
  });

  ngOnInit() {
    console.log('✅ Provider Dashboard initialized');
    this.loadOrders();
    this.loadStatistics();
    this.loadProducts();
  }

  loadProducts() {
    console.log('📦 Loading provider products...');
    // ✅ FIXED: Load only products for the authenticated provider's shop
    this.productService.getMyProducts().subscribe({
      next: (products) => {
        console.log('✅ Provider products loaded:', products.length, 'products');
        this.products.set(products);
      },
      error: (err) => {
        console.error('❌ Failed to load provider products:', err);
        this.toastService.error('Failed to load your products');
      }
    });
  }

  loadOrders() {
    console.log('📊 Loading provider orders...');
    this.isLoading.set(true);
    this.error.set(null);

    this.providerService.getProviderOrders().subscribe({
      next: (orders) => {
        console.log('✅ Orders loaded:', orders);
        this.orders.set(orders);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Failed to load orders:', err);
        this.error.set('Failed to load orders. Please try again.');
        this.toastService.error('Failed to load orders');
        this.isLoading.set(false);
      }
    });
  }

  loadStatistics() {
    console.log('📈 Loading statistics...');
    this.providerService.getStatistics().subscribe({
      next: (stats) => {
        console.log('✅ Statistics loaded:', stats);
        this.stats.set(stats);
      },
      error: (err) => {
        console.error('❌ Failed to load statistics:', err);
      }
    });
  }

  confirmOrder(order: ProviderOrder) {
    if (!confirm(`Confirm order from ${order.clientName}?`)) return;

    // Use the new product-specific endpoint if cartItemId is available
    const updateCall = order.cartItemId 
      ? this.providerService.updateProductStatus(order.orderId, order.cartItemId, 'CONFIRMED')
      : this.providerService.updateOrderStatus(order.orderId, 'CONFIRMED');

    updateCall.subscribe({
      next: () => {
        this.toastService.success('Order confirmed successfully');
        this.loadOrders();
        this.loadStatistics();
      },
      error: (err) => {
        console.error('Failed to confirm order:', err);
        if (err.status === 404) {
          this.toastService.error('Order not found');
        } else if (err.status === 403) {
          this.toastService.error('You are not authorized to update this order');
        } else {
          this.toastService.error('Failed to confirm order');
        }
      }
    });
  }

  cancelOrder(order: ProviderOrder) {
    if (!confirm(`Decline order from ${order.clientName}? Stock will be restored.`)) return;

    // Use the new product-specific endpoint if cartItemId is available
    const updateCall = order.cartItemId 
      ? this.providerService.updateProductStatus(order.orderId, order.cartItemId, 'DECLINED')
      : this.providerService.updateOrderStatus(order.orderId, 'DECLINED');

    updateCall.subscribe({
      next: () => {
        this.toastService.success('Order declined. Stock restored.');
        this.loadOrders();
        this.loadStatistics();
      },
      error: (err) => {
        console.error('Failed to decline order:', err);
        if (err.status === 404) {
          this.toastService.error('Order not found');
        } else if (err.status === 403) {
          this.toastService.error('You are not authorized to update this order');
        } else {
          this.toastService.error('Failed to decline order');
        }
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'badge-yellow';
      case 'CONFIRMED':
        return 'badge-green';
      case 'PAID':
        return 'badge-blue';
      case 'DECLINED':
      case 'CANCELLED':
        return 'badge-red';
      default:
        return 'badge-gray';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'PENDING':
        return '⏳';
      case 'CONFIRMED':
        return '✅';
      case 'PAID':
        return '💰';
      case 'DECLINED':
      case 'CANCELLED':
        return '❌';
      default:
        return '📦';
    }
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  }

  onFilterChange() {
    // Filters are automatically applied via computed signals
  }

  // ==================== PRODUCT MANAGEMENT ====================

  approveProduct(product: Product) {
    if (!confirm(`Approve product "${product.name}"?`)) return;

    this.productService.approveProduct(product.id).subscribe({
      next: () => {
        this.toastService.success('Product approved successfully');
        this.loadProducts();
      },
      error: (err) => {
        console.error('Failed to approve product:', err);
        this.toastService.error('Failed to approve product');
      }
    });
  }

  rejectProduct(product: Product) {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    this.productService.rejectProduct(product.id, reason).subscribe({
      next: () => {
        this.toastService.success('Product rejected');
        this.loadProducts();
      },
      error: (err) => {
        console.error('Failed to reject product:', err);
        this.toastService.error('Failed to reject product');
      }
    });
  }

  getProductStatusBadgeClass(status?: ProductStatus): string {
    switch (status) {
      case ProductStatus.PENDING:
        return 'badge-yellow';
      case ProductStatus.APPROVED:
        return 'badge-green';
      case ProductStatus.REJECTED:
        return 'badge-red';
      case ProductStatus.SUSPENDED:
        return 'badge-gray';
      default:
        return 'badge-gray';
    }
  }

  getProductStatusIcon(status?: ProductStatus): string {
    switch (status) {
      case ProductStatus.PENDING:
        return '⏳';
      case ProductStatus.APPROVED:
        return '✅';
      case ProductStatus.REJECTED:
        return '❌';
      case ProductStatus.SUSPENDED:
        return '⏸️';
      default:
        return '❓';
    }
  }

  /**
   * Get valid image URL with fallback
   */
  getValidImageUrl(imageUrl: string | undefined): string {
    if (!imageUrl) {
      return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop';
    }

    // Check if it's a valid URL
    try {
      new URL(imageUrl);
      return imageUrl;
    } catch {
      // If it's a relative path, make it absolute
      if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('uploads/')) {
        const backendHost = environment.apiUrl.replace('/api', '');
        return backendHost + (imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl);
      }
      
      // If it's an invalid URL, return fallback
      return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop';
    }
  }

  /**
   * Handle image load errors
   */
  onImageError(event: any): void {
    event.target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop';
  }
}
