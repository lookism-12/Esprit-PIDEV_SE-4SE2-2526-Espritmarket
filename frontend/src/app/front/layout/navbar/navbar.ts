import { Component, signal, computed, inject, HostListener, OnDestroy } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { UserRole } from '../../models/user.model';
import { CartService } from '../../core/cart.service';
import { NotificationType, NotificationPriority } from '../../models/notification.model';
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
  providerOnly?: boolean;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnDestroy {
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private router = inject(Router);
  private document = inject(DOCUMENT);
  private routerSubscription: Subscription;

  // Dropdowns state
  showNotifications = signal(false);
  showUserMenu = signal(false);
  showMobileMenu = signal(false);
  isMenuOpen = signal(false);
  searchQuery = signal('');
  showProfileDropdown = signal(false);
  
  // Search state
  isSearchFocused = signal(false);
  showMobileSearch = signal(false);
  showSellMenu = signal(false);

  // User profile state (NEW)
  isUserLoggedIn = computed(() => this.authService.isAuthenticated());
  userFullName = computed(() => this.authService.getFullName() || 'User');
  userInitials = computed(() => this.authService.getInitials() || 'U');
  userAvatar = computed(() => this.authService.userAvatar() || null);
  isAdmin = computed(() => this.authService.userRole() === UserRole.ADMIN);
  isProvider = computed(() => this.authService.userRole() === UserRole.PROVIDER);

  // Menu sections for the drawer
  menuSections: MenuSection[] = [
    {
      title: 'Marketplace',
      icon: '🛒',
      items: [
        { label: 'Browse Products', route: '/products', icon: '📦' },
        { label: 'Services', route: '/services', icon: '🔧' },
        { label: 'Promotions', route: '/promotions', icon: '🏷️' },
        { label: 'Favorites', route: '/favorites', icon: '❤️' },
        { label: 'Manage Store', route: '/products/manage', icon: '🏪', providerOnly: true }
      ]
    },
    {
      title: 'Carpooling',
      icon: '🚗',
      items: [
        { label: 'Find a Ride', route: '/carpooling/find', icon: '🔍' },
        { label: 'Offer a Ride', route: '/carpooling/offer', icon: '🚙' },
        { label: 'My Bookings', route: '/carpooling/bookings', icon: '📋' },
        { label: 'My Rides', route: '/carpooling/rides', icon: '🛣️' }
      ]
    },
    {
      title: 'Community',
      icon: '💬',
      items: [
        { label: 'Forum', route: '/forum', icon: '📝' },
        { label: 'Study Groups', route: '/groups', icon: '👥' },
        { label: 'Chat', route: '/chat', icon: '💭' }
      ]
    },
    {
      title: 'Loyalty & Offers',
      icon: '🎁',
      items: [
        { label: 'My Points', route: '/loyalty/points', icon: '⭐' },
        { label: 'Coupons', route: '/coupons', icon: '🎟️' }
      ]
    },
    {
      title: 'Orders & Delivery',
      icon: '📦',
      items: [
        { label: 'My Orders', route: '/orders', icon: '🛍️' },
        { label: 'Track Deliveries', route: '/tracking', icon: '📍' },
        { label: 'My Claims', route: '/claims', icon: '📄' }
      ]
    },
    {
      title: 'Profile & Settings',
      icon: '⚙️',
      items: [
        { label: 'My Profile', route: '/profile', icon: '👤' },
        { label: 'Settings', route: '/settings', icon: '🔧' }
        // ✅ REMOVED: Logout is now a click handler, not a route
      ]
    }
  ];

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

  // ✅ REACTIVE AUTHENTICATION STATE - This makes the navbar dynamic!
  // When user logs in/out, this signal changes and template automatically updates
  isUserAuthenticated = computed(() => this.authService.isAuthenticated());

  // Mock notifications
  notifications = signal<NavNotification[]>([
    {
      id: '1',
      type: NotificationType.ORDER_SHIPPED,
      title: 'Order Shipped',
      message: 'Your order #EM-2024-001 is on its way!',
      priority: NotificationPriority.HIGH,
      isRead: false,
      createdAt: new Date()
    },
    {
      id: '2',
      type: NotificationType.NEW_MESSAGE,
      title: 'New Message',
      message: 'Sarra M. sent you a message',
      priority: NotificationPriority.MEDIUM,
      isRead: false,
      createdAt: new Date(Date.now() - 3600000)
    },
    {
      id: '3',
      type: NotificationType.NEW_COUPON,
      title: 'New Coupon!',
      message: 'Use SPRING20 for 20% off',
      priority: NotificationPriority.LOW,
      isRead: true,
      createdAt: new Date(Date.now() - 86400000)
    }
  ]);

  unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-dropdown') && !target.closest('.notification-trigger')) {
      this.showNotifications.set(false);
    }
    if (!target.closest('.user-menu-dropdown') && !target.closest('.user-menu-trigger')) {
      this.showUserMenu.set(false);
    }
    // Close Profile dropdown when clicking outside
    if (!target.closest('.profile-dropdown') && !target.closest('.profile-avatar-btn')) {
      this.showProfileDropdown.set(false);
    }
    // Close Sell dropdown when clicking outside
    if (!target.closest('.sell-dropdown') && !target.closest('.sell-trigger')) {
      this.showSellMenu.set(false);
    }
  }

  toggleNotifications(): void {
    this.showNotifications.update(v => !v);
    this.showUserMenu.set(false);
  }

  toggleUserMenu(): void {
    this.showUserMenu.update(v => !v);
    this.showNotifications.set(false);
  }

  toggleMobileMenu(): void {
    this.showMobileMenu.update(v => !v);
  }

  markAsRead(id: string): void {
    this.notifications.update(notifications =>
      notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  }

  markAllAsRead(): void {
    this.notifications.update(notifications =>
      notifications.map(n => ({ ...n, isRead: true }))
    );
  }

  getNotificationIcon(type: NotificationType): string {
    const icons: Partial<Record<NotificationType, string>> = {
      [NotificationType.ORDER_SHIPPED]: '🚚',
      [NotificationType.ORDER_DELIVERED]: '📦',
      [NotificationType.NEW_MESSAGE]: '💬',
      [NotificationType.NEW_COUPON]: '🎁',
      [NotificationType.PAYMENT_RECEIVED]: '💰',
      [NotificationType.NEW_REVIEW]: '⭐'
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
}
