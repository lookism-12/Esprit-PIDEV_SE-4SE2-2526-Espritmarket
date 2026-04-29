import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ProviderService } from '../../core/provider.service';
import { ProductService } from '../../core/product.service';
import { ServiceService, Service } from '../../../core/services/service.service';
import { ProviderCouponService, ProviderCoupon } from '../../core/provider-coupon.service';
import { AutoDiscountRuleService, AutoDiscountRuleRequest, AutoDiscountRuleResponse } from '../../core/auto-discount-rule.service';
import { EventPromotionService, EventPromotionRequest, EventPromotionResponse } from '../../core/event-promotion.service';
import { InvoiceService } from '../../core/invoice.service';
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
  private couponService = inject(ProviderCouponService);
  private autoDiscountRuleService = inject(AutoDiscountRuleService);
  private eventPromotionService = inject(EventPromotionService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private invoiceService = inject(InvoiceService);

  // State
  readonly orders = signal<ProviderOrder[]>([]);
  readonly stats = signal<ProviderStats | null>(null);
  readonly products = signal<Product[]>([]);
  readonly services = signal<Service[]>([]);
  readonly coupons = signal<ProviderCoupon[]>([]);
  readonly discountRules = signal<AutoDiscountRuleResponse[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedStatus = signal<string>('ALL');
  readonly searchText = signal<string>('');
  readonly activeTab = signal<'orders' | 'products' | 'services' | 'coupons' | 'discountRules' | 'eventPromotions' | 'returnedOrders'>('orders');
  readonly showCouponForm = signal(false);
  readonly editingCoupon = signal<ProviderCoupon | null>(null);
  readonly isSavingCoupon = signal(false);
  readonly showRuleForm = signal(false);
  readonly editingRule = signal<AutoDiscountRuleResponse | null>(null);
  readonly isSavingRule = signal(false);
  readonly eventPromotion = signal<EventPromotionResponse | null>(null);
  readonly isSavingEventPromotion = signal(false);
  readonly downloadingInvoiceId = signal<string | null>(null);
  readonly returnedOrders = signal<ProviderOrder[]>([]);
  readonly isLoadingReturned = signal(false);
  readonly restockingOrderId = signal<string | null>(null);

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

  readonly deliveredCount = computed(() =>
    this.orders().filter(o => o.orderStatus === 'DELIVERED').length
  );

  readonly cancelledCount = computed(() =>
    this.orders().filter(o => o.orderStatus === 'CANCELLED').length
  );

  // Legacy support: paidCount now maps to deliveredCount
  readonly paidCount = computed(() => this.deliveredCount());

  // Legacy support: outForDeliveryCount maps to confirmedCount
  readonly outForDeliveryCount = computed(() => this.confirmedCount());

  readonly returnedCount = computed(() =>
    this.orders().filter(o => o.orderStatus === 'RETURNED').length
  );

  readonly totalRevenue = computed(() => {
    // Calculate revenue from delivered orders (payment completed)
    return this.orders()
      .filter(o => o.orderStatus === 'DELIVERED')
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
    this.loadCoupons();
    this.loadDiscountRules();
    this.loadEventPromotion();
    this.loadReturnedOrders();
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

    this.providerService.updateOrderStatus(order.orderId, 'CONFIRMED').subscribe({
      next: () => {
        this.toastService.success('Order confirmed successfully');
        // ✅ CRITICAL: Reload orders to show updated status
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
    if (!confirm(`Cancel/Reject order from ${order.clientName}? Stock will be restored.`)) return;

    // Provider rejection = CANCELLED status
    this.providerService.updateOrderStatus(order.orderId, 'CANCELLED').subscribe({
      next: () => {
        this.toastService.success('Order cancelled. Stock restored.');
        // ✅ CRITICAL: Reload orders to show updated status
        this.loadOrders();
        this.loadStatistics();
      },
      error: (err) => {
        console.error('Failed to cancel order:', err);
        if (err.status === 404) {
          this.toastService.error('Order not found');
        } else if (err.status === 403) {
          this.toastService.error('You are not authorized to update this order');
        } else {
          this.toastService.error('Failed to cancel order');
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
      'CANCELLED': `Cancel order from ${order.clientName}? Stock will be restored.`
    };

    const message = statusMessages[newStatus] || `Change order status to ${newStatus}?`;
    
    if (!confirm(message)) return;

    this.providerService.updateOrderStatus(order.orderId, newStatus).subscribe({
      next: () => {
        this.toastService.success(`Order status changed to ${newStatus}`);
        // ✅ CRITICAL: Reload orders to show updated status
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
   * Get available status transitions for an order based on backend validation rules.
   * 
   * NEW WORKFLOW (Simplified):
   * - Orders are auto-CONFIRMED on creation
   * - Provider can only CANCEL orders
   * - Delivery marks orders as DELIVERED
   * 
   * PROVIDER TRANSITIONS (actor: PROVIDER):
   * - CONFIRMED → CANCELLED (cancel order)
   * 
   * Providers CANNOT:
   * - Change DELIVERED orders (final state)
   * - Change CANCELLED orders (final state)
   * - Use PAID status (that's PaymentStatus, not OrderStatus)
   */
  getAvailableStatuses(currentStatus: string): string[] {
    switch (currentStatus) {
      case 'PENDING':
        // Legacy support: PENDING can be confirmed or cancelled
        return ['CONFIRMED', 'CANCELLED'];
      case 'CONFIRMED':
        // Provider can only cancel confirmed orders
        return ['CANCELLED'];
      case 'DELIVERED':
      case 'CANCELLED':
        // Final states - no transitions allowed
        return [];
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
      case 'DELIVERED':
        return 'badge-blue';
      case 'CANCELLED':
        return 'badge-red';
      // Legacy status support (will be auto-migrated by backend)
      case 'PAID':
      case 'ACCEPTED':
      case 'PROCESSING':
        return 'badge-green';
      case 'DECLINED':
        return 'badge-red';
      case 'OUT_FOR_DELIVERY':
      case 'SHIPPED':
        return 'badge-blue';
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
      case 'DELIVERED':
        return '📦';
      case 'CANCELLED':
        return '❌';
      // Legacy status support
      case 'PAID':
      case 'ACCEPTED':
      case 'PROCESSING':
        return '✅';
      case 'DECLINED':
        return '❌';
      case 'OUT_FOR_DELIVERY':
      case 'SHIPPED':
        return '🚚';
      default:
        return '📋';
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

  // ==================== COUPON MANAGEMENT ====================

  loadCoupons() {
    console.log('🎟️ Loading provider coupons...');
    
    this.couponService.getMyCoupons().subscribe({
      next: (coupons) => {
        console.log('✅ Provider coupons loaded:', coupons.length);
        this.coupons.set(coupons);
      },
      error: (err) => {
        console.error('❌ Failed to load provider coupons:', err);
        // Set empty array on error (backend might not be implemented yet)
        this.coupons.set([]);
      }
    });
  }

  getEmptyCoupon(): ProviderCoupon {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    return {
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: 0,
      validFrom: today,
      validUntil: nextMonth,
      isActive: true,
      scope: 'SHOP_SPECIFIC'
    };
  }

  newCoupon = this.getEmptyCoupon();

  openCouponForm() {
    this.showCouponForm.set(true);
    this.editingCoupon.set(null);
    this.newCoupon = this.getEmptyCoupon();
  }

  editCoupon(coupon: ProviderCoupon) {
    this.editingCoupon.set(coupon);
    this.newCoupon = { ...coupon };
    this.showCouponForm.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelCouponForm() {
    this.showCouponForm.set(false);
    this.editingCoupon.set(null);
    this.newCoupon = this.getEmptyCoupon();
  }

  isCouponFormValid(): boolean {
    return !!(
      this.newCoupon.code &&
      this.newCoupon.code.length >= 3 &&
      this.newCoupon.discountValue > 0 &&
      this.newCoupon.validFrom &&
      this.newCoupon.validUntil &&
      new Date(this.newCoupon.validUntil) > new Date(this.newCoupon.validFrom)
    );
  }

  saveCoupon() {
    if (!this.isCouponFormValid()) {
      this.toastService.error('Please fill in all required fields correctly');
      return;
    }

    this.isSavingCoupon.set(true);
    
    const request$ = this.editingCoupon() 
      ? this.couponService.updateCoupon(this.editingCoupon()!.id!, this.newCoupon)
      : this.couponService.createCoupon(this.newCoupon);

    request$.subscribe({
      next: () => {
        this.isSavingCoupon.set(false);
        this.toastService.success(`Coupon ${this.editingCoupon() ? 'updated' : 'created'} successfully!`);
        this.loadCoupons();
        this.cancelCouponForm();
      },
      error: (error) => {
        this.isSavingCoupon.set(false);
        console.error('Failed to save coupon:', error);
        
        if (error.status === 409) {
          this.toastService.error('A coupon with this code already exists in your shop');
        } else if (error.status === 400) {
          this.toastService.error('Invalid coupon data. Please check your inputs');
        } else {
          this.toastService.error('Failed to save coupon. Please try again');
        }
      }
    });
  }

  toggleCouponStatus(coupon: ProviderCoupon) {
    const newStatus = !coupon.isActive;
    
    this.couponService.toggleStatus(coupon.id!, newStatus).subscribe({
      next: () => {
        this.toastService.success(`Coupon ${newStatus ? 'activated' : 'deactivated'} successfully!`);
        this.loadCoupons();
      },
      error: () => {
        this.toastService.error('Failed to update coupon status');
      }
    });
  }

  deleteCoupon(coupon: ProviderCoupon) {
    if (!confirm(`Are you sure you want to delete coupon "${coupon.code}"? This action cannot be undone.`)) {
      return;
    }
    
    this.couponService.deleteCoupon(coupon.id!).subscribe({
      next: () => {
        this.toastService.success('Coupon deleted successfully!');
        this.loadCoupons();
      },
      error: () => {
        this.toastService.error('Failed to delete coupon');
      }
    });
  }

  getCouponUsagePercentage(coupon: ProviderCoupon): number {
    if (!coupon.usageLimit) return 0;
    return Math.min(100, ((coupon.usageCount || 0) / coupon.usageLimit) * 100);
  }

  isCouponExpired(coupon: ProviderCoupon): boolean {
    return new Date(coupon.validUntil) < new Date();
  }

  isCouponExpiringSoon(coupon: ProviderCoupon): boolean {
    const daysUntilExpiry = Math.ceil(
      (new Date(coupon.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  }

  getCouponStatusBadgeClass(coupon: ProviderCoupon): string {
    if (this.isCouponExpired(coupon)) {
      return 'badge-red';
    } else if (coupon.isActive) {
      return 'badge-green';
    } else {
      return 'badge-gray';
    }
  }

  getCouponStatusText(coupon: ProviderCoupon): string {
    if (this.isCouponExpired(coupon)) {
      return '⏰ Expired';
    } else if (coupon.isActive) {
      return '✅ Active';
    } else {
      return '⏸️ Inactive';
    }
  }

  // ==================== AUTO DISCOUNT RULES MANAGEMENT ====================

  loadDiscountRules() {
    console.log('⚡ Loading auto discount rules...');
    
    this.autoDiscountRuleService.getMyRules().subscribe({
      next: (rules) => {
        console.log('✅ Auto discount rules loaded:', rules.length);
        this.discountRules.set(rules);
      },
      error: (err) => {
        console.error('❌ Failed to load auto discount rules:', err);
        this.discountRules.set([]);
      }
    });
  }

  getEmptyRule(): AutoDiscountRuleRequest {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    return {
      ruleName: '',
      triggerType: 'CART_TOTAL_THRESHOLD',
      thresholdValue: 0,
      discountType: 'PERCENTAGE',
      discountValue: 0,
      priority: 0,
      isActive: true,
      validFrom: today,
      validUntil: nextMonth
    };
  }

  newRule = this.getEmptyRule();

  openRuleForm() {
    this.showRuleForm.set(true);
    this.editingRule.set(null);
    this.newRule = this.getEmptyRule();
  }

  editRule(rule: AutoDiscountRuleResponse) {
    this.editingRule.set(rule);
    this.newRule = {
      ruleName: rule.ruleName,
      triggerType: rule.triggerType,
      thresholdValue: rule.thresholdValue,
      discountType: rule.discountType,
      discountValue: rule.discountValue,
      maximumDiscount: rule.maximumDiscount,
      priority: rule.priority,
      isActive: rule.isActive,
      validFrom: rule.validFrom,
      validUntil: rule.validUntil,
      description: rule.description
    };
    this.showRuleForm.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelRuleForm() {
    this.showRuleForm.set(false);
    this.editingRule.set(null);
    this.newRule = this.getEmptyRule();
  }

  isRuleFormValid(): boolean {
    return !!(
      this.newRule.ruleName &&
      this.newRule.ruleName.length >= 3 &&
      this.newRule.thresholdValue > 0 &&
      this.newRule.discountValue > 0 &&
      this.newRule.validFrom &&
      this.newRule.validUntil &&
      new Date(this.newRule.validUntil) > new Date(this.newRule.validFrom)
    );
  }

  saveRule() {
    if (!this.isRuleFormValid()) {
      this.toastService.error('Please fill in all required fields correctly');
      return;
    }

    this.isSavingRule.set(true);
    
    const request$ = this.editingRule() 
      ? this.autoDiscountRuleService.updateRule(this.editingRule()!.id, this.newRule)
      : this.autoDiscountRuleService.createRule(this.newRule);

    request$.subscribe({
      next: () => {
        this.isSavingRule.set(false);
        this.toastService.success(`Rule ${this.editingRule() ? 'updated' : 'created'} successfully!`);
        this.loadDiscountRules();
        this.cancelRuleForm();
      },
      error: (error) => {
        this.isSavingRule.set(false);
        console.error('Failed to save rule:', error);
        
        if (error.status === 409) {
          this.toastService.error('A rule with this name already exists in your shop');
        } else if (error.status === 400) {
          this.toastService.error('Invalid rule data. Please check your inputs');
        } else {
          this.toastService.error('Failed to save rule. Please try again');
        }
      }
    });
  }

  toggleRuleStatus(rule: AutoDiscountRuleResponse) {
    const newStatus = !rule.isActive;
    
    this.autoDiscountRuleService.toggleRuleStatus(rule.id, newStatus).subscribe({
      next: () => {
        this.toastService.success(`Rule ${newStatus ? 'activated' : 'deactivated'} successfully!`);
        this.loadDiscountRules();
      },
      error: () => {
        this.toastService.error('Failed to update rule status');
      }
    });
  }

  deleteRule(rule: AutoDiscountRuleResponse) {
    if (!confirm(`Are you sure you want to delete rule "${rule.ruleName}"? This action cannot be undone.`)) {
      return;
    }
    
    this.autoDiscountRuleService.deleteRule(rule.id).subscribe({
      next: () => {
        this.toastService.success('Rule deleted successfully!');
        this.loadDiscountRules();
      },
      error: () => {
        this.toastService.error('Failed to delete rule');
      }
    });
  }

  isRuleExpired(rule: AutoDiscountRuleResponse): boolean {
    return rule.validUntil ? new Date(rule.validUntil) < new Date() : false;
  }

  isRuleExpiringSoon(rule: AutoDiscountRuleResponse): boolean {
    if (!rule.validUntil) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(rule.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  }

  getRuleStatusBadgeClass(rule: AutoDiscountRuleResponse): string {
    if (this.isRuleExpired(rule)) {
      return 'badge-red';
    } else if (rule.isActive && rule.isCurrentlyValid) {
      return 'badge-green';
    } else {
      return 'badge-gray';
    }
  }

  getRuleStatusText(rule: AutoDiscountRuleResponse): string {
    if (this.isRuleExpired(rule)) {
      return '⏰ Expired';
    } else if (rule.isActive && rule.isCurrentlyValid) {
      return '✅ Active';
    } else if (rule.isActive) {
      return '⏳ Scheduled';
    } else {
      return '⏸️ Inactive';
    }
  }

  getTriggerTypeLabel(triggerType: string): string {
    switch (triggerType) {
      case 'CART_TOTAL_THRESHOLD':
        return 'Cart Total';
      case 'QUANTITY_THRESHOLD':
        return 'Quantity';
      case 'GROUPED_PRODUCT_OFFER':
        return 'Grouped Products';
      default:
        return triggerType;
    }
  }

  // ==================== EVENT PROMOTIONS ====================

  loadEventPromotion() {
    this.eventPromotionService.getEventPromotion().subscribe({
      next: (response) => {
        this.eventPromotion.set(response);
      },
      error: (err) => {
        console.error('Error loading event promotion:', err);
        // Initialize with default values if not found
        this.eventPromotion.set({
          providerId: '',
          holidayEnabled: false,
          holidayDescription: 'Not configured',
          birthdayEnabled: false,
          birthdayDescription: 'Not configured'
        });
      }
    });
  }

  saveEventPromotion(formData: EventPromotionRequest) {
    this.isSavingEventPromotion.set(true);

    this.eventPromotionService.configureEventPromotion(formData).subscribe({
      next: (response) => {
        this.eventPromotion.set(response);
        this.isSavingEventPromotion.set(false);
        this.toastService.success('Event promotions configured successfully');
      },
      error: (err) => {
        this.isSavingEventPromotion.set(false);
        this.toastService.error('Failed to configure event promotions');
        console.error('Error saving event promotion:', err);
      }
    });
  }

  // ==================== RETURNED ORDERS MANAGEMENT ====================

  /**
   * Load returned orders waiting for provider verification
   */
  loadReturnedOrders() {
    console.log('🔄 Loading returned orders...');
    this.isLoadingReturned.set(true);
    
    this.providerService.getReturnedOrders().subscribe({
      next: (orders) => {
        console.log('✅ Returned orders loaded:', orders.length);
        this.returnedOrders.set(orders);
        this.isLoadingReturned.set(false);
      },
      error: (err) => {
        console.error('❌ Failed to load returned orders:', err);
        this.returnedOrders.set([]);
        this.isLoadingReturned.set(false);
        // Don't show error toast - backend might not be implemented yet
      }
    });
  }

  /**
   * Provider confirms physical verification and restocking of returned order
   */
  restockOrder(order: ProviderOrder) {
    if (!confirm(`Confirm that you have physically received the returned items for order ${order.productName}?\n\nThis will restore the stock and mark the order as RESTOCKED.`)) {
      return;
    }

    this.restockingOrderId.set(order.orderId);

    this.providerService.restockOrder(order.orderId).subscribe({
      next: () => {
        this.toastService.success('Order restocked successfully! Stock has been restored.');
        // Reload both returned orders and main orders
        this.loadReturnedOrders();
        this.loadOrders();
        this.loadStatistics();
        this.restockingOrderId.set(null);
      },
      error: (err) => {
        console.error('Failed to restock order:', err);
        this.restockingOrderId.set(null);
        
        const msg = err.error?.message || err.message || '';
        if (err.status === 400 || err.status === 500) {
          if (msg.includes('already RESTOCKED')) {
            this.toastService.error('This order has already been restocked.');
          } else if (msg.includes('DELIVERED')) {
            this.toastService.error('This order was delivered successfully — cannot restock.');
          } else if (msg.includes('CANCELLED')) {
            this.toastService.error('This order is cancelled — cannot restock.');
          } else {
            this.toastService.error('Cannot restock this order: ' + (msg || 'Unknown error'));
          }
        } else if (err.status === 404) {
          this.toastService.error('Order not found');
        } else if (err.status === 403) {
          this.toastService.error('You are not authorized to restock this order');
        } else {
          this.toastService.error('Failed to restock order. Please try again.');
        }
      }
    });
  }

  /**
   * Check if order is currently being restocked
   */
  isRestocking(orderId: string): boolean {
    return this.restockingOrderId() === orderId;
  }

  // ==================== TRACKBY FUNCTIONS ====================
  
  /**
   * TrackBy function for orders to prevent NG0955 duplicate key errors
   */
  trackByOrderId(index: number, order: ProviderOrder): string {
    return (order.id || order.orderId) + '_' + index;
  }

  /**
   * TrackBy function for products
   */
  trackByProductId(index: number, product: Product): string {
    return product.id + '_' + index;
  }

  /**
   * TrackBy function for services
   */
  trackByServiceId(index: number, service: Service): string {
    return service.id + '_' + index;
  }

  /**
   * TrackBy function for coupons
   */
  trackByCouponId(index: number, coupon: ProviderCoupon): string {
    return coupon.id + '_' + index;
  }

  /**
   * TrackBy function for discount rules
   */
  trackByRuleId(index: number, rule: AutoDiscountRuleResponse): string {
    return rule.id + '_' + index;
  }

  /**
   * TrackBy function for status options
   */
  trackByStatus(index: number, status: string): string {
    return status + '_' + index;
  }

  // ==================== INVOICE DOWNLOAD ====================

  /**
   * Download invoice PDF for a PAID order
   */
  downloadInvoice(order: ProviderOrder) {
    if (order.orderStatus !== 'PAID') {
      this.toastService.error('Invoice can only be downloaded for paid orders');
      return;
    }

    this.downloadingInvoiceId.set(order.orderId);

    this.invoiceService.downloadInvoice(order.orderId).subscribe({
      next: (blob) => {
        this.invoiceService.triggerDownload(blob, `invoice-${order.orderId}.pdf`);
        this.toastService.success('Invoice downloaded successfully!');
        this.downloadingInvoiceId.set(null);
      },
      error: (err) => {
        console.error('Failed to download invoice:', err);
        if (err.status === 403) {
          this.toastService.error('You do not have permission to download this invoice');
        } else if (err.status === 404) {
          this.toastService.error('Order not found');
        } else {
          this.toastService.error('Failed to download invoice. Please try again.');
        }
        this.downloadingInvoiceId.set(null);
      }
    });
  }

  /**
   * Check if invoice is currently being downloaded
   */
  isDownloadingInvoice(orderId: string): boolean {
    return this.downloadingInvoiceId() === orderId;
  }
}

