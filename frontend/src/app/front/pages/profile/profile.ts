import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { OrderService } from '../../core/order.service';
import { UserService } from '../../core/user.service';
import { NotificationService } from '../../core/notification.service';
import { Order, OrderStatus } from '../../models/order.model';
import { AppNotification, NotificationType } from '../../models/notification.model';
import { LoyaltyLevel, LoyaltyAccount, PointsTransaction, PointsTransactionType, LOYALTY_LEVELS } from '../../models/loyalty.model';
import { ProfileEditModal } from './profile-edit-modal';
import { AvatarUploadModal } from './avatar-upload-modal';
import { PasswordChangeModal } from './password-change-modal';
import { NegotiationService } from '../../core/negotiation.service';
import { Negotiation } from '../../models/negotiation.model';
import { ProductService, MarketService } from '../../core';
import { Product } from '../../models/product';
import { UserRole } from '../../models/user.model';
import { forkJoin } from 'rxjs';

type ProfileTab = 'listings' | 'orders' | 'loyalty' | 'preferences' | 'notifications' | 'settings' | 'dashboard' | 'negotiations';
type MainCategory = 'shop' | 'activity' | 'account';

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
  private notificationService = inject(NotificationService);
  private negotiationService = inject(NegotiationService);
  private productService = inject(ProductService);
  private marketService = inject(MarketService);

  // User data - from auth signals (populated by loadCurrentUser)
  user = computed(() => ({
    id: this.authService.userId() || '',
    firstName: this.authService.userFirstName() || 'User',
    lastName: this.authService.userLastName() || '',
    email: this.authService.userEmail() || '',
    phone: this.authService.userPhone() || '—',
    reputation: 4.9,
    ordersCount: this.orders().length,
    joinedDate: 'Member',
    avatarUrl: this.authService.userAvatar() || '',
    address: this.authService.userAddress() || '—',
    isVerified: this.authService.userEnabled()
  }));

  isProvider = computed(() => this.authService.userRole() === UserRole.PROVIDER);
  notificationsEnabled = computed(() => this.authService.notificationsEnabled());
  internalNotificationsEnabled = computed(() => this.authService.internalNotificationsEnabled());
  externalNotificationsEnabled = computed(() => this.authService.externalNotificationsEnabled());
  isTogglingNotifications = signal(false);
  isTogglingInternal = signal(false);
  isTogglingExternal = signal(false);

  // Tab management
  activeTab = signal<ProfileTab>('dashboard');
  mainCategory = signal<MainCategory>('shop');
  
  // Edit mode
  isEditing = signal(false);
  profileForm!: FormGroup;
  preferencesForm!: FormGroup;
  isSaving = signal(false);

  // Modal states
  showEditModal = signal(false);
  showAvatarModal = signal(false);
  showPasswordModal = signal(false);

  // Notifications
  externalNotifications = signal<AppNotification[]>([]);
  isLoadingNotifications = signal(false);
  selectedNotification = signal<AppNotification | null>(null);
  unreadCount = computed(() => this.externalNotifications().filter(n => !n.read).length);

  // Orders
  orders = signal<Order[]>([]);
  isLoadingOrders = signal<boolean>(false);

  // Negotiations (Incoming Offers - Provider)
  incomingNegotiations = signal<Negotiation[]>([]);
  isLoadingNegotiations = signal<boolean>(false);
  isSubmittingNegotiation = signal<boolean>(false);
  showCounterModal = signal<boolean>(false);
  selectedNegotiation = signal<Negotiation | null>(null);
  counterOfferAmount = signal<number>(0);
  isClientCounterMode = signal<boolean>(false);

  // Negotiations (My Offers - Client)
  myNegotiations = signal<Negotiation[]>([]);
  isLoadingMyNegotiations = signal<boolean>(false);

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

  // Listings (real data loaded from API)
  listings = signal<Product[]>([]);

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

    // Default tab: providers start on dashboard, clients on orders
    if (!this.isProvider()) {
      this.mainCategory.set('activity');
      this.activeTab.set('orders');
    }

    // Check URL params for tab
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.setActiveTab(params['tab'] as ProfileTab);
      }
    });

    if (this.isProvider()) {
      this.loadIncomingNegotiations();
      this.loadMyShopItems();
    } else {
      this.loadMyNegotiations();
    }
  }

  setMainCategory(category: MainCategory): void {
    this.mainCategory.set(category);
    if (category === 'shop') this.setActiveTab('dashboard');
    else if (category === 'activity') this.setActiveTab('orders');
    else if (category === 'account') this.setActiveTab('loyalty');
  }

  loadMyShopItems(): void {
    this.isLoadingOrders.set(true);
    forkJoin({
      products: this.productService.getMyProducts(),
      services: this.marketService.getMyServices()
    }).subscribe({
      next: (result) => {
        const allItems = [...result.products, ...result.services];
        this.listings.set(allItems);
        this.isLoadingOrders.set(false);
      },
      error: (err) => {
        console.error('Failed to load shop items:', err);
        this.isLoadingOrders.set(false);
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
    this.orderService.getOrders().subscribe({
      next: (response) => {
        this.orders.set(response.orders || []);
        this.isLoadingOrders.set(false);
      },
      error: () => {
        this.isLoadingOrders.set(false);
      }
    });
  }

  private loadNotifications(): void {
    this.isLoadingNotifications.set(true);
    this.notificationService.getNotifications().subscribe({
      next: (response) => {
        // Show all notifications (both INTERNAL and EXTERNAL)
        this.externalNotifications.set(response.notifications);
        this.isLoadingNotifications.set(false);
      },
      error: (error) => {
        console.error('Failed to load notifications:', error);
        this.isLoadingNotifications.set(false);
      }
    });
  }

  setActiveTab(tab: ProfileTab): void {
    this.activeTab.set(tab);
    if (tab === 'orders' && this.orders().length === 0) {
      this.loadOrders();
    } else if (tab === 'notifications') {
      this.loadNotifications();
    } else if (tab === 'dashboard') {
      this.loadIncomingNegotiations();
    } else if (tab === 'negotiations') {
      this.loadMyNegotiations();
    }
  }

  goToDashboard(): void {
    this.setActiveTab('dashboard');
    // Scroll to tabs section
    const tabsElement = document.getElementById('profile-tabs');
    if (tabsElement) {
      tabsElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // ============ NEGOTIATIONS ============
  loadIncomingNegotiations(): void {
    this.isLoadingNegotiations.set(true);
    this.negotiationService.getIncomingNegociations().subscribe({
      next: (response) => {
        const mapped = response.negotiations.map(neg => ({
          ...neg,
          currentOffer: neg.proposals?.length ? neg.proposals[neg.proposals.length - 1].amount : 0
        }) as Negotiation);
        this.incomingNegotiations.set(mapped);
        this.isLoadingNegotiations.set(false);
      },
      error: (error) => {
        console.error('Failed to load incoming negotiations:', error);
        this.isLoadingNegotiations.set(false);
      }
    });
  }

  loadMyNegotiations(): void {
    this.isLoadingMyNegotiations.set(true);
    this.negotiationService.getAll().subscribe({
      next: (response) => {
        const mapped = response.negotiations.map(neg => ({
          ...neg,
          currentOffer: neg.proposals?.length ? neg.proposals[neg.proposals.length - 1].amount : 0
        }) as Negotiation);
        this.myNegotiations.set(mapped);
        this.isLoadingMyNegotiations.set(false);
      },
      error: (error) => {
        console.error('Failed to load my negotiations:', error);
        this.isLoadingMyNegotiations.set(false);
      }
    });
  }

  // ============ CLIENT NEGOTIATION ACTIONS ============
  clientAccept(id: string): void {
    if (!confirm('Accept this offer?')) return;
    this.isSubmittingNegotiation.set(true);
    this.negotiationService.accept(id).subscribe({
      next: (updated) => {
        this.myNegotiations.update(list =>
          list.map(n => n.id === id ? { ...n, status: updated.status } : n)
        );
        this.isSubmittingNegotiation.set(false);
      },
      error: () => this.isSubmittingNegotiation.set(false)
    });
  }

  clientReject(id: string): void {
    if (!confirm('Reject this offer?')) return;
    this.isSubmittingNegotiation.set(true);
    this.negotiationService.reject(id).subscribe({
      next: (updated) => {
        this.myNegotiations.update(list =>
          list.map(n => n.id === id ? { ...n, status: updated.status } : n)
        );
        this.isSubmittingNegotiation.set(false);
      },
      error: () => this.isSubmittingNegotiation.set(false)
    });
  }

  clientCancel(id: string): void {
    if (!confirm('Cancel this negotiation?')) return;
    this.isSubmittingNegotiation.set(true);
    this.negotiationService.cancel(id).subscribe({
      next: () => {
        this.myNegotiations.update(list =>
          list.map(n => n.id === id ? { ...n, status: 'CANCELLED' as any } : n)
        );
        this.isSubmittingNegotiation.set(false);
      },
      error: () => this.isSubmittingNegotiation.set(false)
    });
  }

  openClientCounterOffer(neg: Negotiation): void {
    this.selectedNegotiation.set(neg);
    const last = neg.proposals[neg.proposals.length - 1];
    this.counterOfferAmount.set(last ? last.amount : 0);
    this.isClientCounterMode.set(true);
    this.showCounterModal.set(true);
  }

  submitClientCounterOffer(): void {
    const neg = this.selectedNegotiation();
    const amount = this.counterOfferAmount();
    if (!neg || amount <= 0) return;
    this.isSubmittingNegotiation.set(true);
    this.negotiationService.submitCounterProposal({ negotiationId: neg.id, amount }).subscribe({
      next: (updated) => {
        this.myNegotiations.update(list =>
          list.map(n => n.id === neg.id ? {
            ...n,
            status: updated.status,
            proposals: updated.proposals,
            currentOffer: updated.proposals?.length ? updated.proposals[updated.proposals.length - 1].amount : n.currentOffer
          } : n)
        );
        this.isSubmittingNegotiation.set(false);
        this.closeCounterOffer();
      },
      error: () => this.isSubmittingNegotiation.set(false)
    });
  }

  acceptNegotiation(id: string): void {
    if (!confirm('Are you sure you want to accept this offer?')) return;
    this.isSubmittingNegotiation.set(true);
    this.negotiationService.accept(id).subscribe({
      next: (updated) => {
        this.incomingNegotiations.update(list =>
          list.map(n => n.id === id ? { ...n, status: updated.status } : n)
        );
        this.isSubmittingNegotiation.set(false);
      },
      error: (error) => {
        console.error('Failed to accept offer:', error);
        this.isSubmittingNegotiation.set(false);
      }
    });
  }

  rejectNegotiation(id: string): void {
    if (!confirm('Are you sure you want to reject this offer?')) return;
    this.isSubmittingNegotiation.set(true);
    this.negotiationService.reject(id).subscribe({
      next: (updated) => {
        this.incomingNegotiations.update(list =>
          list.map(n => n.id === id ? { ...n, status: updated.status } : n)
        );
        this.isSubmittingNegotiation.set(false);
      },
      error: (error) => {
        console.error('Failed to reject offer:', error);
        this.isSubmittingNegotiation.set(false);
      }
    });
  }

  openCounterOffer(neg: Negotiation): void {
    this.selectedNegotiation.set(neg);
    const lastProposal = neg.proposals[neg.proposals.length - 1];
    this.counterOfferAmount.set(lastProposal ? lastProposal.amount : 0);
    this.showCounterModal.set(true);
  }

  closeCounterOffer(): void {
    this.showCounterModal.set(false);
    this.selectedNegotiation.set(null);
    this.isClientCounterMode.set(false);
  }

  updateCounterAmount(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.counterOfferAmount.set(Number(input.value));
  }

  submitCounterOffer(): void {
    const neg = this.selectedNegotiation();
    const amount = this.counterOfferAmount();
    if (!neg || amount <= 0) return;

    this.isSubmittingNegotiation.set(true);
    this.negotiationService.submitCounterProposal({
      negotiationId: neg.id,
      amount: amount,
    }).subscribe({
      next: (updated) => {
        this.incomingNegotiations.update(list =>
          list.map(n => n.id === neg.id ? {
            ...n,
            status: updated.status,
            proposals: updated.proposals,
            currentOffer: updated.proposals?.length ? updated.proposals[updated.proposals.length - 1].amount : n.currentOffer
          } : n)
        );
        this.isSubmittingNegotiation.set(false);
        this.closeCounterOffer();
      },
      error: (err: any) => {
        this.isSubmittingNegotiation.set(false);
        console.error('Failed to submit counter offer:', err);
      }
    });
  }

  // ============ PROFILE EDITING & MISC ============
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

  startEditing(): void {
    this.showEditModal.set(true);
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

  // ============ NOTIFICATIONS ============
  toggleNotifications(): void {
    this.isTogglingNotifications.set(true);
    this.userService.toggleNotifications().subscribe({
      next: (res) => {
        this.authService.notificationsEnabled.set(res.notificationsEnabled);
        this.isTogglingNotifications.set(false);
      },
      error: () => this.isTogglingNotifications.set(false)
    });
  }

  toggleInternalNotifications(): void {
    this.isTogglingInternal.set(true);
    this.userService.toggleInternalNotifications().subscribe({
      next: (res) => {
        this.authService.internalNotificationsEnabled.set(res.internalNotificationsEnabled);
        this.isTogglingInternal.set(false);
      },
      error: () => this.isTogglingInternal.set(false)
    });
  }

  toggleExternalNotifications(): void {
    this.isTogglingExternal.set(true);
    this.userService.toggleExternalNotifications().subscribe({
      next: (res) => {
        this.authService.externalNotificationsEnabled.set(res.externalNotificationsEnabled);
        this.isTogglingExternal.set(false);
      },
      error: () => this.isTogglingExternal.set(false)
    });
  }

  markAllNotificationsAsRead(): void {
    const unread = this.externalNotifications().filter(n => !n.read);
    unread.forEach(n => this.notificationService.markAsRead(n.id).subscribe({
      next: () => {
        this.externalNotifications.update(list =>
          list.map(item => item.id === n.id ? { ...item, read: true } : item)
        );
        if (this.selectedNotification()?.id === n.id) {
          this.selectedNotification.update(s => s ? { ...s, read: true } : s);
        }
      }
    }));
  }

  markNotificationAsRead(notificationId: string): void {    this.notificationService.markAsRead(notificationId).subscribe({
      next: () => {
        this.externalNotifications.update(notifs =>
          notifs.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        // Update selected panel if it's the same notification
        if (this.selectedNotification()?.id === notificationId) {
          this.selectedNotification.update(n => n ? { ...n, read: true } : n);
        }
      },
      error: (error) => console.error('Failed to mark notification as read:', error)
    });
  }

  deleteNotification(notificationId: string): void {
    if (confirm('Are you sure you want to delete this notification?')) {
      this.notificationService.deactivate(notificationId).subscribe({
        next: () => {
          this.externalNotifications.update(notifs =>
            notifs.filter(n => n.id !== notificationId)
          );
          // Clear detail panel if deleted notification was selected
          if (this.selectedNotification()?.id === notificationId) {
            this.selectedNotification.set(null);
          }
        },
        error: (error) => console.error('Failed to delete notification:', error)
      });
    }
  }

  selectNotification(notification: AppNotification): void {
    this.selectedNotification.set(notification);
    if (!notification.read) {
      this.markNotificationAsRead(notification.id);
    }
  }

  getNotificationIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      [NotificationType.NEGOTIATION_UPDATE]: '💬',
      [NotificationType.ORDER_CONFIRMATION]: '📦',
      [NotificationType.PROMOTION]: '🎉',
      [NotificationType.SYSTEM]: '⚙️',
      [NotificationType.RIDE_UPDATE]: '🚗',
      [NotificationType.INTERNAL_NOTIFICATION]: 'ℹ️',
      [NotificationType.EXTERNAL_NOTIFICATION]: '🔔'
    };
    return icons[type] || '📢';
  }
}
