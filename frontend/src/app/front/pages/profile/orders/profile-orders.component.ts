import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../core/order.service';
import { AuthService } from '../../../core/auth.service';
import { OrderResponse, OrderStatus } from '../../../models/order.model';

@Component({
  selector: 'app-profile-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="rounded-2xl p-6" style="background-color:var(--card-bg);border:1px solid var(--border)">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-xl font-black" style="color:var(--text-color)">🛍️ My Orders</h2>
        <span class="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
          {{ orders().length }} orders
        </span>
      </div>

      @if (isLoading()) {
        <div class="text-center py-12" style="color:var(--muted)">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading orders...</p>
        </div>
      } @else if (orders().length === 0) {
        <div class="text-center py-12" style="color:var(--muted)">
          <p class="text-4xl mb-3">📦</p>
          <p class="font-semibold">No orders yet</p>
          <p class="text-sm mt-1">Start shopping to see your orders here</p>
          <a routerLink="/products" class="inline-block mt-4 px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all">
            Browse Products
          </a>
        </div>
      } @else {
        <div class="space-y-3">
          @for (order of orders(); track order.id) {
            <div class="rounded-xl p-4 transition-all hover:shadow-md" style="background-color:var(--subtle);border:1px solid var(--border)">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-black text-sm" style="color:var(--text-color)">{{ order.orderNumber }}</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" [ngClass]="getStatusClass(order.status)">
                      {{ order.status }}
                    </span>
                    @if (order.paymentStatus) {
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold" 
                            [ngClass]="order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'">
                        💳 {{ order.paymentStatus }}
                      </span>
                    }
                  </div>
                  <p class="text-xs" style="color:var(--muted)">{{ formatDate(order.createdAt) }}</p>
                  @if (order.status === 'PENDING') {
                    <p class="text-xs mt-1" style="color:var(--muted)">
                      {{ getOrderAgeMessage(order.createdAt) }}
                    </p>
                  }
                </div>
                <div class="flex items-center gap-3">
                  <div class="text-right">
                    <p class="text-xs font-semibold" style="color:var(--muted)">Total</p>
                    <p class="text-lg font-black text-primary">\${{ order.finalAmount.toFixed(2) }}</p>
                  </div>
                  @if ((order.status === 'PENDING' || order.status === 'CONFIRMED') && canCancelOrder(order.id)) {
                    <button (click)="cancelOrder(order.id)" 
                      class="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all">
                      ✗ Cancel
                    </button>
                  } @else if ((order.status === 'PENDING' || order.status === 'CONFIRMED') && !canCancelOrder(order.id)) {
                    <span class="px-3 py-1.5 bg-gray-300 text-gray-600 text-xs font-bold rounded-lg cursor-not-allowed">
                      ⏰ Cannot Cancel
                    </span>
                  }
                </div>
              </div>

              <!-- Order Items -->
              <div class="space-y-2 mt-3 pt-3" style="border-top:1px solid var(--border)">
                @for (item of order.items; track item.id) {
                  <div class="flex items-center justify-between text-sm">
                    <div class="flex-1">
                      <p class="font-semibold" style="color:var(--text-color)">{{ item.productName }}</p>
                      <p class="text-xs" style="color:var(--muted)">Qty: {{ item.quantity }} × \${{ item.productPrice.toFixed(2) }}</p>
                    </div>
                    <p class="font-bold" style="color:var(--text-color)">\${{ item.subtotal.toFixed(2) }}</p>
                  </div>
                }
              </div>

              <!-- Shipping Address -->
              @if (order.shippingAddress) {
                <div class="mt-3 pt-3 text-xs" style="border-top:1px solid var(--border);color:var(--muted)">
                  <span class="font-semibold">📍 Shipping:</span> {{ order.shippingAddress }}
                </div>
              }

              @if (order.deliveryConfirmationCode && order.deliveryStatus !== 'DELIVERED' && order.deliveryStatus !== 'RETURNED') {
                <div class="mt-3 pt-3 rounded-xl px-4 py-3 bg-green-50 border border-green-100">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p class="text-xs font-black uppercase tracking-widest text-green-700">Secure delivery code</p>
                      <p class="text-xs text-green-700/80 mt-1">Give this code only when the package is in your hands.</p>
                    </div>
                    <div class="px-4 py-2 bg-white border border-green-200 rounded-xl text-2xl font-black tracking-[0.28em] text-green-800">
                      {{ order.deliveryConfirmationCode }}
                    </div>
                  </div>
                </div>
              }

              <!-- Order Status Info -->
              @if (order.status === 'PENDING') {
                <div class="mt-3 pt-3 text-xs" style="border-top:1px solid var(--border);color:var(--muted)">
                  <p class="font-semibold">ℹ️ Order Status:</p>
                  <p>Your order is waiting for provider confirmation. You can cancel within 7 days of placing the order.</p>
                </div>
              } @else if (order.status === 'CONFIRMED') {
                <div class="mt-3 pt-3 text-xs" style="border-top:1px solid var(--border);color:var(--muted)">
                  <p class="font-semibold">✅ Order Confirmed:</p>
                  <p>Your order has been confirmed by the provider and is ready for delivery.</p>
                </div>
              } @else if (order.status === 'DELIVERED') {
                <div class="mt-3 pt-3 text-xs" style="border-top:1px solid var(--border);color:var(--muted)">
                  <p class="font-semibold">📦 Delivered:</p>
                  <p>Your order has been successfully delivered. Thank you for your purchase!</p>
                </div>
              } @else if (order.status === 'CANCELLED') {
                <div class="mt-3 pt-3 text-xs" style="border-top:1px solid var(--border);color:var(--muted)">
                  <p class="font-semibold">❌ Order Cancelled:</p>
                  <p>{{ order.cancellationReason || 'This order has been cancelled.' }}</p>
                </div>
              }
            </div>
          }
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="flex items-center justify-center gap-2 mt-6 pt-4" style="border-top:1px solid var(--border)">
            <button 
              (click)="previousPage()" 
              [disabled]="currentPage() === 0"
              class="px-4 py-2 rounded-lg font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              [ngClass]="currentPage() === 0 ? 'bg-gray-200 text-gray-500' : 'bg-primary text-white hover:bg-primary-dark'">
              ← Previous
            </button>

            <div class="flex items-center gap-1">
              @for (pageNum of getPageNumbers(); track pageNum) {
                <button 
                  (click)="goToPage(pageNum)"
                  class="w-10 h-10 rounded-lg font-bold text-sm transition-all"
                  [ngClass]="currentPage() === pageNum ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                  style="color:var(--text-color)">
                  {{ pageNum + 1 }}
                </button>
              }
            </div>

            <button 
              (click)="nextPage()" 
              [disabled]="currentPage() === totalPages() - 1"
              class="px-4 py-2 rounded-lg font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              [ngClass]="currentPage() === totalPages() - 1 ? 'bg-gray-200 text-gray-500' : 'bg-primary text-white hover:bg-primary-dark'">
              Next →
            </button>
          </div>

          <div class="text-center mt-3">
            <p class="text-xs" style="color:var(--muted)">
              Page {{ currentPage() + 1 }} of {{ totalPages() }} • Showing {{ orders().length }} of {{ totalElements() }} orders
            </p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ProfileOrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private authService = inject(AuthService);

  orders = signal<OrderResponse[]>([]);
  isLoading = signal(false);
  cancelPermissions = signal<Map<string, boolean>>(new Map());
  
  // Pagination state
  currentPage = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  pageSize = signal(5);

  ngOnInit(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    this.isLoading.set(true);
    this.orderService.getMyOrdersPaginated(this.currentPage(), this.pageSize()).subscribe({
      next: (response) => {
        this.orders.set(response.content);
        this.totalPages.set(response.totalPages);
        this.totalElements.set(response.totalElements);
        this.currentPage.set(response.number);
        this.loadCancelPermissions(response.content);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load orders:', error);
        this.isLoading.set(false);
      }
    });
  }

  private loadCancelPermissions(orders: OrderResponse[]): void {
    const pendingOrders = orders.filter(o => o.status === 'PENDING');
    const permissions = new Map<string, boolean>();
    
    if (pendingOrders.length === 0) {
      this.cancelPermissions.set(permissions);
      return;
    }
    
    let loadedCount = 0;
    
    // Load cancel permissions for all pending orders
    pendingOrders.forEach(order => {
      this.orderService.canClientCancelOrder(order.id).subscribe({
        next: (canCancel) => {
          permissions.set(order.id, canCancel);
          loadedCount++;
          
          // Update signal when all permissions are loaded
          if (loadedCount === pendingOrders.length) {
            this.cancelPermissions.set(new Map(permissions));
          }
        },
        error: (error) => {
          console.error(`Failed to check cancel permission for order ${order.id}:`, error);
          permissions.set(order.id, false);
          loadedCount++;
          
          // Update signal when all permissions are loaded
          if (loadedCount === pendingOrders.length) {
            this.cancelPermissions.set(new Map(permissions));
          }
        }
      });
    });
  }

  canCancelOrder(orderId: string): boolean {
    const canCancel = this.cancelPermissions().get(orderId) || false;
    console.log(`🔍 Can cancel order ${orderId}:`, canCancel);
    return canCancel;
  }

  cancelOrder(orderId: string): void {
    const order = this.orders().find(o => o.id === orderId);
    if (!order) {
      alert('Order not found');
      return;
    }
    
    // Check if order can be cancelled
    if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
      alert(`Cannot cancel order with status: ${order.status}. Only PENDING or CONFIRMED orders can be cancelled.`);
      return;
    }
    
    if (!this.canCancelOrder(orderId)) {
      alert('This order cannot be cancelled. Orders can only be cancelled within 7 days of placement.');
      return;
    }
    
    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason || reason.trim() === '') {
      return;
    }
    
    if (!confirm(`Cancel order ${order.orderNumber}?\n\nThis will:\n• Set order status to DECLINED\n• Restore product stock\n\nThis action cannot be undone.`)) {
      return;
    }
    
    this.orderService.declineOrder(orderId, reason).subscribe({
      next: (refundSummary) => {
        console.log('✅ Order cancelled:', refundSummary);
        // Refresh orders list
        this.loadOrders();
        alert(`Order cancelled successfully!\n\nOrder: ${order.orderNumber}\nStock has been restored.`);
      },
      error: (error) => {
        console.error('❌ Failed to cancel order:', error);
        const errorMsg = error.error?.message || 'Failed to cancel order. Please try again.';
        alert(`Error: ${errorMsg}`);
      }
    });
  }

  getStatusClass(status: string): string {
    const statusClasses: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CONFIRMED': 'bg-blue-100 text-blue-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'DELIVERED': 'bg-green-100 text-green-800',
      'RETURNED': 'bg-red-100 text-red-800',
      'RESTOCKED': 'bg-slate-100 text-slate-700'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-700';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  getOrderAgeMessage(createdAt: string): string {
    const orderDate = new Date(createdAt);
    const now = new Date();
    const diffTime = now.getTime() - orderDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const remainingDays = 7 - diffDays;
    
    if (remainingDays > 0) {
      return `Can cancel for ${remainingDays} more day${remainingDays === 1 ? '' : 's'}`;
    } else {
      return 'Cancellation period expired';
    }
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadOrders();
      this.scrollToTop();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    // Show max 5 page numbers
    let start = Math.max(0, current - 2);
    let end = Math.min(total, start + 5);
    
    // Adjust start if we're near the end
    if (end - start < 5) {
      start = Math.max(0, end - 5);
    }
    
    for (let i = start; i < end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
