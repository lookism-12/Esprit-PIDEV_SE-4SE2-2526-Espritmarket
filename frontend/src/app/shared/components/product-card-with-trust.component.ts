import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TrustBadgeComponent } from './trust-badge.component';

/**
 * Example Product Card Component with Trust Badge
 * 
 * This demonstrates how to integrate trust badges into product displays
 * You can adapt this pattern to your existing product card components
 */
@Component({
  selector: 'app-product-card-with-trust',
  standalone: true,
  imports: [CommonModule, RouterModule, TrustBadgeComponent],
  template: `
    <div class="product-card bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all">
      <!-- Product Image -->
      <div class="relative aspect-square bg-gray-100">
        @if (product.imageUrl) {
          <img [src]="product.imageUrl" [alt]="product.name" class="w-full h-full object-cover" />
        } @else {
          <div class="w-full h-full flex items-center justify-center text-gray-400">
            <span class="text-4xl">📦</span>
          </div>
        }
        
        <!-- Trust Badge Overlay (Top Right) -->
        @if (product.shopTrustScore !== undefined) {
          <div class="absolute top-2 right-2">
            <app-trust-badge 
              [trustScore]="product.shopTrustScore" 
              [badge]="product.shopTrustBadge"
              [size]="'sm'"
              [showIcon]="true"
              [showScore]="false"
              [showLabel]="false" />
          </div>
        }
      </div>
      
      <!-- Product Info -->
      <div class="p-4">
        <h3 class="font-semibold text-gray-900 mb-1 line-clamp-2">{{ product.name }}</h3>
        <p class="text-sm text-gray-600 mb-3 line-clamp-2">{{ product.description }}</p>
        
        <!-- Price and Shop Info -->
        <div class="flex items-center justify-between mb-3">
          <span class="text-lg font-bold text-primary">\${{ product.price }}</span>
          @if (product.shopName) {
            <span class="text-xs text-gray-500">by {{ product.shopName }}</span>
          }
        </div>
        
        <!-- Trust Score Bar (if available) -->
        @if (product.shopTrustScore !== undefined) {
          <div class="flex items-center gap-2 text-xs">
            <span class="text-gray-600">Trust:</span>
            <div class="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                   [style.width.%]="product.shopTrustScore"></div>
            </div>
            <span class="font-semibold text-gray-700">{{ product.shopTrustScore }}%</span>
          </div>
        }
        
        <!-- Action Button -->
        <button class="mt-3 w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
          View Details
        </button>
      </div>
    </div>
  `,
  styles: [`
    .product-card {
      transition: all 0.3s ease;
    }
    
    .product-card:hover {
      transform: translateY(-4px);
    }
    
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class ProductCardWithTrustComponent {
  @Input() product: any = {
    name: 'Sample Product',
    description: 'This is a sample product description',
    price: 99.99,
    imageUrl: '',
    shopName: 'Sample Shop',
    shopTrustScore: 75,
    shopTrustBadge: 'TRUSTED_SELLER'
  };
}
