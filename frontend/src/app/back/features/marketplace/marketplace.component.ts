import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService as SharedProductService } from '../../../core/services/product.service';
import { Product } from '../../../front/models/product';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-back-marketplace',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl shadow-soft border border-gray-100">
        <div>
          <h1 class="text-3xl font-black text-dark tracking-tight">Marketplace Inventory</h1>
          <p class="text-secondary font-medium mt-1">Manage and moderate all products across the platform</p>
        </div>
        <div class="flex gap-3">
            <button (click)="refresh()" class="px-6 py-3 bg-gray-50 hover:bg-gray-100 text-dark font-black rounded-xl transition-all uppercase tracking-widest text-[10px] border border-gray-100">
                🔄 Refresh
            </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-white p-6 rounded-3xl shadow-soft border border-gray-100 flex items-center gap-4 group hover:border-primary/30 transition-all cursor-default">
          <div class="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📦</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Total Products</p>
            <p class="text-2xl font-black text-dark">{{ products().length }}</p>
          </div>
        </div>
        <div class="bg-white p-6 rounded-3xl shadow-soft border border-gray-100 flex items-center gap-4 group hover:border-accent/30 transition-all cursor-default">
          <div class="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📉</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Low Stock</p>
            <p class="text-2xl font-black text-dark">{{ lowStockCount() }}</p>
          </div>
        </div>
      </div>

      <!-- Inventory Table -->
      <div class="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/50">
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Product</th>
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Category</th>
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Price</th>
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Stock</th>
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @if (isLoading()) {
                <tr>
                  <td colspan="5" class="px-6 py-20 text-center">
                    <div class="flex flex-col items-center gap-4">
                      <div class="w-10 h-10 border-4 border-gray-100 border-t-primary rounded-full animate-spin"></div>
                      <p class="text-xs font-black text-secondary uppercase tracking-widest">Fetching inventory...</p>
                    </div>
                  </td>
                </tr>
              } @else if (products().length === 0) {
                <tr>
                  <td colspan="5" class="px-6 py-20 text-center">
                    <p class="text-secondary font-medium">No products found in the database.</p>
                  </td>
                </tr>
              } @else {
                @for (product of products(); track product.id) {
                  <tr class="hover:bg-gray-50/50 transition-colors group">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                          <img [src]="product.imageUrl || product.images?.[0] || 'assets/placeholder.png'" 
                               class="w-full h-full object-cover">
                        </div>
                        <div>
                          <p class="font-black text-dark text-sm leading-tight">{{ product.name }}</p>
                          <p class="text-[10px] text-secondary font-medium truncate max-w-[200px]">{{ product.description }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span class="px-3 py-1 bg-gray-100 text-[10px] font-black text-secondary rounded-lg uppercase tracking-widest">
                        {{ product.category || 'N/A' }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <p class="font-black text-primary text-sm">{{ product.price }} <span class="text-[10px]">TND</span></p>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full" 
                             [class.bg-green-500]="(product.stock || 0) > 10"
                             [class.bg-orange-500]="(product.stock || 0) <= 10 && (product.stock || 0) > 0"
                             [class.bg-red-500]="(product.stock || 0) === 0"></div>
                        <span class="font-bold text-sm text-dark">{{ product.stock || 0 }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button (click)="delete(product.id)" 
                            class="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors"
                            title="Delete Product">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .shadow-soft {
      box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
    }
  `]
})
export class MarketplaceComponent implements OnInit {
  private productService = inject(SharedProductService);
  
  products = toSignal(this.productService.products$, { initialValue: [] });
  isLoading = this.productService.isLoading;
  
  lowStockCount = signal(0);

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.productService.loadProducts();
    // Re-calculate low stock
    setTimeout(() => {
        this.lowStockCount.set(this.products().filter(p => (p.stock || 0) <= 10).length);
    }, 500);
  }

  delete(id: string): void {
    if (confirm('Are you sure you want to remove this product from the platform?')) {
      this.productService.deleteProduct(id).subscribe(() => this.refresh());
    }
  }
}
