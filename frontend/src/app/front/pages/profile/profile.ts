import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { OrderService } from '../../core/order.service';
import { UserService } from '../../core/user.service';
import { ProductService } from '../../core/product.service';
import { Product, StockStatus } from '../../models/product';
import { Order, OrderStatus } from '../../models/order.model';
import { LoyaltyLevel, LoyaltyAccount, PointsTransaction, PointsTransactionType, LOYALTY_LEVELS } from '../../models/loyalty.model';
import { ProfileEditModal } from './profile-edit-modal';
import { AvatarUploadModal } from './avatar-upload-modal';
import { PasswordChangeModal } from './password-change-modal';

type ProfileTab = 'listings' | 'orders' | 'loyalty' | 'preferences' | 'settings';

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
  public authService = inject(AuthService);
  private orderService = inject(OrderService);
  private userService = inject(UserService);
  private productService = inject(ProductService);

  // User data - Now using real authenticated user data
  user = computed(() => ({
    id: this.authService.userId() || '1',
    firstName: this.authService.userFirstName() || 'User',
    lastName: this.authService.userLastName() || 'Profile',
    email: this.authService.userEmail() || 'user@example.com',
    phone: '12345678',
    reputation: 4.9,
    ordersCount: this.mockOrders().length,
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

  // Orders
  orders = signal<Order[]>([]);
  isLoadingOrders = signal(false);

  // Loyalty
  loyaltyAccount = signal<LoyaltyAccount>({
    id: 'loyalty1',
    userId: '1',
    points: 1250,
    lifetimePoints: 3500,
    level: LoyaltyLevel.SILVER,
    nextLevelPoints: 2000,
    pointsToNextLevel: 750,
    benefits: [],
    history: [],
    memberSince: new Date('2023-09-01'),
    updatedAt: new Date()
  });

  pointsHistory = signal<PointsTransaction[]>([
    {
      id: '1',
      userId: '1',
      type: PointsTransactionType.EARNED,
      points: 120,
      description: 'Purchase: Modern Laptop Stand',
      referenceId: 'ORD-001',
      referenceType: 'order',
      createdAt: new Date('2024-02-15')
    },
    {
      id: '2',
      userId: '1',
      type: PointsTransactionType.REDEEMED,
      points: -50,
      description: 'Redeemed for discount',
      referenceId: 'ORD-002',
      referenceType: 'order',
      createdAt: new Date('2024-02-10')
    },
    {
      id: '3',
      userId: '1',
      type: PointsTransactionType.BONUS,
      points: 200,
      description: 'Welcome bonus',
      createdAt: new Date('2023-09-01')
    },
    {
      id: '4',
      userId: '1',
      type: PointsTransactionType.EARNED,
      points: 45,
      description: 'Review submitted',
      referenceType: 'review',
      createdAt: new Date('2024-02-08')
    }
  ]);

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

  // Listings (mapped from backend)
  listings = signal<any[]>([]);
  isLoadingListings = signal(false);

  // Mock orders for display
  mockOrders = signal([
    {
      id: 'ORD-001',
      orderNumber: 'ORD-2024-001',
      date: new Date('2024-02-15'),
      status: OrderStatus.DELIVERED,
      total: 165,
      itemCount: 2,
      items: [
        { name: 'Modern Laptop Stand', quantity: 1 },
        { name: 'Calculus Made Easy', quantity: 1 }
      ]
    },
    {
      id: 'ORD-002',
      orderNumber: 'ORD-2024-002',
      date: new Date('2024-02-20'),
      status: OrderStatus.PROCESSING,
      total: 85,
      itemCount: 1,
      items: [
        { name: 'Wireless Mouse', quantity: 1 }
      ]
    },
    {
      id: 'ORD-003',
      orderNumber: 'ORD-2024-003',
      date: new Date('2024-02-25'),
      status: OrderStatus.PENDING,
      total: 220,
      itemCount: 3,
      items: [
        { name: 'USB Hub', quantity: 1 },
        { name: 'Notebook Set', quantity: 2 }
      ]
    }
  ]);

  // Computed
  loyaltyProgress = computed(() => {
    const account = this.loyaltyAccount();
    const currentLevel = LOYALTY_LEVELS.find(l => l.level === account.level);
    const nextLevel = LOYALTY_LEVELS.find(l => l.minPoints > (currentLevel?.minPoints || 0));
    if (!currentLevel || !nextLevel) return 100;
    const progress = ((account.lifetimePoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100;
    return Math.min(100, Math.max(0, progress));
  });

  ngOnInit(): void {
    this.initProfileForm();
    this.initPreferencesForm();
    this.loadOrders();
    this.loadUserListings();

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
    this.isLoadingOrders.set(true);
    setTimeout(() => {
      this.isLoadingOrders.set(false);
    }, 500);
  }

  setActiveTab(tab: ProfileTab): void {
    this.activeTab.set(tab);
    if (tab === 'orders' && this.orders().length === 0) {
      this.loadOrders();
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

  getStatusClass(status: OrderStatus): string {
    const classes: Record<string, string> = {
      [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-800',
      [OrderStatus.PROCESSING]: 'bg-indigo-100 text-indigo-800',
      [OrderStatus.SHIPPED]: 'bg-purple-100 text-purple-800',
      [OrderStatus.OUT_FOR_DELIVERY]: 'bg-cyan-100 text-cyan-800',
      [OrderStatus.DELIVERED]: 'bg-green-100 text-green-800',
      [OrderStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
      [OrderStatus.REFUNDED]: 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: OrderStatus): string {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  getLevelBadgeClass(level: LoyaltyLevel): string {
    switch (level) {
      case LoyaltyLevel.BRONZE: return 'bg-amber-100 text-amber-700 border-amber-200';
      case LoyaltyLevel.SILVER: return 'bg-gray-200 text-gray-700 border-gray-300';
      case LoyaltyLevel.GOLD: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case LoyaltyLevel.PLATINUM: return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  }

  getLevelIcon(level: LoyaltyLevel): string {
    switch (level) {
      case LoyaltyLevel.BRONZE: return '🥉';
      case LoyaltyLevel.SILVER: return '🥈';
      case LoyaltyLevel.GOLD: return '🥇';
      case LoyaltyLevel.PLATINUM: return '💎';
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

  loadUserListings(): void {
    this.isLoadingListings.set(true);
    this.productService.getAllProducts().subscribe({
      next: (data) => {
        // For demo, we filter by the current logged-in user if sellerId exists
        // Otherwise show all for this integration step
        const userId = this.authService.userId();
        const filtered = data
          .filter(p => !userId || p.sellerId === userId || true) // Simplified: showing all for now if no user match
          .map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            status: p.stockStatus === StockStatus.IN_STOCK ? 'active' : 'out of stock',
            views: p.viewCount || 0,
            imageUrl: p.imageUrl
          }));
        this.listings.set(filtered);
        this.isLoadingListings.set(false);
      },
      error: (err) => {
        console.error("❌ Profile: Load listings error", err);
        this.isLoadingListings.set(false);
      }
    });
  }

  deleteListing(id: string): void {
    if (confirm('Are you sure you want to delete this listing?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          console.log('✅ Listing deleted successfully');
          this.loadUserListings();
        },
        error: (err) => {
          console.error("❌ Delete listing error", err);
          alert('Failed to delete listing. Please try again.');
        }
      });
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
