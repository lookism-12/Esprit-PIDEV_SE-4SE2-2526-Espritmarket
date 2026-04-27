import { Component, signal, computed, inject, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { UserRole } from '../../models/user.model';
import { CartService } from '../../core/cart.service';
import { NotificationType, NotificationPriority } from '../../models/notification.model';
import { NotificationService } from '../../core/notification.service';
import { ThemeService } from '../../core/theme.service';
import { FavoriteService } from '../../core/favorite.service';
import { filter, Subscription } from 'rxjs';

interface NavNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: Date;
}

interface MenuSection {
  title: string;
  icon: string;
  items: MenuItem[];
}

interface MenuItem {
  label: string;
  route: string;
  icon?: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private router = inject(Router);
  private document = inject(DOCUMENT);
  private notificationService = inject(NotificationService);
  readonly themeService = inject(ThemeService);
  private favoriteService = inject(FavoriteService);
  private routerSubscription: Subscription;

  // Dropdowns state
  showNotifications = signal(false);
  showUserMenu = signal(false);
  showMobileMenu = signal(false);
  isMenuOpen = signal(false);
  searchQuery = signal('');
  showProfileDropdown = signal(false);
  showMarketplaceDropdown = signal(false); // ✅ Added marketplace dropdown state
  
  // Search state
  isSearchFocused = signal(false);
  showMobileSearch = signal(false);

  // User profile state (NEW)
  isUserLoggedIn = computed(() => this.authService.isAuthenticated());
  userFullName = computed(() => this.authService.getFullName() || 'User');
  userInitials = computed(() => this.authService.getInitials() || 'U');
  userAvatar = computed(() => this.authService.userAvatar() || null);
  userEmail = computed(() => this.authService.userEmail() || '');
  isAdmin = computed(() => this.authService.userRole() === UserRole.ADMIN);
  isProvider = computed(() => this.authService.userRole() === UserRole.PROVIDER);
  isDriver = computed(() => this.authService.userRole() === UserRole.DRIVER);

  // Menu sections for the drawer — public sections always visible, protected only when authenticated
  readonly publicMenuSections: MenuSection[] = [
    {
      title: 'Marketplace',
      icon: '🛒',
      items: [
        { label: 'Browse Products', route: '/products', icon: '📦' },
        { label: 'Services', route: '/services', icon: '🔧' },
        { label: 'Shop', route: '/shop', icon: '🏪' }
      ]
    }
  ];

  readonly protectedMenuSections: MenuSection[] = [
    {
      title: 'Carpooling',
      icon: '🚗',
      items: [
        { label: 'Find a Ride', route: '/carpooling', icon: '🔍' },
        { label: 'My Rides', route: '/driver/rides', icon: '🛣️' }
      ]
    },
    {
      title: 'Community',
      icon: '💬',
      items: [
        { label: 'Forum', route: '/forum', icon: '📝' }
      ]
    },
    {
      title: 'Orders & Delivery',
      icon: '📦',
      items: [
        { label: 'My Orders', route: '/orders', icon: '🛍️' }
      ]
    },
    {
      title: 'Profile & Settings',
      icon: '⚙️',
      items: [
        { label: 'My Profile', route: '/profile', icon: '👤' }
      ]
    }
  ];

  menuSections: MenuSection[] = [...this.publicMenuSections, ...this.protectedMenuSections];

  visibleMenuSections = computed(() =>
    this.isUserAuthenticated()
      ? [...this.publicMenuSections, ...this.protectedMenuSections]
      : this.publicMenuSections
  );

  constructor() {
    // Close menu on navigation
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.closeDrawer();
      });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  // Mock cart count
  cartCount = computed(() => this.cartService.itemCount());
  favoriteCount = computed(() => this.favoriteService.favoriteCount());

  // ✅ REACTIVE AUTHENTICATION STATE - This makes the navbar dynamic!
  // When user logs in/out, this signal changes and template automatically updates
  isUserAuthenticated = computed(() => this.authService.isAuthenticated());

  // Real notifications from backend
  notifications = signal<NavNotification[]>([]);
  unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.loadNotifications();
      this.favoriteService.loadMyFavorites();
    }
  }

  private loadNotifications(): void {
    this.notificationService.getMy().subscribe({
      next: (items) => {
        const mapped: NavNotification[] = items.slice(0, 10).map(n => ({
          id: n.id,
          type: this.mapBackendType(n.type),
          title: n.title,
          message: (n as any).description || n.message || '',
          priority: NotificationPriority.MEDIUM,
          isRead: n.read,
          createdAt: new Date(n.createdAt)
        }));
        this.notifications.set(mapped);
      },
      error: () => {} // silently fail — navbar should never break
    });
  }

  private mapBackendType(type: string): NotificationType {
    const map: Record<string, NotificationType> = {
      INTERNAL_NOTIFICATION: NotificationType.ACCOUNT_UPDATE,
      EXTERNAL_NOTIFICATION: NotificationType.NEW_COUPON,
      RIDE_UPDATE: NotificationType.ORDER_SHIPPED,
      NEGOTIATION_UPDATE: NotificationType.NEW_MESSAGE,
    };
    return map[type] ?? NotificationType.ACCOUNT_UPDATE;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-dropdown') && !target.closest('.notification-trigger')) {
      this.showNotifications.set(false);
    }
    if (!target.closest('.user-menu-dropdown') && !target.closest('.user-menu-trigger')) {
      this.showUserMenu.set(false);
    }
    // Close profile dropdown when clicking outside
    if (!target.closest('.profile-dropdown') && !target.closest('.profile-avatar-btn')) {
      this.showProfileDropdown.set(false);
    }
    // Close marketplace dropdown when clicking outside
    if (!target.closest('.marketplace-dropdown') && !target.closest('.marketplace-trigger')) {
      this.showMarketplaceDropdown.set(false);
    }
  }

  toggleNotifications(): void {
    const opening = !this.showNotifications();
    this.showNotifications.set(opening);
    this.showUserMenu.set(false);
    if (opening && this.authService.isAuthenticated()) {
      this.loadNotifications();
    }
  }

  toggleUserMenu(): void {
    this.showUserMenu.update(v => !v);
    this.showNotifications.set(false);
  }

  toggleMobileMenu(): void {
    this.showMobileMenu.update(v => !v);
  }

  markAsRead(id: string): void {
    this.notificationService.markAsRead(id).subscribe({
      next: () => this.notifications.update(list => list.map(n => n.id === id ? { ...n, isRead: true } : n)),
      error: () => this.notifications.update(list => list.map(n => n.id === id ? { ...n, isRead: true } : n))
    });
    // Navigate to notifications page and open this specific notification
    this.showNotifications.set(false);
    this.router.navigate(['/notifications'], { queryParams: { id } });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => this.notifications.update(list => list.map(n => ({ ...n, isRead: true }))),
      error: () => this.notifications.update(list => list.map(n => ({ ...n, isRead: true })))
    });
  }

  getNotificationIcon(type: NotificationType): string {
    const icons: Partial<Record<NotificationType, string>> = {
      [NotificationType.ORDER_SHIPPED]: '🚚',
      [NotificationType.ORDER_DELIVERED]: '📦',
      [NotificationType.NEW_MESSAGE]: '💬',
      [NotificationType.NEW_COUPON]: '🎁',
      [NotificationType.PAYMENT_RECEIVED]: '💰',
      [NotificationType.NEW_REVIEW]: '⭐',
      [NotificationType.INTERNAL_NOTIFICATION]: '🔔',
      [NotificationType.EXTERNAL_NOTIFICATION]: '📣',
      [NotificationType.RIDE_UPDATE]: '🚗',
      [NotificationType.NEGOTIATION_UPDATE]: '🤝',
      [NotificationType.ACCOUNT_UPDATE]: '👤',
    };
    return icons[type] || '🔔';
  }

  getPriorityClass(priority: NotificationPriority): string {
    switch (priority) {
      case NotificationPriority.HIGH: return 'border-l-red-500';
      case NotificationPriority.MEDIUM: return 'border-l-yellow-500';
      case NotificationPriority.LOW: return 'border-l-gray-300';
      default: return 'border-l-gray-300';
    }
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  onSearch(event: Event): void {
    event.preventDefault();
    const query = this.searchQuery();
    if (query.trim()) {
      this.router.navigate(['/products'], { queryParams: { search: query } });
      this.closeMobileSearch();
    }
  }

  // Search methods
  onSearchFocus(): void {
    this.isSearchFocused.set(true);
  }

  onSearchBlur(): void {
    this.isSearchFocused.set(false);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  toggleMobileSearch(): void {
    this.showMobileSearch.set(true);
    this.document.body.classList.add('overflow-hidden');
  }

  closeMobileSearch(): void {
    this.showMobileSearch.set(false);
    this.document.body.classList.remove('overflow-hidden');
  }

  // Drawer methods
  openDrawer(): void {
    this.isMenuOpen.set(true);
    this.document.body.classList.add('overflow-hidden');
  }

  closeDrawer(): void {
    this.isMenuOpen.set(false);
    this.document.body.classList.remove('overflow-hidden');
  }

  toggleDrawer(): void {
    if (this.isMenuOpen()) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  }

  onOverlayClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('drawer-overlay')) {
      this.closeDrawer();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeDrawer();
    this.closeMobileSearch();
  }

  /**
   * ✅ Toggle profile dropdown visibility
   */
  toggleProfileDropdown(): void {
    this.showProfileDropdown.update(v => !v);
  }

  /**
   * ✅ Close profile dropdown
   */
  closeProfileDropdown(): void {
    this.showProfileDropdown.set(false);
  }

  /**
   * ✅ Navigate to profile page and close dropdown
   */
  goToProfile(): void {
    this.router.navigate(['/profile']);
    this.closeProfileDropdown();
  }

  /**
   * ✅ Logout user
   */
  logoutUser(): void {
    this.authService.logout();
    this.closeProfileDropdown();
  }

  /**
   * ✅ NEW: Logout handler method
   * Properly handles logout:
   * 1. Calls authService.logout()
   * 2. AuthService handles navigation to /login
   * 3. Clears UI state
   */
  logout(): void {
    console.log('🚪 Logout button clicked');
    
    // Call logout on auth service
    // This handles:
    // - Clearing localStorage
    // - Resetting signals
    // - Navigation to /login
    this.authService.logout();
    
    // Close any open menus/drawers
    this.showUserMenu.set(false);
    this.closeDrawer();
    
    console.log('✅ Logout process initiated');
  }

  /**
   * ✅ Navigate to Sign In page
   * Called when user clicks "Sign In" button
   */
  navigateToSignIn(): void {
    console.log('📍 User clicked Sign In button');
    this.router.navigate(['/login']);
  }

  /**
   * ✅ Toggle marketplace dropdown
   */
  toggleMarketplaceDropdown(): void {
    this.showMarketplaceDropdown.update(v => !v);
    // Close other dropdowns
    this.showNotifications.set(false);
    this.showUserMenu.set(false);
    this.showProfileDropdown.set(false);
  }

  /**
   * ✅ Close marketplace dropdown
   */
  closeMarketplaceDropdown(): void {
    this.showMarketplaceDropdown.set(false);
  }
}
