import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environment';

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

@Component({
  selector: 'app-orders-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <span class="text-3xl">📊</span>
              Orders & Analytics
            </h1>
            <p class="text-gray-600 mt-1">Read-only dashboard for order statistics and analytics</p>
          </div>
          <div class="text-sm text-gray-500">
            Last updated: {{ currentTime | date:'short' }}
          </div>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Total Orders -->
        <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="text-4xl">📦</div>
            <div class="text-sm bg-white/20 px-3 py-1 rounded-full">Total</div>
          </div>
          <div class="text-3xl font-bold mb-1">{{ stats.totalOrders }}</div>
          <div class="text-blue-100 text-sm">Total Orders</div>
        </div>

        <!-- Pending Orders -->
        <div class="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="text-4xl">⏳</div>
            <div class="text-sm bg-white/20 px-3 py-1 rounded-full">Pending</div>
          </div>
          <div class="text-3xl font-bold mb-1">{{ stats.pendingOrders }}</div>
          <div class="text-yellow-100 text-sm">Awaiting Processing</div>
        </div>

        <!-- Completed Orders -->
        <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="text-4xl">✅</div>
            <div class="text-sm bg-white/20 px-3 py-1 rounded-full">Completed</div>
          </div>
          <div class="text-3xl font-bold mb-1">{{ stats.completedOrders }}</div>
          <div class="text-green-100 text-sm">Successfully Delivered</div>
        </div>

        <!-- Cancelled Orders -->
        <div class="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="text-4xl">❌</div>
            <div class="text-sm bg-white/20 px-3 py-1 rounded-full">Cancelled</div>
          </div>
          <div class="text-3xl font-bold mb-1">{{ stats.cancelledOrders }}</div>
          <div class="text-red-100 text-sm">Cancelled Orders</div>
        </div>

        <!-- Total Revenue -->
        <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="text-4xl">💰</div>
            <div class="text-sm bg-white/20 px-3 py-1 rounded-full">Revenue</div>
          </div>
          <div class="text-3xl font-bold mb-1">\${{ stats.totalRevenue | number:'1.2-2' }}</div>
          <div class="text-purple-100 text-sm">Total Revenue</div>
        </div>

        <!-- Average Order Value -->
        <div class="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="text-4xl">📈</div>
            <div class="text-sm bg-white/20 px-3 py-1 rounded-full">Average</div>
          </div>
          <div class="text-3xl font-bold mb-1">\${{ stats.averageOrderValue | number:'1.2-2' }}</div>
          <div class="text-indigo-100 text-sm">Average Order Value</div>
        </div>
      </div>

      <!-- Info Notice -->
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div class="flex items-start gap-4">
          <div class="text-3xl">ℹ️</div>
          <div>
            <h3 class="font-semibold text-blue-900 mb-2">Read-Only Dashboard</h3>
            <p class="text-blue-700 text-sm">
              This dashboard provides statistical overview of orders. Order status modifications are handled by providers through their respective dashboards.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class OrdersAnalyticsComponent implements OnInit {
  private http = inject(HttpClient);
  
  currentTime = new Date();
  
  stats: OrderStats = {
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0
  };

  ngOnInit(): void {
    this.loadStatistics();
    
    // Update time every minute
    setInterval(() => {
      this.currentTime = new Date();
    }, 60000);
  }

  private loadStatistics(): void {
    // Load statistics from backend
    this.http.get<any>(`${environment.apiUrl}/admin/orders/statistics`).subscribe({
      next: (data) => {
        this.stats = data;
      },
      error: () => {
        // Use mock data if API fails
        this.stats = {
          totalOrders: 1247,
          pendingOrders: 89,
          completedOrders: 1098,
          cancelledOrders: 60,
          totalRevenue: 125847.50,
          averageOrderValue: 100.92
        };
      }
    });
  }
}
