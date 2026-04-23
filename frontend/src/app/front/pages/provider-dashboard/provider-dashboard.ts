import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ProviderService } from '../../core/provider.service';
import { ProductService } from '../../core/product.service';
import { ServiceService, Service } from '../../../core/services/service.service';
import { ToastService } from '../../core/toast.service';
import { Product, ProductStatus } from '../../models/product';
import { environment } from '../../../../environment';

export interface ProviderOrder {
  id?: string; // Add this field
  orderId: string;
  cartItemId: string;
  clientName: string;
  clientEmail: string;
  clientAvatar?: string;  // ✅ Added avatar
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
  private serviceService = inject(ServiceService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // State
  readonly orders = signal<ProviderOrder[]>([]);
  readonly stats = signal<ProviderStats | null>(null);
  readonly products = signal<Product[]>([]);
  readonly services = signal<Service[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedStatus = signal<string>('ALL');
  readonly searchText = signal<string>('');
  readonly activeTab = signal<'orders' | 'products' | 'services'>('orders');

  // Product status enum for template
  readonly ProductStatus = ProductStatus;

  constructor() {
    console.log('========================================');
    console.log('🏗️ ProviderDashboard constructor called');
    console.log('========================================');
  }

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
    console.log('========================================');
    console.log('✅ Provider Dashboard ngOnInit() called');
    console.log('📍 Current URL:', window.location.href);
    console.log('🔐 Checking authentication...');
    console.log('========================================');
    
    this.loadOrders();
    this.loadStatistics();
    this.loadProducts();
    this.loadServices();
  }

  loadProducts() {
    console.log('========================================');
    console.log('📦 loadProducts() called');
    console.log('📍 API URL:', `${environment.apiUrl}/products/my-products`);
    console.log('========================================');
    
    // ✅ FIXED: Load only products for the authenticated provider's shop
    this.productService.getMyProducts().subscribe({
      next: (products) => {
        console.log('========================================');
        console.log('✅ Provider products loaded successfully');
        console.log('📊 Products count:', products.length);
        console.log('📦 Products:', products);
        console.log('========================================');
        this.products.set(products);
      },
      error: (err) => {
        console.log('========================================');
        console.error('❌ Failed to load provider products');
        console.error('🔍 Error status:', err.status);
        console.error('🔍 Error message:', err.message);
        console.error('🔍 Full error:', err);
        console.log('========================================');
        this.toastService.error('Failed to load your products');
      }
    });
  }

  loadServices() {
    console.log('🔧 Loading provider services...');
    
    this.serviceService.getMyServices().subscribe({
      next: (services) => {
        console.log('✅ Provider services loaded:', services.length);
        this.services.set(services);
      },
      error: (err) => {
        console.error('❌ Failed to load provider services:', err);
        this.toastService.error('Failed to load your services');
      }
    });
  }

  editService(service: Service) {
    this.router.navigate(['/edit-service', service.id]);
  }

  deleteService(service: Service) {
    if (confirm(`Are you sure you want to delete "${service.name}"?`)) {
      this.serviceService.delete(service.id).subscribe({
        next: () => {
          this.toastService.success('Service deleted successfully');
          this.loadServices();
        },
        error: (err) => {
          console.error('❌ Failed to delete service:', err);
          this.toastService.error('Failed to delete service');
        }
      });
    }
  }

  getServiceStatusBadgeClass(status: string): string {
    switch (status) {
      case 'APPROVED':
      case 'AVAILABLE':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'PARTIALLY_BOOKED':
        return 'bg-blue-100 text-blue-700';
      case 'FULLY_BOOKED':
        return 'bg-purple-100 text-purple-700';
      case 'REJECTED':
      case 'UNAVAILABLE':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  getServiceStatusIcon(status: string): string {
    switch (status) {
      case 'APPROVED':
      case 'AVAILABLE':
        return '✅';
      case 'PENDING':
        return '⏳';
      case 'PARTIALLY_BOOKED':
        return '📅';
      case 'FULLY_BOOKED':
        return '🔒';
      case 'REJECTED':
      case 'UNAVAILABLE':
        return '❌';
      default:
        return '❓';
    }
  }

  loadOrders() {
    console.log('========================================');
    console.log('📊 loadOrders() called');
    console.log('📍 API URL:', `${environment.apiUrl}/provider/dashboard/orders`);
    console.log('🔄 Setting isLoading to true');
    console.log('========================================');
    
    this.isLoading.set(true);
    this.error.set(null);

    this.providerService.getProviderOrders().subscribe({
      next: (orders) => {
        console.log('========================================');
        console.log('✅ Orders loaded successfully');
        console.log('📊 Orders count:', orders.length);
        console.log('📦 Orders:', orders);
        console.log('========================================');
        this.orders.set(orders);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.log('========================================');
        console.error('❌ Failed to load orders');
        console.error('🔍 Error status:', err.status);
        console.error('🔍 Error message:', err.message);
        console.error('🔍 Full error:', err);
        console.log('========================================');
        this.error.set('Failed to load orders. Please try again.');
        this.toastService.error('Failed to load orders');
        this.isLoading.set(false);
      }
    });
  }

  loadStatistics() {
    console.log('========================================');
    console.log('📈 loadStatistics() called');
    console.log('📍 API URL:', `${environment.apiUrl}/provider/dashboard/statistics`);
    console.log('========================================');
    
    this.providerService.getStatistics().subscribe({
      next: (stats) => {
        console.log('========================================');
        console.log('✅ Statistics loaded successfully');
        console.log('📊 Stats:', stats);
        console.log('========================================');
        this.stats.set(stats);
      },
      error: (err) => {
        console.log('========================================');
        console.error('❌ Failed to load statistics');
        console.error('🔍 Error status:', err.status);
        console.error('🔍 Error message:', err.message);
        console.error('🔍 Full error:', err);
        console.log('========================================');
      }
    });
  }

  confirmOrder(order: ProviderOrder) {
    if (!confirm(`Confirm order from ${order.clientName}?`)) return;

    // ✅ CRITICAL FIX: Always use the correct orders endpoint (removed deprecated conditional logic)
    this.providerService.updateOrderStatus(order.orderId, 'CONFIRMED').subscribe({
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

    // ✅ CRITICAL FIX: Always use the correct orders endpoint (removed deprecated conditional logic)
    this.providerService.updateOrderStatus(order.orderId, 'DECLINED').subscribe({
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

  /**
   * Change order status (like real e-commerce)
   */
  changeOrderStatus(order: ProviderOrder, newStatus: string) {
    const statusMessages: Record<string, string> = {
      'CONFIRMED': `Confirm order from ${order.clientName}?`,
      'PAID': `Mark order as PAID? This will award loyalty points to the customer.`,
      'DECLINED': `Decline order from ${order.clientName}? Stock will be restored.`
    };

    const message = statusMessages[newStatus] || `Change order status to ${newStatus}?`;
    
    if (!confirm(message)) return;

    this.providerService.updateOrderStatus(order.orderId, newStatus).subscribe({
      next: () => {
        this.toastService.success(`Order status changed to ${newStatus}`);
        this.loadOrders();
        this.loadStatistics();
      },
      error: (err) => {
        console.error('Failed to change order status:', err);
        if (err.status === 404) {
          this.toastService.error('Order not found');
        } else if (err.status === 403) {
          this.toastService.error('You are not authorized to update this order');
        } else {
          this.toastService.error('Failed to change order status');
        }
      }
    });
  }

  /**
   * Get available status transitions for an order
   */
  getAvailableStatuses(currentStatus: string): string[] {
    switch (currentStatus) {
      case 'PENDING':
        return ['CONFIRMED', 'DECLINED'];
      case 'CONFIRMED':
        return ['PAID', 'DECLINED'];
      case 'PAID':
        return []; // No transitions from PAID
      case 'DECLINED':
        return []; // No transitions from DECLINED
      default:
        return [];
    }
  }

  /**
   * Get avatar URL with fallback
   */
  getClientAvatarUrl(avatarUrl: string | undefined): string {
    if (!avatarUrl) {
      return 'https://ui-avatars.com/api/?name=Client&background=6366f1&color=fff&size=128';
    }

    // Check if it's a valid URL
    try {
      new URL(avatarUrl);
      return avatarUrl;
    } catch {
      // If it's a relative path, make it absolute
      if (avatarUrl.startsWith('/uploads/') || avatarUrl.startsWith('uploads/')) {
        const backendHost = environment.apiUrl.replace('/api', '');
        return backendHost + (avatarUrl.startsWith('/') ? avatarUrl : '/' + avatarUrl);
      }
      
      // If it's an invalid URL, return fallback
      return 'https://ui-avatars.com/api/?name=Client&background=6366f1&color=fff&size=128';
    }
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
