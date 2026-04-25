import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <span class="text-3xl">⚙️</span>
          System Settings
        </h1>
        <p class="text-gray-600 mt-1">Configure global platform settings and business rules</p>
      </div>

      <!-- Settings Sections -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- General Settings -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <span>🌐</span> General Settings
            </h2>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Platform Name</label>
              <input 
                type="text" 
                value="Esprit Market"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
              <input 
                type="email" 
                value="support@espritmarket.com"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Default Currency</label>
              <select class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option>USD ($)</option>
                <option>EUR (€)</option>
                <option>TND (د.ت)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Order Settings -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <span>📦</span> Order Settings
            </h2>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Auto-Cancel After (hours)</label>
              <input 
                type="number" 
                value="24"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Minimum Order Amount ($)</label>
              <input 
                type="number" 
                value="10"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
            </div>
            <div class="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked
                id="allowGuestCheckout"
                class="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500">
              <label for="allowGuestCheckout" class="text-sm font-medium text-gray-700">
                Allow Guest Checkout
              </label>
            </div>
          </div>
        </div>

        <!-- Payment Settings -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <span>💳</span> Payment Settings
            </h2>
          </div>
          <div class="p-6 space-y-4">
            <div class="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked
                id="enableCreditCard"
                class="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
              <label for="enableCreditCard" class="text-sm font-medium text-gray-700">
                Enable Credit Card Payments
              </label>
            </div>
            <div class="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked
                id="enablePaypal"
                class="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
              <label for="enablePaypal" class="text-sm font-medium text-gray-700">
                Enable PayPal
              </label>
            </div>
            <div class="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="enableCOD"
                class="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
              <label for="enableCOD" class="text-sm font-medium text-gray-700">
                Enable Cash on Delivery
              </label>
            </div>
          </div>
        </div>

        <!-- Shipping Settings -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4">
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <span>🚚</span> Shipping Settings
            </h2>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Standard Shipping Fee ($)</label>
              <input 
                type="number" 
                value="5.99"
                step="0.01"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Free Shipping Threshold ($)</label>
              <input 
                type="number" 
                value="50"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Estimated Delivery (days)</label>
              <input 
                type="number" 
                value="3-5"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
            </div>
          </div>
        </div>

        <!-- Notification Settings -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <span>🔔</span> Notification Settings
            </h2>
          </div>
          <div class="p-6 space-y-4">
            <div class="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked
                id="emailNotifications"
                class="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500">
              <label for="emailNotifications" class="text-sm font-medium text-gray-700">
                Email Notifications
              </label>
            </div>
            <div class="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked
                id="smsNotifications"
                class="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500">
              <label for="smsNotifications" class="text-sm font-medium text-gray-700">
                SMS Notifications
              </label>
            </div>
            <div class="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked
                id="pushNotifications"
                class="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500">
              <label for="pushNotifications" class="text-sm font-medium text-gray-700">
                Push Notifications
              </label>
            </div>
          </div>
        </div>

        <!-- Security Settings -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4">
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              <span>🔒</span> Security Settings
            </h2>
          </div>
          <div class="p-6 space-y-4">
            <div class="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked
                id="twoFactorAuth"
                class="w-5 h-5 text-gray-600 border-gray-300 rounded focus:ring-gray-500">
              <label for="twoFactorAuth" class="text-sm font-medium text-gray-700">
                Require Two-Factor Authentication
              </label>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
              <input 
                type="number" 
                value="30"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
              <input 
                type="number" 
                value="5"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500">
            </div>
          </div>
        </div>

      </div>

      <!-- Save Button -->
      <div class="flex items-center justify-end">
        <button 
          class="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg flex items-center gap-2">
          <span class="text-xl">💾</span>
          Save All Settings
        </button>
      </div>

      <!-- Info Notice -->
      <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div class="flex items-start gap-4">
          <div class="text-3xl">⚠️</div>
          <div>
            <h3 class="font-semibold text-yellow-900 mb-2">Important Notice</h3>
            <p class="text-yellow-700 text-sm">
              Changes to system settings will affect all users and operations. Please review carefully before saving.
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
export class SystemSettingsComponent {
}
