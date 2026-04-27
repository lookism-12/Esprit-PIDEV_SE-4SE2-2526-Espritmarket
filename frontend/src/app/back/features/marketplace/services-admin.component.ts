import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MarketplaceAdminService, ServiceAdminDto, CategoryDto, ShopAdminDto } from '../../core/services/marketplace-admin.service';
import { AdminAuthService } from '../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-services',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">

      <!-- Back Button -->
      <div>
        <a routerLink="/admin/marketplace" class="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-secondary hover:text-primary transition-colors">
          <span class="text-lg">←</span>
          <span>Back to Marketplace</span>
        </a>
      </div>

      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl shadow-soft border border-gray-100">
        <div>
          <h1 class="text-3xl font-black text-dark tracking-tight">{{ isAdmin() ? 'Services' : 'My Services' }}</h1>
          <p class="text-secondary font-medium mt-1">{{ isAdmin() ? 'Manage all marketplace services' : 'Manage your shop services' }}</p>
        </div>
        <div class="flex gap-3">
          <button (click)="loadData()" class="px-6 py-3 bg-gray-50 hover:bg-gray-100 text-dark font-black rounded-xl transition-all uppercase tracking-widest text-[10px] border border-gray-100">
            🔄 Refresh
          </button>
          <button (click)="openModal()" class="px-6 py-3 bg-primary text-white font-black rounded-xl transition-all uppercase tracking-widest text-[10px] hover:bg-primary/90">
            + Add Service
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-xl">🔧</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Total</p>
            <p class="text-2xl font-black text-dark">{{ services().length }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-xl">💰</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Avg Price</p>
            <p class="text-2xl font-black text-dark">{{ avgPrice() }} <span class="text-sm">TND</span></p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-xl">🏪</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Shops</p>
            <p class="text-2xl font-black text-dark">{{ uniqueShops() }}</p>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/50">
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Service</th>
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Category</th>
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Price</th>
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @if (isLoading()) {
                <tr><td colspan="4" class="px-6 py-16 text-center">
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-8 h-8 border-4 border-gray-100 border-t-primary rounded-full animate-spin"></div>
                    <p class="text-xs font-black text-secondary uppercase tracking-widest">Loading services...</p>
                  </div>
                </td></tr>
              } @else if (services().length === 0) {
                <tr><td colspan="4" class="px-6 py-16 text-center">
                  <div class="flex flex-col items-center gap-4">
                    <span class="text-5xl">🔧</span>
                    <div>
                      <p class="text-lg font-black text-dark mb-2">No services found</p>
                      <p class="text-secondary font-medium mb-4">
                        {{ isAdmin() ? 'No services have been created yet' : 'Start by adding your first service' }}
                      </p>
                      <button (click)="openModal()" 
                              class="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all">
                        <span class="mr-2">+</span>
                        Add First Service
                      </button>
                    </div>
                  </div>
                </td></tr>
              } @else {
                @for (s of services(); track s.id) {
                  <tr class="hover:bg-gray-50/50 transition-colors group">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-lg flex-shrink-0">🔧</div>
                        <div>
                          <p class="font-black text-dark text-sm">{{ s.name }}</p>
                          <p class="text-[10px] text-secondary truncate max-w-[200px]">{{ s.description }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span class="px-3 py-1 bg-gray-100 text-[10px] font-black text-secondary rounded-lg uppercase tracking-widest">
                        {{ getCategoryName(s.categoryId) || 'N/A' }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <p class="font-black text-primary text-sm">{{ s.price }} <span class="text-[10px]">TND</span></p>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button (click)="openModal(s)" title="Edit"
                            class="p-2 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors text-sm">✏️</button>
                        <button (click)="deleteService(s.id)" title="Delete"
                            class="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors text-sm">🗑️</button>
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

    <!-- Modal -->
    @if (showModal()) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" (click)="closeModal()">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 space-y-6 my-8" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-black text-dark">{{ editingId() ? 'Edit Service' : 'Add Service' }}</h2>
              <p class="text-xs text-secondary mt-1">Configure service details and booking availability</p>
            </div>
            <button (click)="closeModal()" class="text-secondary hover:text-dark transition-colors text-xl">✕</button>
          </div>
          
          <form [formGroup]="form" (ngSubmit)="save()" class="space-y-6">
            
            <!-- Basic Information -->
            <div class="space-y-4">
              <h3 class="text-sm font-black text-dark uppercase tracking-wider flex items-center gap-2">
                <span class="text-lg">📝</span>
                Basic Information
              </h3>
              
              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                  <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Service Name *</label>
                  <input formControlName="name" type="text" placeholder="e.g., Haircut, Massage, Consultation"
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium">
                </div>
                
                <div class="col-span-2">
                  <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Description</label>
                  <textarea formControlName="description" rows="2" placeholder="Brief description of the service"
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium resize-none"></textarea>
                </div>
                
                <div>
                  <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Price (TND) *</label>
                  <input formControlName="price" type="number" min="0" step="0.01" placeholder="0.00"
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium">
                </div>
                
                <div>
                  <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Duration (min) *</label>
                  <input formControlName="duration" type="number" min="15" step="15" placeholder="60"
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium">
                </div>
                
                <!-- Shop Field - Auto-filled for sellers, selectable for admins -->
                @if (isSeller() && currentUserShop()) {
                  <div class="col-span-2">
                    <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Shop</label>
                    <div class="w-full px-4 py-3 border-2 border-gray-200 bg-gray-50 rounded-xl text-sm font-medium flex items-center gap-2">
                      <span class="text-lg">🏪</span>
                      <span class="font-bold text-dark">{{ currentUserShop()!.name || 'My Shop' }}</span>
                      <span class="ml-auto text-xs text-green-600 font-bold px-2 py-1 bg-green-50 rounded-lg">✓ Auto-selected</span>
                    </div>
                    <p class="text-xs text-secondary mt-1">This service will be added to your shop automatically</p>
                  </div>
                } @else {
                  <div class="col-span-2">
                    <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Shop</label>
                    <select formControlName="shopId"
                      class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium bg-white">
                      <option value="">— Select shop —</option>
                      @for (shop of shops(); track shop.id) {
                        <option [value]="shop.id">{{ shop.name || 'Shop ' + shop.id.slice(0, 8) }}</option>
                      }
                    </select>
                  </div>
                }
                
                <div class="col-span-2">
                  <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Category</label>
                  <select formControlName="categoryId"
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium bg-white">
                    <option value="">— Select category —</option>
                    @for (cat of categories(); track cat.id) {
                      <option [value]="cat.id">{{ cat.name }}</option>
                    }
                  </select>
                </div>
              </div>
            </div>

            <!-- Booking Availability -->
            <div class="space-y-4 pt-4 border-t border-gray-200">
              <h3 class="text-sm font-black text-dark uppercase tracking-wider flex items-center gap-2">
                <span class="text-lg">📅</span>
                Booking Availability
              </h3>
              
              <!-- Available Days -->
              <div>
                <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-2">Available Days *</label>
                <div class="grid grid-cols-4 gap-2">
                  @for (day of daysOfWeek; track day.value) {
                    <button type="button" (click)="toggleDay(day.value)"
                      [class.bg-primary]="isDaySelected(day.value)"
                      [class.text-white]="isDaySelected(day.value)"
                      [class.bg-gray-100]="!isDaySelected(day.value)"
                      [class.text-secondary]="!isDaySelected(day.value)"
                      class="px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all hover:scale-105 flex items-center justify-center gap-1">
                      <span>{{ day.emoji }}</span>
                      <span class="hidden sm:inline">{{ day.label.slice(0, 3) }}</span>
                    </button>
                  }
                </div>
                <p class="text-xs text-secondary mt-2">Select the days when this service is available for booking</p>
              </div>
              
              <!-- Time Range -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Start Time *</label>
                  <input formControlName="startTime" type="time"
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium">
                </div>
                
                <div>
                  <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">End Time *</label>
                  <input formControlName="endTime" type="time"
                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium">
                </div>
              </div>
              
              <!-- Booking Summary -->
              <div class="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <div class="flex items-start gap-3">
                  <span class="text-2xl">ℹ️</span>
                  <div class="flex-1">
                    <p class="text-xs font-bold text-primary uppercase tracking-wider mb-1">Booking Configuration Summary</p>
                    <ul class="text-xs text-dark space-y-1">
                      <li>• Duration: <strong>{{ form.value.duration || 60 }} minutes</strong> per session</li>
                      <li>• Available: <strong>{{ form.value.availableDays?.length || 0 }} days</strong> per week</li>
                      <li>• Hours: <strong>{{ form.value.startTime || '09:00' }} - {{ form.value.endTime || '18:00' }}</strong></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 pt-2">
              <button type="submit" [disabled]="form.invalid || isSaving()"
                class="flex-1 py-3 bg-primary text-white font-black rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 text-sm uppercase tracking-widest">
                {{ isSaving() ? 'Saving...' : (editingId() ? 'Update Service' : 'Create Service') }}
              </button>
              <button type="button" (click)="closeModal()"
                class="px-6 py-3 bg-gray-100 text-dark font-black rounded-xl hover:bg-gray-200 transition-all text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`.shadow-soft { box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); }`]
})
export class ServicesAdminComponent implements OnInit {
  private svc = inject(MarketplaceAdminService);
  private fb = inject(FormBuilder);
  private authService = inject(AdminAuthService);

  services = signal<ServiceAdminDto[]>([]);
  categories = signal<CategoryDto[]>([]);
  shops = signal<ShopAdminDto[]>([]);
  currentUserShop = signal<ShopAdminDto | null>(null); // ✅ NEW: Current user's shop
  isLoading = signal(false);
  isSaving = signal(false);
  showModal = signal(false);
  editingId = signal<string | null>(null);

  // Role-based access
  isAdmin = signal(false);
  isSeller = signal(false);

  avgPrice = () => {
    const list = this.services();
    if (!list.length) return 0;
    return (list.reduce((s, i) => s + i.price, 0) / list.length).toFixed(2);
  };

  uniqueShops = () => new Set(this.services().filter(s => s.shopId).map(s => s.shopId)).size;

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    shopId: [''],
    categoryId: [''],
    duration: [60, [Validators.required, Validators.min(15)]], // Duration in minutes
    availableDays: [['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']], // Available days
    startTime: ['09:00', Validators.required], // Start time
    endTime: ['18:00', Validators.required] // End time
  });

  // Days of week for selection
  daysOfWeek = [
    { value: 'MONDAY', label: 'Monday', emoji: '📅' },
    { value: 'TUESDAY', label: 'Tuesday', emoji: '📅' },
    { value: 'WEDNESDAY', label: 'Wednesday', emoji: '📅' },
    { value: 'THURSDAY', label: 'Thursday', emoji: '📅' },
    { value: 'FRIDAY', label: 'Friday', emoji: '📅' },
    { value: 'SATURDAY', label: 'Saturday', emoji: '📅' },
    { value: 'SUNDAY', label: 'Sunday', emoji: '📅' }
  ];

  toggleDay(day: string): void {
    const current = this.form.value.availableDays || [];
    const index = current.indexOf(day);
    if (index > -1) {
      // Remove day
      this.form.patchValue({ availableDays: current.filter(d => d !== day) });
    } else {
      // Add day
      this.form.patchValue({ availableDays: [...current, day] });
    }
  }

  isDaySelected(day: string): boolean {
    const days = this.form.value.availableDays || [];
    return days.includes(day);
  }

  ngOnInit(): void {
    this.isAdmin.set(this.authService.isAdmin());
    this.isSeller.set(this.authService.isSeller());
    console.log('👤 User role - Admin:', this.isAdmin(), 'Seller:', this.isSeller());
    
    // ✅ Load current user's shop if seller
    if (this.isSeller()) {
      console.log('🔄 Loading seller shop...');
      this.svc.getMyShop().subscribe({
        next: (shop) => {
          console.log('✅ Current user shop loaded:', shop);
          this.currentUserShop.set(shop);
          // Auto-set shopId in form - ensure it's set properly
          if (shop && shop.id) {
            this.form.patchValue({ shopId: shop.id });
            console.log('✅ Shop ID auto-set in form:', shop.id);
          }
        },
        error: (err) => {
          console.error('❌ Failed to load user shop:', err);
          console.error('❌ Shop loading error details:', err.error);
          // If no shop exists, show a helpful message
          if (err.status === 404) {
            console.warn('⚠️ No shop found for current seller - they may need to create one first');
          }
        }
      });
    }
    
    this.loadData();
  }

  loadData(): void {
    console.log('🔄 Loading services...');
    this.isLoading.set(true);
    
    // Load categories first
    this.svc.getCategories().subscribe({
      next: cats => {
        console.log('✅ Categories loaded:', cats.length);
        this.categories.set(cats);
      },
      error: err => {
        console.error('❌ Failed to load categories:', err);
        console.error('❌ Categories error details:', err.error);
      }
    });
    
    // Load shops
    this.svc.getShops().subscribe({
      next: shops => {
        console.log('✅ Shops loaded:', shops.length);
        this.shops.set(shops);
      },
      error: err => {
        console.error('❌ Failed to load shops:', err);
        console.error('❌ Shops error details:', err.error);
      }
    });
    
    // Load services with detailed error handling
    console.log('🔄 Calling getServices() from MarketplaceAdminService...');
    this.svc.getServices().subscribe({
      next: (data) => {
        console.log('✅ Services API response:', data);
        console.log('✅ Services count:', Array.isArray(data) ? data.length : 'Not an array');
        console.log('✅ First service:', data?.[0]);
        this.services.set(Array.isArray(data) ? data : []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Failed to load services:', err);
        console.error('❌ Error status:', err.status);
        console.error('❌ Error message:', err.message);
        console.error('❌ Error details:', err.error);
        console.error('❌ Full error object:', err);
        
        // Set empty array and stop loading
        this.services.set([]);
        this.isLoading.set(false);
        
        // Show user-friendly message
        if (err.status === 404) {
          console.warn('⚠️ Services endpoint not found - this might be expected if no services exist yet');
        } else if (err.status === 0) {
          console.error('❌ Network error - check if backend is running');
        }
      }
    });
  }

  getCategoryName(id?: string): string {
    if (!id) return '';
    return this.categories().find(c => c.id === id)?.name || '';
  }

  openModal(s?: ServiceAdminDto): void {
    this.editingId.set(s?.id ?? null);
    
    // ✅ Auto-set shopId for sellers - prioritize current user shop
    let shopId = '';
    if (this.isSeller() && this.currentUserShop()) {
      shopId = this.currentUserShop()!.id;
      console.log('✅ Auto-selecting seller shop:', shopId, this.currentUserShop()!.name);
    } else if (s?.shopId) {
      shopId = s.shopId;
      console.log('✅ Using existing service shop:', shopId);
    }
    
    this.form.reset({ 
      name: s?.name ?? '', 
      description: s?.description ?? '', 
      price: s?.price ?? 0, 
      shopId: shopId,
      categoryId: s?.categoryId ?? '',
      duration: (s as any)?.duration ?? 60,
      availableDays: (s as any)?.availableDays ?? ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      startTime: (s as any)?.startTime ?? '09:00',
      endTime: (s as any)?.endTime ?? '18:00'
    });
    
    console.log('📝 Form initialized with values:', this.form.value);
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); this.editingId.set(null); }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      console.error('❌ Form validation failed:', this.form.errors);
      
      // Show specific validation errors
      const errors = [];
      if (this.form.get('name')?.invalid) errors.push('Service name is required');
      if (this.form.get('price')?.invalid) errors.push('Valid price is required');
      if (this.form.get('duration')?.invalid) errors.push('Duration must be at least 15 minutes');
      if (this.form.get('startTime')?.invalid) errors.push('Start time is required');
      if (this.form.get('endTime')?.invalid) errors.push('End time is required');
      if (!this.form.value.shopId && !this.isSeller()) errors.push('Shop selection is required');
      
      alert('Please fix the following errors:\n• ' + errors.join('\n• '));
      return;
    }
    
    // Validate available days
    const availableDays = this.form.value.availableDays || [];
    if (availableDays.length === 0) {
      alert('Please select at least one available day for booking');
      return;
    }
    
    // Validate time range
    const startTime = this.form.value.startTime;
    const endTime = this.form.value.endTime;
    if (startTime && endTime && startTime >= endTime) {
      alert('End time must be after start time');
      return;
    }
    
    this.isSaving.set(true);
    const v = this.form.value;
    
    // ✅ Ensure shopId is set for sellers
    const finalShopId = this.isSeller() && this.currentUserShop() 
      ? this.currentUserShop()!.id 
      : v.shopId;
    
    const payload: any = {
      name: v.name,
      description: v.description || '',
      price: Number(v.price) || 0,
      shopId: finalShopId,
      categoryId: v.categoryId || null,
      // ✅ Booking configuration
      duration: Number(v.duration) || 60,
      availableDays: availableDays,
      startTime: v.startTime || '09:00',
      endTime: v.endTime || '18:00'
    };
    
    console.log('🚀 Saving service with booking config:', payload);
    console.log('📊 Booking summary:', {
      duration: payload.duration + ' minutes',
      days: payload.availableDays.length + ' days/week',
      hours: payload.startTime + ' - ' + payload.endTime,
      shop: this.isSeller() ? 'Auto-selected' : 'Manual selection'
    });
    
    const id = this.editingId();
    const req = id ? this.svc.updateService(id, payload) : this.svc.createService(payload);
    
    req.subscribe({
      next: (result) => {
        console.log('✅ Service saved successfully:', result);
        this.closeModal();
        this.loadData();
        this.isSaving.set(false);
      },
      error: (e) => {
        console.error('❌ Save failed:', e);
        console.error('❌ Error details:', e.error);
        
        let errorMessage = 'Operation failed';
        if (e.error?.message) {
          errorMessage = e.error.message;
        } else if (e.status === 400) {
          errorMessage = 'Invalid data provided. Please check all fields.';
        } else if (e.status === 403) {
          errorMessage = 'You do not have permission to perform this action.';
        } else if (e.status === 404) {
          errorMessage = 'Shop or category not found.';
        } else if (e.status === 0) {
          errorMessage = 'Network error. Please check your connection.';
        }
        
        alert(errorMessage);
        this.isSaving.set(false);
      }
    });
  }

  deleteService(id: string): void {
    if (!confirm('Delete this service?')) return;
    console.log('🗑️ Deleting service:', id);
    this.svc.deleteService(id).subscribe({
      next: () => {
        console.log('✅ Service deleted');
        this.loadData();
      },
      error: (e) => {
        console.error('❌ Delete failed:', e);
        alert(e.error?.message || 'Delete failed');
      }
    });
  }
}
