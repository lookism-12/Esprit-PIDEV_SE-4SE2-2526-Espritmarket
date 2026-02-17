import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
    selector: 'app-moderation',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4 text-gray-800">Content Moderation</h1>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-600 mb-4">Review and moderate user-generated content</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p class="text-sm text-yellow-600 font-medium">Pending Review</p>
            <p class="text-2xl font-bold text-yellow-800 mt-2">12</p>
          </div>
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <p class="text-sm text-green-600 font-medium">Approved Today</p>
            <p class="text-2xl font-bold text-green-800 mt-2">45</p>
          </div>
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-sm text-red-600 font-medium">Rejected Today</p>
            <p class="text-2xl font-bold text-red-800 mt-2">3</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ModerationComponent { }

@Component({
    selector: 'app-marketplace',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4 text-gray-800">Marketplace</h1>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-600 mb-4">Manage products and listings</p>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p class="text-sm text-blue-600 font-medium">Total Products</p>
            <p class="text-2xl font-bold text-blue-800 mt-2">156</p>
          </div>
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <p class="text-sm text-green-600 font-medium">Active Listings</p>
            <p class="text-2xl font-bold text-green-800 mt-2">142</p>
          </div>
          <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p class="text-sm text-orange-600 font-medium">Low Stock</p>
            <p class="text-2xl font-bold text-orange-800 mt-2">8</p>
          </div>
          <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p class="text-sm text-purple-600 font-medium">Revenue (MTD)</p>
            <p class="text-2xl font-bold text-purple-800 mt-2">$12.5K</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MarketplaceComponent { }

@Component({
    selector: 'app-mobility',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4 text-gray-800">Smart Mobility</h1>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-600 mb-4">Track rides and manage vehicles</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <p class="text-sm text-green-600 font-medium">Active Rides</p>
            <p class="text-2xl font-bold text-green-800 mt-2">23</p>
          </div>
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p class="text-sm text-blue-600 font-medium">Available Vehicles</p>
            <p class="text-2xl font-bold text-blue-800 mt-2">67</p>
          </div>
          <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p class="text-sm text-purple-600 font-medium">Rides Today</p>
            <p class="text-2xl font-bold text-purple-800 mt-2">145</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MobilityComponent { }

@Component({
    selector: 'app-orders',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4 text-gray-800">Orders & Transactions</h1>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-600 mb-4">Manage orders and transactions</p>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p class="text-sm text-yellow-600 font-medium">Pending Orders</p>
            <p class="text-2xl font-bold text-yellow-800 mt-2">18</p>
          </div>
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p class="text-sm text-blue-600 font-medium">Processing</p>
            <p class="text-2xl font-bold text-blue-800 mt-2">34</p>
          </div>
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <p class="text-sm text-green-600 font-medium">Completed Today</p>
            <p class="text-2xl font-bold text-green-800 mt-2">89</p>
          </div>
          <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p class="text-sm text-purple-600 font-medium">Revenue Today</p>
            <p class="text-2xl font-bold text-purple-800 mt-2">$4.2K</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class OrdersComponent { }

@Component({
    selector: 'app-community',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4 text-gray-800">Community Oversight</h1>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-600 mb-4">Monitor community health and user reports</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-sm text-red-600 font-medium">Open Reports</p>
            <p class="text-2xl font-bold text-red-800 mt-2">7</p>
          </div>
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p class="text-sm text-yellow-600 font-medium">Under Review</p>
            <p class="text-2xl font-bold text-yellow-800 mt-2">12</p>
          </div>
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <p class="text-sm text-green-600 font-medium">Resolved Today</p>
            <p class="text-2xl font-bold text-green-800 mt-2">25</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CommunityComponent { }

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4 text-gray-800">Notification Center</h1>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-600 mb-4">Manage system notifications and announcements</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p class="text-sm text-blue-600 font-medium">Sent Today</p>
            <p class="text-2xl font-bold text-blue-800 mt-2">234</p>
          </div>
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p class="text-sm text-yellow-600 font-medium">Scheduled</p>
            <p class="text-2xl font-bold text-yellow-800 mt-2">15</p>
          </div>
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <p class="text-sm text-green-600 font-medium">Delivery Rate</p>
            <p class="text-2xl font-bold text-green-800 mt-2">98.5%</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class NotificationsComponent { }

@Component({
    selector: 'app-analytics',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4 text-gray-800">Analytics & Reports</h1>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-600 mb-4">View analytics and generate reports</p>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p class="text-sm text-blue-600 font-medium">Total Users</p>
            <p class="text-2xl font-bold text-blue-800 mt-2">8,542</p>
          </div>
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <p class="text-sm text-green-600 font-medium">Active Users</p>
            <p class="text-2xl font-bold text-green-800 mt-2">6,234</p>
          </div>
          <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p class="text-sm text-purple-600 font-medium">Total Revenue</p>
            <p class="text-2xl font-bold text-purple-800 mt-2">$125.4K</p>
          </div>
          <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p class="text-sm text-orange-600 font-medium">Growth Rate</p>
            <p class="text-2xl font-bold text-orange-800 mt-2">+12.5%</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AnalyticsComponent { }

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4 text-gray-800">System Settings</h1>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-600 mb-4">Configure system settings and preferences</p>
        <div class="space-y-4">
          <div class="border-b border-gray-200 pb-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">General Settings</h3>
            <p class="text-sm text-gray-600">Platform name, timezone, language preferences</p>
          </div>
          <div class="border-b border-gray-200 pb-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">Security Settings</h3>
            <p class="text-sm text-gray-600">Authentication, password policies, session management</p>
          </div>
          <div class="border-b border-gray-200 pb-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">Email Configuration</h3>
            <p class="text-sm text-gray-600">SMTP settings, email templates, notification preferences</p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-800 mb-2">API Settings</h3>
            <p class="text-sm text-gray-600">API keys, rate limiting, webhook configurations</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent { }
