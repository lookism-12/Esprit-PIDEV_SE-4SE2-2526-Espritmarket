import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class AdminOrdersComponent implements OnInit {
  private adminService = inject(AdminService);

  // State
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly activeTab = signal<'orders' | 'transactions' | 'coupons'>('orders');

  // Mock data for now - will be replaced with real API calls
  readonly orders = signal([
    {
      id: '1',
      orderNumber: 'ORD-2024-001',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      providerName: 'Tech Store',
      productName: 'Wireless Headphones',
      quantity: 2,
      unitPrice: 85.00,
      total: 170.00,
      status: 'PENDING',
      orderDate: new Date('2024-03-30'),
      paymentMethod: 'Credit Card'
    },
    {
      id: '2',
      orderNumber: 'ORD-2024-002',
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      providerName: 'Book Corner',
      productName: 'Programming Guide',
      quantity: 1,
      unitPrice: 45.00,
      total: 45.00,
      status: 'CONFIRMED',
      orderDate: new Date('2024-03-29'),
      paymentMethod: 'PayPal'
    },
    {
      id: '3',
      orderNumber: 'ORD-2024-003',
      customerName: 'Mike Johnson',
      customerEmail: 'mike@example.com',
      providerName: 'Fashion Hub',
      productName: 'Cotton T-Shirt',
      quantity: 3,
      unitPrice: 25.00,
      total: 75.00,
      status: 'CANCELLED',
      orderDate: new Date('2024-03-28'),
      paymentMethod: 'Credit Card'
    }
  ]);

  readonly transactions = signal([
    {
      id: '1',
      transactionId: 'TXN-2024-001',
      orderNumber: 'ORD-2024-001',
      amount: 170.00,
      type: 'PAYMENT',
      status: 'COMPLETED',
      paymentMethod: 'Credit Card',
      processingFee: 5.10,
      netAmount: 164.90,
      date: new Date('2024-03-30')
    },
    {
      id: '2',
      transactionId: 'TXN-2024-002',
      orderNumber: 'ORD-2024-002',
      amount: 45.00,
      type: 'PAYMENT',
      status: 'COMPLETED',
      paymentMethod: 'PayPal',
      processingFee: 1.35,
      netAmount: 43.65,
      date: new Date('2024-03-29')
    },
    {
      id: '3',
      transactionId: 'TXN-2024-003',
      orderNumber: 'ORD-2024-003',
      amount: 75.00,
      type: 'REFUND',
      status: 'PENDING',
      paymentMethod: 'Credit Card',
      processingFee: 0,
      netAmount: 75.00,
      date: new Date('2024-03-28')
    }
  ]);

  // Computed statistics
  readonly orderStats = computed(() => {
    const orders = this.orders();
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'PENDING').length,
      confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
      cancelled: orders.filter(o => o.status === 'CANCELLED').length,
      totalRevenue: orders
        .filter(o => o.status === 'CONFIRMED')
        .reduce((sum, o) => sum + o.total, 0)
    };
  });

  readonly transactionStats = computed(() => {
    const transactions = this.transactions();
    return {
      total: transactions.length,
      completed: transactions.filter(t => t.status === 'COMPLETED').length,
      pending: transactions.filter(t => t.status === 'PENDING').length,
      failed: transactions.filter(t => t.status === 'FAILED').length,
      totalProcessed: transactions
        .filter(t => t.status === 'COMPLETED')
        .reduce((sum, t) => sum + t.amount, 0)
    };
  });

  ngOnInit(): void {
    // Load initial data
    this.loadData();
  }

  loadData(): void {
    // In a real implementation, load orders and transactions from API
    console.log('📊 Loading admin orders and transactions data...');
  }

  setActiveTab(tab: 'orders' | 'transactions' | 'coupons'): void {
    this.activeTab.set(tab);
  }

  getStatusBadgeClass(status: string): string {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'CONFIRMED':
      case 'COMPLETED':
        return 'bg-green-100 text-green-700 border border-green-200';
      case 'CANCELLED':
      case 'FAILED':
        return 'bg-red-100 text-red-700 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  }

  getStatusIcon(status: string): string {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return '⏳';
      case 'CONFIRMED':
      case 'COMPLETED':
        return '✅';
      case 'CANCELLED':
      case 'FAILED':
        return '❌';
      default:
        return '📦';
    }
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  formatCurrency(amount: number): string {
    return amount.toFixed(2) + ' TND';
  }
}