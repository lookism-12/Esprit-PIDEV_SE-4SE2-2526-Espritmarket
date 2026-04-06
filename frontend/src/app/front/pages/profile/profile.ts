import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { OrderService } from '../../core/order.service';
import { UserService } from '../../core/user.service';
import { LoyaltyService } from '../../core/loyalty.service';
import { Order, OrderStatus, OrderItemStatus, PaymentMethod, PaymentStatus, ShippingMethod } from '../../models/order.model';
import { Product, StockStatus, ProductCondition } from '../../models/product';
import { UserRole } from '../../models/user.model';
import { LoyaltyLevel, LoyaltyAccount, PointsTransaction, PointsTransactionType, LOYALTY_LEVELS } from '../../models/loyalty.model';
import { CartResponse } from '../../models/cart.model';
import { ProfileEditModal } from './profile-edit-modal';
import { AvatarUploadModal } from './avatar-upload-modal';
import { PasswordChangeModal } from './password-change-modal';

type ProfileTab = 'listings' | 'orders' | 'shop-orders' | 'loyalty' | 'preferences' | 'settings';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    ReactiveFormsModule,
    ProfileEditModal,
    AvatarUploadModal,
    PasswordChangeModal
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private userService = inject(UserService);
  private loyaltyService = inject(LoyaltyService);

  // User data - Now using real authenticated user data
  user = computed(() => ({
    id: this.authService.userId() || '1',
    firstName: this.authService.userFirstName() || 'User',
    lastName: this.authService.userLastName() || 'Profile',
    email: this.authService.userEmail() || 'user@example.com',
    phone: '12345678',
    reputation: 4.9,
    ordersCount: this.realOrders().length,
    joinedDate: 'September 2023',
    avatarUrl: this.authService.userAvatar() || '',
    address: 'Tunis, Tunisia',
    isVerified: true
  }));

  // Tab management
  activeTab = signal<ProfileTab>('listings');
  
  // Edit mode
  isEditing = signal(false);
  profileForm!: FormGroup;
  preferencesForm!: FormGroup;
  isSaving = signal(false);

  // Modal states
  showEditModal = signal(false);
  showAvatarModal = signal(false);
  showPasswordModal = signal(false);

  // Orders - REAL DATA from backend
  realOrders = signal<CartResponse[]>([]);
  isLoadingOrders = signal(false);

  // Provider-specific: Shop orders management
  shopOrders = signal<Order[]>([]);
  isLoadingShopOrders = signal(false);
  selectedShopOrder = signal<Order | null>(null);

  // Provider role check
  isProvider = computed(() => this.authService.userRole() === UserRole.PROVIDER);

  // Loyalty - REAL DATA from backend
  loyaltyAccount = signal<LoyaltyAccount | null>(null);

  pointsHistory = signal<PointsTransaction[]>([]);

  // Preferences
  preferences = signal({
    academicInterests: ['Software Engineering', 'Data Science', 'Mobile Development'],
    technicalSkills: ['JavaScript', 'Python', 'React'],
    preferredCategories: ['Electronics', 'Books', 'Gaming'],
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    theme: 'light' as 'light' | 'dark' | 'system'
  });

  availableInterests = [
    'Software Engineering', 'Data Science', 'Mobile Development', 'Web Development',
    'AI/ML', 'Cybersecurity', 'DevOps', 'Embedded Systems', 'Game Development',
    'Cloud Computing', 'Blockchain', 'IoT'
  ];

  availableCategories = ['Electronics', 'Books', 'Gaming', 'Furniture', 'Services', 'Sports', 'Clothing'];

  // Listings (mock data)
  listings = signal([
    {
      id: '1',
      name: 'Scientific Calculator TI-84',
      price: 85,
      status: 'active',
      views: 124,
      imageUrl: 'https://images.unsplash.com/photo-1564466809058-bf4114d55352?q=80&w=400'
    },
    {
      id: '2',
      name: 'Engineering Textbook Bundle',
      price: 150,
      status: 'active',
      views: 89,
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400'
    }
  ]);

  // Computed
  loyaltyProgress = computed(() => {
    const account = this.loyaltyAccount();
    if (!account) return 0;
    const currentLevel = LOYALTY_LEVELS.find(l => l.level === account.level);
    const nextLevel = LOYALTY_LEVELS.find(l => l.minPoints > (currentLevel?.minPoints || 0));
    if (!currentLevel || !nextLevel) return 100;
    const progress = ((account.lifetimePoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100;
    return Math.min(100, Math.max(0, progress));
  });

  ngOnInit(): void {
    this.initProfileForm();
    this.initPreferencesForm();
    
    // Load REAL data from backend
    this.loadLoyaltyAccount();
    this.loadOrders();

    // Load shop orders if user is a provider
    if (this.isProvider()) {
      this.loadShopOrders();
    }

    // Check URL params for tab
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.setActiveTab(params['tab'] as ProfileTab);
      }
    });
  }

  private initProfileForm(): void {
    const user = this.user();
    this.profileForm = this.fb.group({
      firstName: [user.firstName, [Validators.required, Validators.minLength(2)]],
      lastName: [user.lastName, [Validators.required, Validators.minLength(2)]],
      email: [user.email, [Validators.required, Validators.email]],
      phone: [user.phone, [Validators.required, Validators.pattern(/^[0-9]{8,15}$/)]],
      address: [user.address]
    });
  }

  private initPreferencesForm(): void {
    const prefs = this.preferences();
    this.preferencesForm = this.fb.group({
      emailNotifications: [prefs.notifications.email],
      pushNotifications: [prefs.notifications.push],
      smsNotifications: [prefs.notifications.sms],
      theme: [prefs.theme]
    });
  }

  private loadOrders(): void {
    console.log('📦 Loading real orders from backend...');
    this.isLoadingOrders.set(true);
    
    this.orderService.getMyOrders().subscribe({
      next: (orders) => {
        console.log('✅ Real orders loaded:', orders);
        this.realOrders.set(orders);
        this.isLoadingOrders.set(false);
      },
      error: (error) => {
        console.error('❌ Failed to load orders:', error);
        this.isLoadingOrders.set(false);
        // Keep empty array on error
        this.realOrders.set([]);
      }
    });
  }

  /**
   * Load real loyalty account from backend
   */
  private loadLoyaltyAccount(): void {
    console.log('🏆 Loading real loyalty account from backend...');
    
    this.loyaltyService.getAccount().subscribe({
      next: (account) => {
        console.log('✅ Real loyalty account loaded:', account);
        this.loyaltyAccount.set(account);
      },
      error: (error) => {
        console.error('❌ Failed to load loyalty account:', error);
        // Set default account on error
        this.loyaltyAccount.set({
          id: 'default',
          userId: this.authService.userId() || '',
          points: 0,
          lifetimePoints: 0,
          level: LoyaltyLevel.BRONZE,
          nextLevelPoints: 1000,
          pointsToNextLevel: 1000,
          benefits: [],
          history: [],
          memberSince: new Date(),
          updatedAt: new Date()
        });
      }
    });
  }

  // ============ PROVIDER SHOP ORDERS MANAGEMENT ============
  
  /**
   * Load orders for the provider's shop
   */
  private loadShopOrders(): void {
    this.isLoadingShopOrders.set(true);
    
    // TODO: Replace with actual API call to get shop orders
    // this.orderService.getShopOrders().subscribe({
    //   next: (orders) => {
    //     this.shopOrders.set(orders);
    //     this.isLoadingShopOrders.set(false);
    //   },
    //   error: (error) => {
    //     console.error('Failed to load shop orders:', error);
    //     this.isLoadingShopOrders.set(false);
    //   }
    // });

    // Mock data for now
    setTimeout(() => {
      const mockShopOrders: Order[] = [
        {
          id: 'ORD-SHOP-001',
          orderNumber: 'ORD-2024-SP-001',
          userId: 'customer-1',
          buyer: {
            id: 'customer-1',
            firstName: 'Ahmed',
            lastName: 'Ben Ali',
            email: 'ahmed@example.com',
            phone: '12345678'
          },
          sellerId: this.authService.userId() || 'seller-1',
          seller: {
            id: this.authService.userId() || 'seller-1',
            firstName: this.authService.userFirstName() || 'Provider',
            lastName: this.authService.userLastName() || 'User',
            email: this.authService.userEmail() || 'provider@example.com'
          },
          items: [
            {
              id: 'item-1',
              productId: 'product-1',
              product: {
                id: 'product-1',
                name: 'iPhone 15 Pro',
                price: 1299.99,
                description: 'Latest iPhone model',
                category: 'Electronics',
                imageUrl: '/assets/iphone.jpg',
                stock: 10,
                stockStatus: StockStatus.IN_STOCK,
                condition: ProductCondition.NEW,
                sellerId: this.authService.userId() || 'seller-1',
                sellerName: (this.authService.userFirstName() || 'Provider') + ' ' + (this.authService.userLastName() || 'User'),
                rating: 4.5,
                reviewsCount: 12,
                isNegotiable: true,
                createdAt: new Date(),
                updatedAt: new Date()
              },
              orderId: 'ORD-SHOP-001',
              quantity: 1,
              unitPrice: 1299.99,
              totalPrice: 1299.99,
              notes: '',
              status: OrderItemStatus.PENDING
            }
          ],
          status: OrderStatus.PENDING,
          statusHistory: [
            {
              status: OrderStatus.PENDING,
              timestamp: new Date('2024-02-15'),
              note: 'Order placed by customer'
            }
          ],
          subtotal: 1299.99,
          tax: 0,
          discount: 0,
          shippingCost: 0,
          total: 1299.99,
          payment: {
            method: PaymentMethod.CASH_ON_DELIVERY,
            status: PaymentStatus.PENDING,
            amount: 1299.99
          },
          shipping: {
            method: ShippingMethod.HOME_DELIVERY,
            address: {
              fullName: 'Ahmed Ben Ali',
              phone: '12345678',
              address: 'Rue de la République, 45',
              city: 'Tunis',
              postalCode: '1000',
              isOnCampus: false
            }
          },
          createdAt: new Date('2024-02-15'),
          updatedAt: new Date('2024-02-15')
        },
        {
          id: 'ORD-SHOP-002',
          orderNumber: 'ORD-2024-SP-002',
          userId: 'customer-2',
          buyer: {
            id: 'customer-2',
            firstName: 'Fatma',
            lastName: 'Trabelsi',
            email: 'fatma@example.com',
            phone: '87654321'
          },
          sellerId: this.authService.userId() || 'seller-1',
          seller: {
            id: this.authService.userId() || 'seller-1',
            firstName: this.authService.userFirstName() || 'Provider',
            lastName: this.authService.userLastName() || 'User',
            email: this.authService.userEmail() || 'provider@example.com'
          },
          items: [
            {
              id: 'item-2',
              productId: 'product-2',
              product: {
                id: 'product-2',
                name: 'MacBook Air M3',
                price: 1499.99,
                description: 'Latest MacBook model',
                category: 'Electronics',
                imageUrl: '/assets/macbook.jpg',
                stock: 5,
                stockStatus: StockStatus.IN_STOCK,
                condition: ProductCondition.NEW,
                sellerId: this.authService.userId() || 'seller-1',
                sellerName: (this.authService.userFirstName() || 'Provider') + ' ' + (this.authService.userLastName() || 'User'),
                rating: 4.7,
                reviewsCount: 8,
                isNegotiable: true,
                createdAt: new Date(),
                updatedAt: new Date()
              },
              orderId: 'ORD-SHOP-002',
              quantity: 1,
              unitPrice: 1499.99,
              totalPrice: 1499.99,
              notes: '',
              status: OrderItemStatus.CONFIRMED
            }
          ],
          status: OrderStatus.CONFIRMED,
          statusHistory: [
            {
              status: OrderStatus.PENDING,
              timestamp: new Date('2024-02-20'),
              note: 'Order placed by customer'
            },
            {
              status: OrderStatus.CONFIRMED,
              timestamp: new Date('2024-02-21'),
              note: 'Order confirmed by seller'
            }
          ],
          subtotal: 1499.99,
          tax: 0,
          discount: 0,
          shippingCost: 0,
          total: 1499.99,
          payment: {
            method: PaymentMethod.CASH_ON_DELIVERY,
            status: PaymentStatus.PENDING,
            amount: 1499.99
          },
          shipping: {
            method: ShippingMethod.HOME_DELIVERY,
            address: {
              fullName: 'Fatma Trabelsi',
              phone: '87654321',
              address: 'Avenue Habib Bourguiba, 123',
              city: 'Sousse',
              postalCode: '4000',
              isOnCampus: false
            }
          },
          createdAt: new Date('2024-02-20'),
          updatedAt: new Date('2024-02-21')
        },
        {
          id: 'ORD-SHOP-003',
          orderNumber: 'ORD-2024-SP-003',
          userId: 'customer-3',
          buyer: {
            id: 'customer-3',
            firstName: 'Mohamed',
            lastName: 'Sassi',
            email: 'mohamed@example.com',
            phone: '11223344'
          },
          sellerId: this.authService.userId() || 'seller-1',
          seller: {
            id: this.authService.userId() || 'seller-1',
            firstName: this.authService.userFirstName() || 'Provider',
            lastName: this.authService.userLastName() || 'User',
            email: this.authService.userEmail() || 'provider@example.com'
          },
          items: [
            {
              id: 'item-3',
              productId: 'product-3',
              product: {
                id: 'product-3',
                name: 'AirPods Pro',
                price: 249.99,
                description: 'Wireless earbuds with noise cancellation',
                category: 'Electronics',
                imageUrl: '/assets/airpods.jpg',
                stock: 20,
                stockStatus: StockStatus.IN_STOCK,
                condition: ProductCondition.NEW,
                sellerId: this.authService.userId() || 'seller-1',
                sellerName: (this.authService.userFirstName() || 'Provider') + ' ' + (this.authService.userLastName() || 'User'),
                rating: 4.3,
                reviewsCount: 25,
                isNegotiable: false,
                createdAt: new Date(),
                updatedAt: new Date()
              },
              orderId: 'ORD-SHOP-003',
              quantity: 2,
              unitPrice: 249.99,
              totalPrice: 499.98,
              notes: '',
              status: OrderItemStatus.SHIPPED
            }
          ],
          status: OrderStatus.SHIPPED,
          statusHistory: [
            {
              status: OrderStatus.PENDING,
              timestamp: new Date('2024-02-25'),
              note: 'Order placed by customer'
            },
            {
              status: OrderStatus.CONFIRMED,
              timestamp: new Date('2024-02-25'),
              note: 'Order confirmed by seller'
            },
            {
              status: OrderStatus.PROCESSING,
              timestamp: new Date('2024-02-25'),
              note: 'Order being processed'
            },
            {
              status: OrderStatus.SHIPPED,
              timestamp: new Date('2024-02-26'),
              note: 'Order shipped to customer'
            }
          ],
          subtotal: 499.98,
          tax: 0,
          discount: 0,
          shippingCost: 0,
          total: 499.98,
          payment: {
            method: PaymentMethod.CASH_ON_DELIVERY,
            status: PaymentStatus.PENDING,
            amount: 499.98
          },
          shipping: {
            method: ShippingMethod.HOME_DELIVERY,
            address: {
              fullName: 'Mohamed Sassi',
              phone: '11223344',
              address: 'Route de Sfax, Km 10',
              city: 'Kairouan',
              postalCode: '3100',
              isOnCampus: false
            }
          },
          createdAt: new Date('2024-02-25'),
          updatedAt: new Date('2024-02-26')
        }
      ];
      
      this.shopOrders.set(mockShopOrders);
      this.isLoadingShopOrders.set(false);
    }, 800);
  }

  /**
   * Update order status (for providers)
   */
  updateOrderStatus(orderId: string, newStatus: OrderStatus): void {
    if (!this.isProvider()) {
      console.error('Only providers can update order status');
      return;
    }

    // TODO: Replace with actual API call
    // this.orderService.updateStatus({ orderId, status: newStatus }).subscribe({
    //   next: (updatedOrder) => {
    //     this.shopOrders.update(orders => 
    //       orders.map(order => order.id === orderId ? updatedOrder : order)
    //     );
    //     console.log('✅ Order status updated successfully');
    //   },
    //   error: (error) => {
    //     console.error('❌ Failed to update order status:', error);
    //   }
    // });

    // Mock update for now
    this.shopOrders.update(orders =>
      orders.map(order =>
        order.id === orderId
          ? { ...order, status: newStatus, updatedAt: new Date() }
          : order
      )
    );
    
    console.log(`✅ Order ${orderId} status updated to ${newStatus}`);
  }

  /**
   * Get order status badge class for styling
   */
  getOrderStatusClass(status: OrderStatus): string {
    const statusClasses: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      [OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-800 border-blue-200',
      [OrderStatus.PROCESSING]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      [OrderStatus.SHIPPED]: 'bg-purple-100 text-purple-800 border-purple-200',
      [OrderStatus.OUT_FOR_DELIVERY]: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      [OrderStatus.DELIVERED]: 'bg-green-100 text-green-800 border-green-200',
      [OrderStatus.COMPLETED]: 'bg-green-200 text-green-900 border-green-300',
      [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800 border-red-200',
      [OrderStatus.REFUNDED]: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  /**
   * Get available next status options for an order
   */
  getAvailableStatusTransitions(currentStatus: OrderStatus): OrderStatus[] {
    const transitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED],
      [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED, OrderStatus.REFUNDED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [OrderStatus.REFUNDED],
      [OrderStatus.REFUNDED]: []
    };
    return transitions[currentStatus] || [];
  }

  setActiveTab(tab: ProfileTab): void {
    this.activeTab.set(tab);
    if (tab === 'orders' && this.realOrders().length === 0) {
      this.loadOrders();
    } else if (tab === 'shop-orders' && this.shopOrders().length === 0 && this.isProvider()) {
      this.loadShopOrders();
    }
  }

  // ============ PROFILE EDIT ============
  startEditing(): void {
    this.showEditModal.set(true);
  }

  onEditProfileClose(): void {
    this.showEditModal.set(false);
  }

  onProfileSave(): void {
    this.showEditModal.set(false);
    console.log('✅ Profile saved successfully');
  }

  // ============ AVATAR UPLOAD ============
  openAvatarUpload(): void {
    this.showAvatarModal.set(true);
  }

  onAvatarUploadClose(): void {
    this.showAvatarModal.set(false);
  }

  onAvatarUploadComplete(url: string): void {
    console.log('🔍 Avatar upload complete handler called');
    console.log('  URL received:', url);
    console.log('  URL is valid:', this.isValidImageUrl(url));
    console.log('  URL starts with http:', url?.startsWith('http'));
    
    this.authService.userAvatar.set(url);
    
    console.log('✅ Avatar updated in AuthService');
    console.log('  Current avatar URL signal:', this.authService.userAvatar());
  }

  // ============ PASSWORD CHANGE ============
  openPasswordChange(): void {
    this.showPasswordModal.set(true);
  }

  onPasswordChangeClose(): void {
    this.showPasswordModal.set(false);
  }

  onPasswordChangeComplete(): void {
    console.log('✅ Password changed successfully');
  }

  // ============ SETTINGS & PREFERENCES ============
  savePreferences(): void {
    const formValue = this.preferencesForm.value;
    this.preferences.update(p => ({
      ...p,
      notifications: {
        email: formValue.emailNotifications,
        push: formValue.pushNotifications,
        sms: formValue.smsNotifications
      },
      theme: formValue.theme
    }));
    console.log('✅ Preferences saved');
  }

  cancelEditing(): void {
    this.isEditing.set(false);
    this.initProfileForm();
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formValue = this.profileForm.value;

    this.userService.updateProfile(formValue).subscribe({
      next: (updatedUser) => {
        this.authService.userFirstName.set(updatedUser.firstName);
        this.authService.userLastName.set(updatedUser.lastName);
        
        this.isSaving.set(false);
        this.isEditing.set(false);
        console.log('✅ Profile updated successfully');
      },
      error: (error) => {
        console.error('❌ Failed to update profile:', error);
        this.isSaving.set(false);
      }
    });
  }

  toggleInterest(interest: string): void {
    this.preferences.update(p => {
      const interests = p.academicInterests.includes(interest)
        ? p.academicInterests.filter(i => i !== interest)
        : [...p.academicInterests, interest];
      return { ...p, academicInterests: interests };
    });
  }

  toggleCategory(category: string): void {
    this.preferences.update(p => {
      const categories = p.preferredCategories.includes(category)
        ? p.preferredCategories.filter(c => c !== category)
        : [...p.preferredCategories, category];
      return { ...p, preferredCategories: categories };
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (!field?.errors) return '';
    
    if (field.errors['required']) return 'Required';
    if (field.errors['email']) return 'Invalid email';
    if (field.errors['minlength']) return 'Too short';
    if (field.errors['pattern']) return 'Invalid format';
    
    return '';
  }

  getStatusClass(status: OrderStatus | string): string {
    const statusStr = String(status).toUpperCase();
    const classes: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CONFIRMED': 'bg-blue-100 text-blue-800',
      'PROCESSING': 'bg-indigo-100 text-indigo-800',
      'SHIPPED': 'bg-purple-100 text-purple-800',
      'OUT_FOR_DELIVERY': 'bg-cyan-100 text-cyan-800',
      'DELIVERED': 'bg-green-100 text-green-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'REFUNDED': 'bg-gray-100 text-gray-800'
    };
    return classes[statusStr] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: OrderStatus): string {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  getLevelBadgeClass(level: LoyaltyLevel | string | undefined): string {
    const normalizedLevel = level || LoyaltyLevel.BRONZE;
    switch (normalizedLevel) {
      case LoyaltyLevel.BRONZE:
      case 'BRONZE': return 'bg-amber-100 text-amber-700 border-amber-200';
      case LoyaltyLevel.SILVER:
      case 'SILVER': return 'bg-gray-200 text-gray-700 border-gray-300';
      case LoyaltyLevel.GOLD:
      case 'GOLD': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case LoyaltyLevel.PLATINUM:
      case 'PLATINUM': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  }

  getLevelIcon(level: LoyaltyLevel | string | undefined): string {
    const normalizedLevel = level || LoyaltyLevel.BRONZE;
    switch (normalizedLevel) {
      case LoyaltyLevel.BRONZE:
      case 'BRONZE': return '🥉';
      case LoyaltyLevel.SILVER:
      case 'SILVER': return '🥈';
      case LoyaltyLevel.GOLD:
      case 'GOLD': return '🥇';
      case LoyaltyLevel.PLATINUM:
      case 'PLATINUM': return '💎';
      default: return '⭐';
    }
  }

  getTransactionClass(type: PointsTransactionType): string {
    switch (type) {
      case PointsTransactionType.EARNED: return 'text-green-600';
      case PointsTransactionType.REDEEMED: return 'text-red-600';
      case PointsTransactionType.BONUS: return 'text-purple-600';
      case PointsTransactionType.EXPIRED: return 'text-gray-500';
      default: return 'text-gray-600';
    }
  }

  deleteListing(id: string): void {
    if (confirm('Are you sure you want to delete this listing?')) {
      this.listings.update(items => items.filter(item => item.id !== id));
    }
  }

  /**
   * STEP 1: Validate if URL is a proper image URL (not just a filename)
   * Checks if URL starts with http, has path separator, or is data URL
   */
  isValidImageUrl(url: string): boolean {
    if (!url) return false;
    return url.startsWith('http') || url.includes('/') || url.startsWith('data:');
  }

  /**
   * STEP 1: Handle avatar image load error
   * Fallback to initials when image fails to load
   */
  onAvatarLoadSuccess(): void {
    console.log('✅ Avatar image loaded successfully from:', this.user().avatarUrl);
  }

  onAvatarLoadError(): void {
    const url = this.user().avatarUrl;
    console.error('❌ Avatar image failed to load');
    console.error('  URL attempted:', url);
    console.error('  URL format valid:', this.isValidImageUrl(url));
    console.error('  URL starts with http:', url?.startsWith('http'));
  }
}
