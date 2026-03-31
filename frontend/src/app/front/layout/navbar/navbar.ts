import { Component, signal, computed, inject, HostListener, OnDestroy } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { UserRole } from '../../models/user.model';
import { CartService } from '../../core/cart.service';
import { NotificationService } from '../../core/notification.service';
import { NotificationType } from '../../models/notification.model';
import { filter, Subscription } from 'rxjs';

interface NavNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  read: boolean;
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
export class Navbar implements OnDestroy {
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private notificationService = inject(NotificationService);
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

  // User profile state (NEW)
  isUserLoggedIn = computed(() => this.authService.isAuthenticated());
  userFullName = computed(() => this.authService.getFullName() || 'User');
  userInitials = computed(() => this.authService.getInitials() || 'U');
  userAvatar = computed(() => this.authService.userAvatar() || null);
  isAdmin = computed(() => this.authService.userRole() === UserRole.ADMIN);

  // Menu sections for the drawer
  menuSections: MenuSection[] = [
    {
      title: 'Marketplace',
      icon: '🛒',
      items: [
        { label: 'Browse Products', route: '/products', icon: '📦' },
        { label: 'Services', route: '/services', icon: '🔧' },
        { label: 'Promotions', route: '/promotions', icon: '🏷️' },
        { label: 'Favorites', route: '/favorites', icon: '❤️' }
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

    if (this.authService.isAuthenticated()) {
      this.loadNotifications();
    }
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  // Mock cart count
  cartCount = computed(() => this.cartService.itemCount());

  // ✅ REACTIVE AUTHENTICATION STATE - This makes the navbar dynamic!
  // When user logs in/out, this signal changes and template automatically updates
  isUserAuthenticated = computed(() => this.authService.isAuthenticated());

  notifications = signal<NavNotification[]>([]);

  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

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
  }

  toggleNotifications(): void {
    if (this.authService.isAuthenticated() && this.notifications().length === 0) {
      this.loadNotifications();
    }
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
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        this.notifications.update(notifications =>
          notifications.map(n => n.id === id ? { ...n, read: true } : n)
        );
      },
      error: (err) => console.error('Failed to mark notification as read', err)
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update(notifications =>
          notifications.map(n => ({ ...n, read: true }))
        );
      },
      error: (err) => console.error('Failed to mark all notifications as read', err)
    });
  }

  getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.INTERNAL_NOTIFICATION: return '🔔';
      case NotificationType.EXTERNAL_NOTIFICATION: return '📢';
      case NotificationType.RIDE_UPDATE: return '🚗';
      default: return '🔔';
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
    this.notifications.set([]);
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
    this.notifications.set([]);
    
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

  private loadNotifications(): void {
    this.notificationService.getNotifications().subscribe({
      next: (res) => {
        const normalized: NavNotification[] = (res.notifications ?? []).map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          description: n.description ?? n.message,
          read: n.read,
          createdAt: new Date(n.createdAt)
        }));
        this.notifications.set(normalized);
      },
      error: (err) => console.error('Failed to load navbar notifications', err)
    });
  }
}
