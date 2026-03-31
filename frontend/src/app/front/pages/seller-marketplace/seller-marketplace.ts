import { Component, signal, computed, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ProductService } from '../../../core/services/product.service';
import { ServiceService } from '../../../core/services/service.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingSpinner } from '../../../shared/components/loading-spinner/loading-spinner';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { ProductModal } from './product-modal.component';
import { ServiceModalComponent } from './service-modal.component';

type MarketplaceTab = 'products' | 'services';

@Component({
  selector: 'app-seller-marketplace',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LoadingSpinner,
    EmptyState,
    ProductModal,
    ServiceModalComponent
  ],
  templateUrl: './seller-marketplace.html',
  styleUrl: './seller-marketplace.scss',
})
export class SellerMarketplace implements OnInit {
  private authService = inject(AuthService);
  private productService = inject(ProductService);
  private serviceService = inject(ServiceService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  // Tab management
  activeTab = signal<MarketplaceTab>('products');

  // Products
  products = signal<any[]>([]);
  isLoadingProducts = signal(false);
  
  // Services
  services = signal<any[]>([]);
  isLoadingServices = signal(false);

  // Modals
  showProductModal = signal(false);
  showServiceModal = signal(false);
  selectedProduct = signal<any | null>(null);
  selectedService = signal<any | null>(null);

  // Stats
  stats = computed(() => ({
    totalProducts: this.products().length,
    activeProducts: this.products().filter(p => p.status === 'APPROVED').length,
    pendingProducts: this.products().filter(p => p.status === 'PENDING').length,
    totalServices: this.services().length,
    activeServices: this.services().filter(s => s.status === 'APPROVED').length,
    pendingServices: this.services().filter(s => s.status === 'PENDING').length
  }));

  // User info
  sellerName = computed(() => 
    `${this.authService.userFirstName()} ${this.authService.userLastName()}`
  );
  sellerId = computed(() => this.authService.userId());

  // Helper for modal
  signal = signal;

  ngOnInit(): void {
    console.log('🏪 SellerMarketplace component initialized');
    console.log('👤 Current user role:', this.authService.userRole());
    console.log('👤 User ID:', this.authService.userId());
    console.log('👤 Is Seller?:', this.authService.isSeller());
    console.log('👤 Is Admin?:', this.authService.isAdmin());
    this.loadProducts();
    this.loadServices();
  }

  setActiveTab(tab: MarketplaceTab): void {
    this.activeTab.set(tab);
  }

  // ============ PRODUCTS ============
  loadProducts(): void {
    console.log('🔄 ========================================');
    console.log('🔄 LOADING SELLER PRODUCTS');
    console.log('🔄 ========================================');
    console.log('👤 User ID:', this.authService.userId());
    console.log('👤 User Role:', this.authService.userRole());
    console.log('👤 Is Seller?:', this.authService.isSeller());
    console.log('🌐 API Endpoint: GET /api/products/mine');
    
    this.isLoadingProducts.set(true);
    
    this.productService.getMine().subscribe({
      next: (data) => {
        console.log('✅ ========================================');
        console.log('✅ PRODUCTS LOADED SUCCESSFULLY');
        console.log('✅ ========================================');
        console.log('📦 Total products received:', data.length);
        console.log('📦 Products data:', data);
        
        if (data.length > 0) {
          console.log('📦 First product:', data[0]);
          console.log('📦 Product IDs:', data.map(p => p.id));
          console.log('📦 Product names:', data.map(p => p.name));
          console.log('📦 Product statuses:', data.map(p => p.status));
        } else {
          console.warn('⚠️ No products found for this seller');
          console.warn('⚠️ This could mean:');
          console.warn('   1. You haven\'t created any products yet');
          console.warn('   2. Your shop doesn\'t exist (will be created when you add first product)');
          console.warn('   3. Products belong to a different shop');
        }
        
        this.products.set(data);
        this.isLoadingProducts.set(false);
        console.log('✅ Products signal updated, count:', this.products().length);
      },
      error: (err) => {
        console.error('❌ ========================================');
        console.error('❌ FAILED TO LOAD PRODUCTS');
        console.error('❌ ========================================');
        console.error('❌ Error:', err);
        console.error('❌ Error status:', err.status);
        console.error('❌ Error message:', err.message);
        console.error('❌ Error body:', err.error);
        
        if (err.status === 403) {
          console.error('❌ 403 FORBIDDEN - Role not authorized');
          console.error('❌ Current role:', this.authService.userRole());
          console.error('❌ Expected: SELLER or PROVIDER');
        } else if (err.status === 404) {
          console.error('❌ 404 NOT FOUND - Shop not found');
          console.error('❌ Shop will be created when you add your first product');
        }
        
        this.toast.error('Failed to load products');
        this.isLoadingProducts.set(false);
      }
    });
  }

  openProductModal(product?: any): void {
    console.log('🎨 Opening product modal');
    console.log('📦 Product to edit:', product);
    console.log('📦 Product type:', typeof product);
    console.log('📦 Product keys:', product ? Object.keys(product) : 'null');
    
    this.selectedProduct.set(product || null);
    console.log('✅ selectedProduct signal set to:', this.selectedProduct());
    
    this.showProductModal.set(true);
    console.log('✅ Modal should now be visible');
  }

  closeProductModal(): void {
    this.showProductModal.set(false);
    this.selectedProduct.set(null);
  }

  onProductSaved(): void {
    console.log('🎯 onProductSaved() called - Product was saved!');
    this.closeProductModal();
    this.toast.success('Product saved successfully! ✅');
    
    // Force immediate reload with multiple attempts (like admin)
    console.log('🔄 Force reloading products (attempt 1)...');
    this.forceReload();
    
    // Backup reload after 300ms
    setTimeout(() => {
      console.log('🔄 Force reloading products (attempt 2)...');
      this.forceReload();
    }, 300);
    
    // Final reload after 1 second
    setTimeout(() => {
      console.log('🔄 Force reloading products (attempt 3 - final)...');
      this.forceReload();
    }, 1000);
  }

  forceReload(): void {
    console.log('💪 ========================================');
    console.log('💪 FORCE RELOAD TRIGGERED');
    console.log('💪 ========================================');
    console.log('💪 Clearing products signal...');
    
    this.isLoadingProducts.set(true);
    
    this.productService.getMine().subscribe({
      next: (data) => {
        console.log('✅ Force reload successful!');
        console.log('📦 Products received:', data.length);
        console.log('📦 All products:', data);
        
        // Force signal update with change detection (like admin)
        console.log('🔄 Step 1: Clearing products signal...');
        this.products.set([]);  // Clear first
        this.cdr.detectChanges();  // Force change detection
        console.log('✅ Products cleared');
        
        setTimeout(() => {
          console.log('🔄 Step 2: Setting new products...');
          this.products.set(data);  // Then set new data
          this.cdr.detectChanges();  // Force change detection again
          console.log('✅ Products signal force-updated:', this.products().length);
          console.log('✅ ========================================');
          console.log('✅ FORCE RELOAD COMPLETE');
          console.log('✅ ========================================');
          this.isLoadingProducts.set(false);
        }, 50);
      },
      error: (err) => {
        console.error('❌ Force reload failed:', err);
        this.toast.error('Failed to reload products');
        this.isLoadingProducts.set(false);
      }
    });
  }

  deleteProduct(product: any): void {
    if (!confirm(`Delete "${product.name}"?`)) return;

    console.log('🗑️ Deleting product:', product.id);
    
    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        console.log('✅ Product deleted');
        this.toast.success('Product deleted successfully! 🗑️');
        this.loadProducts();
      },
      error: (err) => {
        console.error('❌ Failed to delete product:', err);
        this.toast.error('Failed to delete product');
      }
    });
  }

  // ============ SERVICES ============
  loadServices(): void {
    console.log('🔄 Loading seller services...');
    this.isLoadingServices.set(true);
    
    this.serviceService.getMine().subscribe({
      next: (data) => {
        console.log('✅ Services loaded:', data.length);
        this.services.set(data);
        this.isLoadingServices.set(false);
      },
      error: (err) => {
        console.error('❌ Failed to load services:', err);
        this.toast.error('Failed to load services');
        this.isLoadingServices.set(false);
      }
    });
  }

  openServiceModal(service?: any): void {
    this.selectedService.set(service || null);
    this.showServiceModal.set(true);
  }

  closeServiceModal(): void {
    this.showServiceModal.set(false);
    this.selectedService.set(null);
  }

  onServiceSaved(): void {
    console.log('🎯 onServiceSaved() called - Service was saved!');
    this.closeServiceModal();
    this.toast.success('Service saved successfully! ✅');
    
    // Force immediate reload with multiple attempts (like products)
    console.log('🔄 Force reloading services (attempt 1)...');
    this.forceReloadServices();
    
    setTimeout(() => {
      console.log('🔄 Force reloading services (attempt 2)...');
      this.forceReloadServices();
    }, 300);
    
    setTimeout(() => {
      console.log('🔄 Force reloading services (attempt 3 - final)...');
      this.forceReloadServices();
    }, 1000);
  }

  forceReloadServices(): void {
    console.log('💪 forceReloadServices() - Forcing services refresh...');
    this.isLoadingServices.set(true);
    
    this.serviceService.getMine().subscribe({
      next: (data) => {
        console.log('✅ Force reload successful - Services count:', data.length);
        
        this.services.set([]);
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.services.set(data);
          this.cdr.detectChanges();
          console.log('✅ Services signal force-updated:', this.services().length);
          this.isLoadingServices.set(false);
        }, 50);
      },
      error: (err) => {
        console.error('❌ Force reload failed:', err);
        this.toast.error('Failed to reload services');
        this.isLoadingServices.set(false);
      }
    });
  }

  deleteService(service: any): void {
    if (!confirm(`Delete "${service.name}"?`)) return;

    console.log('🗑️ Deleting service:', service.id);
    
    this.serviceService.deleteService(service.id).subscribe({
      next: () => {
        console.log('✅ Service deleted');
        this.toast.success('Service deleted successfully! 🗑️');
        this.loadServices();
      },
      error: (err) => {
        console.error('❌ Failed to delete service:', err);
        this.toast.error('Failed to delete service');
      }
    });
  }

  // ============ HELPERS ============
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-700 border-green-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'APPROVED': return 'Active';
      case 'PENDING': return 'Pending';
      case 'REJECTED': return 'Rejected';
      default: return status;
    }
  }

  getStockStatusClass(stock: number): string {
    if (stock === 0) return 'text-red-600';
    if (stock < 10) return 'text-orange-600';
    return 'text-green-600';
  }

  getStockStatusLabel(stock: number): string {
    if (stock === 0) return 'Out of Stock';
    if (stock < 10) return `Low Stock (${stock})`;
    return `In Stock (${stock})`;
  }
}
