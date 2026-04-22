import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../core/auth.service';
import { OrderService } from '../../core/order.service';
import { UserService } from '../../core/user.service';
import { LoyaltyService } from '../../core/loyalty.service';
import { NotificationService } from '../../core/notification.service';
import { NegotiationService } from '../../core/negotiation.service';
import { CarpoolingService } from '../../core/carpooling.service';
import { SavService } from '../../../back/core/services/sav.service';
import { FavoriteService } from '../../core/favorite.service';
import { UserRole } from '../../models/user.model';
import { LoyaltyLevel, LoyaltyAccount, PointsTransaction, PointsTransactionType, LOYALTY_LEVELS } from '../../models/loyalty.model';
import { OrderResponse } from '../../models/order.model';

type ProfileTab = 'orders' | 'loyalty' | 'preferences' | 'settings' | 'deliveries';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private userService = inject(UserService);
  private loyaltyService = inject(LoyaltyService);
  private notificationService = inject(NotificationService);
  private negotiationService = inject(NegotiationService);
  private carpoolingService = inject(CarpoolingService);
  private savService = inject(SavService);
  private favoriteService = inject(FavoriteService);

  // ── Auth ──────────────────────────────────────────────────────────────────
  user = computed(() => ({
    id: this.authService.userId() || '',
    firstName: this.authService.userFirstName() || 'User',
    lastName: this.authService.userLastName() || '',
    email: this.authService.userEmail() || '',
    phone: '—',
    avatarUrl: this.authService.userAvatar() || '',
    isVerified: true,
    role: this.authService.userRole() || UserRole.CLIENT
  }));

  readonly UserRole = UserRole;
  role = computed(() => this.authService.userRole());
  isClient    = computed(() => {
    const r = this.role();
    return r === UserRole.CLIENT || (!r) ||
      (r !== UserRole.DRIVER && r !== UserRole.PASSENGER &&
       r !== UserRole.PROVIDER && r !== UserRole.SELLER &&
       r !== UserRole.DELIVERY && r !== UserRole.ADMIN);
  });
  isDriver    = computed(() => this.role() === UserRole.DRIVER);
  isPassenger = computed(() => this.role() === UserRole.PASSENGER);
  isProvider  = computed(() => {
    const r = this.role();
    return r === UserRole.PROVIDER || r === UserRole.SELLER || (r as string) === 'SELLER' || (r as string) === 'PROVIDER';
  });
  isDelivery  = computed(() => this.role() === UserRole.DELIVERY);

  // ── Tabs ──────────────────────────────────────────────────────────────────
  // Removed activeTab signal - using router instead

  // ── Modals ────────────────────────────────────────────────────────────────
  showEditModal     = signal(false);
  showAvatarModal   = signal(false);
  showPasswordModal = signal(false);
  isSaving          = signal(false);
  isEditing         = signal(false);
  profileForm!: FormGroup;
  preferencesForm!: FormGroup;

  // ── Common data ───────────────────────────────────────────────────────────
  realOrders      = signal<OrderResponse[]>([]);
  notifications   = signal<any[]>([]);
  loyaltyAccount  = signal<LoyaltyAccount | null>(null);
  pointsHistory   = signal<PointsTransaction[]>([]);
  isLoading       = signal(false);

  // ── CLIENT specific ───────────────────────────────────────────────────────
  favoriteCount   = computed(() => this.favoriteService.favoriteCount());
  unreadNotifCount = computed(() => this.notifications().filter(n => !n.read).length);

  // ── DRIVER specific ───────────────────────────────────────────────────────
  myRides         = signal<any[]>([]);
  driverStats     = signal<any | null>(null);
  pendingBookings = signal<any[]>([]);

  // ── PASSENGER specific ────────────────────────────────────────────────────
  passengerDashboard = signal<any | null>(null);

  // ── PROVIDER specific ─────────────────────────────────────────────────────
  myNegotiations  = signal<any[]>([]);
  shopOrders      = signal<OrderResponse[]>([]);

  // ── DELIVERY specific ─────────────────────────────────────────────────────
  myDeliveries    = signal<any[]>([]);

  // ── Preferences ───────────────────────────────────────────────────────────
  preferences = signal({
    academicInterests: ['Software Engineering', 'Data Science'],
    preferredCategories: ['Electronics', 'Books'],
    notifications: { email: true, push: true, sms: false },
    theme: 'light' as 'light' | 'dark' | 'system'
  });
  availableInterests  = ['Software Engineering', 'Data Science', 'Mobile Development', 'Web Development', 'AI/ML', 'Cybersecurity', 'DevOps', 'Cloud Computing'];
  availableCategories = ['Electronics', 'Books', 'Gaming', 'Furniture', 'Services', 'Sports', 'Clothing'];

  loyaltyProgress = computed(() => {
    const account = this.loyaltyAccount();
    if (!account) return 0;
    const cur = LOYALTY_LEVELS.find(l => l.level === account.level);
    const next = LOYALTY_LEVELS.find(l => l.minPoints > (cur?.minPoints || 0));
    if (!cur || !next) return 100;
    return Math.min(100, Math.max(0, ((account.lifetimePoints - cur.minPoints) / (next.minPoints - cur.minPoints)) * 100));
  });

  ngOnInit(): void {
    // Check if driver and trying to access orders or root profile
    setTimeout(() => {
      if (this.isDelivery() && (this.router.url === '/profile' || this.router.url.includes('/profile/orders'))) {
        this.router.navigate(['/profile/deliveries']);
      }
    }, 500);

    this.initForms();
    this.loadCommon();
    this.loadRoleSpecific();
  }

  private initForms(): void {
    this.profileForm = this.fb.group({
      firstName: [this.user().firstName, [Validators.required, Validators.minLength(2)]],
      lastName:  [this.user().lastName,  [Validators.required, Validators.minLength(2)]],
      email:     [this.user().email,     [Validators.required, Validators.email]],
      phone:     ['', [Validators.pattern(/^[0-9]{8,15}$/)]]
    });
    this.preferencesForm = this.fb.group({
      emailNotifications: [true],
      pushNotifications:  [true],
      smsNotifications:   [false],
      theme:              ['light']
    });
  }

  private loadCommon(): void {
    this.isLoading.set(true);
    forkJoin({
      orders:  this.orderService.getMyOrders().pipe(catchError(() => of([]))),
      notifs:  this.notificationService.getMy().pipe(catchError(() => of([]))),
      loyalty: this.loyaltyService.getAccount().pipe(catchError(() => of(null)))
    }).subscribe(({ orders, notifs, loyalty }) => {
      this.realOrders.set(orders as OrderResponse[]);
      this.notifications.set(notifs as any[]);
      if (loyalty) this.loyaltyAccount.set(loyalty as LoyaltyAccount);
      this.isLoading.set(false);
    });
    this.favoriteService.loadMyFavorites();
  }

  private loadRoleSpecific(): void {
    // Wait for auth to be ready — role might be null on first render
    const role = this.authService.userRole();
    if (!role) {
      // Retry after auth loads
      setTimeout(() => this.loadRoleSpecific(), 500);
      return;
    }
    if (role === UserRole.DRIVER) {
      forkJoin({
        rides:    this.carpoolingService.getMyRides().pipe(catchError(() => of([]))),
        stats:    this.carpoolingService.getMyDriverStats().pipe(catchError(() => of(null))),
        bookings: this.carpoolingService.getAvailableRideRequests().pipe(catchError(() => of([])))
      }).subscribe(({ rides, stats, bookings }) => {
        this.myRides.set(rides as any[]);
        this.driverStats.set(stats);
        this.pendingBookings.set(bookings as any[]);
      });
    } else if (role === UserRole.PASSENGER) {
      this.carpoolingService.getPassengerDashboard().pipe(catchError(() => of(null))).subscribe(d => {
        this.passengerDashboard.set(d);
      });
    } else if (role === UserRole.PROVIDER || role === UserRole.SELLER || (role as string) === 'SELLER') {
      forkJoin({
        negs: this.negotiationService.getProviderNegotiations().pipe(catchError(() => of([]))),
        orders: this.orderService.getMyOrders().pipe(catchError(() => of([])))
      }).subscribe(({ negs, orders }) => {
        this.myNegotiations.set(negs as any[]);
        this.shopOrders.set(orders as OrderResponse[]);
      });
    } else if (role === UserRole.DELIVERY) {
      const userId = this.authService.getUserId();
      if (userId) {
        this.savService.getDeliveriesByUser(userId).pipe(catchError(() => of([]))).subscribe(d => {
          this.myDeliveries.set(d as any[]);
        });
      }
    }
  }

  // ── Tab helpers ───────────────────────────────────────────────────────────
  get tabs() {
    if (this.isDelivery()) {
      return [
        { id: 'deliveries'  as ProfileTab, label: '🚚 Driver Hub', route: '/profile/deliveries' },
        { id: 'loyalty'     as ProfileTab, label: '🏆 Loyalty', route: '/profile/loyalty' },
        { id: 'preferences' as ProfileTab, label: '⚙️ Preferences', route: '/profile/preferences' },
        { id: 'settings'    as ProfileTab, label: '👤 Settings', route: '/profile/settings' }
      ];
    }
    // Remove Dashboard tab for clients
    return [
      { id: 'orders'      as ProfileTab, label: '🛍️ Orders', route: '/profile/orders' },
      { id: 'loyalty'     as ProfileTab, label: '🏆 Loyalty', route: '/profile/loyalty' },
      { id: 'preferences' as ProfileTab, label: '⚙️ Preferences', route: '/profile/preferences' },
      { id: 'settings'    as ProfileTab, label: '👤 Settings', route: '/profile/settings' }
    ];
  }

  // ── Profile edit ──────────────────────────────────────────────────────────
  startEditing():          void { this.showEditModal.set(true); }
  onEditProfileClose():    void { this.showEditModal.set(false); }
  onProfileSave():         void { this.showEditModal.set(false); }
  openAvatarUpload():      void { this.showAvatarModal.set(true); }
  onAvatarUploadClose():   void { this.showAvatarModal.set(false); }
  onAvatarUploadComplete(url: string): void { this.authService.userAvatar.set(url); this.showAvatarModal.set(false); }
  openPasswordChange():    void { this.showPasswordModal.set(true); }
  onPasswordChangeClose(): void { this.showPasswordModal.set(false); }
  onPasswordChangeComplete(): void { this.showPasswordModal.set(false); }

  saveProfile(): void {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    this.isSaving.set(true);
    this.userService.updateProfile(this.profileForm.value).subscribe({
      next: (u: any) => { this.authService.userFirstName.set(u.firstName); this.authService.userLastName.set(u.lastName); this.isSaving.set(false); this.isEditing.set(false); },
      error: () => this.isSaving.set(false)
    });
  }

  cancelEditing(): void { this.isEditing.set(false); }

  savePreferences(): void {
    const v = this.preferencesForm.value;
    this.preferences.update(p => ({ ...p, notifications: { email: v.emailNotifications, push: v.pushNotifications, sms: v.smsNotifications }, theme: v.theme }));
  }

  toggleInterest(i: string): void { this.preferences.update(p => ({ ...p, academicInterests: p.academicInterests.includes(i) ? p.academicInterests.filter(x => x !== i) : [...p.academicInterests, i] })); }
  toggleCategory(c: string): void { this.preferences.update(p => ({ ...p, preferredCategories: p.preferredCategories.includes(c) ? p.preferredCategories.filter(x => x !== c) : [...p.preferredCategories, c] })); }

  // ── Order actions ─────────────────────────────────────────────────────────
  /**
   * Cancel order - ONLY if status = PENDING
   * Backend will set status to CANCELLED and restore stock
   */
  cancelOrder(orderId: string): void {
    const order = this.realOrders().find(o => o.id === orderId);
    if (!order) {
      alert('Order not found');
      return;
    }
    
    // ✅ CRITICAL: Check if order can be cancelled (ONLY PENDING)
    if (order.status !== 'PENDING') {
      alert(`Cannot cancel order with status: ${order.status}. Only PENDING orders can be cancelled.`);
      return;
    }
    
    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason || reason.trim() === '') {
      return;
    }
    
    if (!confirm(`Cancel order ${order.orderNumber}?\n\nThis will:\n• Set order status to CANCELLED\n• Restore product stock\n• Deduct loyalty points if applicable\n\nThis action cannot be undone.`)) {
      return;
    }
    
    this.orderService.cancelOrder(orderId, reason).subscribe({
      next: (refundSummary) => {
        console.log('✅ Order cancelled:', refundSummary);
        // Refresh orders list
        this.loadCommon();
        alert(`Order cancelled successfully!\n\nOrder: ${order.orderNumber}\nRefund Amount: $${refundSummary.refundedAmount.toFixed(2)}\nStock has been restored.`);
      },
      error: (error) => {
        console.error('❌ Failed to cancel order:', error);
        const errorMsg = error.error?.message || 'Failed to cancel order. Please try again.';
        alert(`Error: ${errorMsg}`);
      }
    });
  }

  // ── Driver actions ────────────────────────────────────────────────────────
  cancelRide(rideId: string): void {
    if (!confirm('Cancel this ride?')) return;
    this.carpoolingService.cancelRide(rideId).subscribe({
      next: () => this.myRides.update(list => list.filter(r => r.rideId !== rideId)),
      error: () => {}
    });
  }

  // ── Negotiation actions ───────────────────────────────────────────────────
  acceptNeg(id: string): void {
    this.negotiationService.acceptNegotiation(id).subscribe({
      next: (u: any) => this.myNegotiations.update(list => list.map(n => n.id === id ? { ...n, status: u.status } : n)),
      error: () => {}
    });
  }

  rejectNeg(id: string): void {
    this.negotiationService.rejectNegotiation(id).subscribe({
      next: (u: any) => this.myNegotiations.update(list => list.map(n => n.id === id ? { ...n, status: u.status } : n)),
      error: () => {}
    });
  }

  // ── Delivery actions ──────────────────────────────────────────────────────
  advanceDelivery(delivery: any): void {
    const next: Record<string, string> = { PREPARING: 'IN_TRANSIT', IN_TRANSIT: 'DELIVERED' };
    const newStatus = next[delivery.status];
    if (!newStatus) return;
    this.savService.updateDeliveryStatus(delivery.id, newStatus as any).subscribe({
      next: (u: any) => this.myDeliveries.update(list => list.map(d => d.id === delivery.id ? u : d)),
      error: () => {}
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  isValidImageUrl(url: string): boolean { return !!url && (url.startsWith('http') || url.includes('/') || url.startsWith('data:')); }
  onAvatarLoadError(): void {}
  onAvatarLoadSuccess(): void {}

  getStatusClass(status: string): string {
    const m: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800', CONFIRMED: 'bg-blue-100 text-blue-800',
      PROCESSING: 'bg-indigo-100 text-indigo-800', SHIPPED: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800', COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800', DRAFT: 'bg-gray-100 text-gray-700',
      ACCEPTED: 'bg-green-100 text-green-700', REJECTED: 'bg-red-100 text-red-700',
      IN_TRANSIT: 'bg-blue-100 text-blue-700', PREPARING: 'bg-amber-100 text-amber-700',
      RETURNED: 'bg-red-100 text-red-700'
    };
    return m[status] || 'bg-gray-100 text-gray-700';
  }

  getLevelBadgeClass(level: string): string {
    const m: Record<string, string> = { BRONZE: 'bg-amber-100 text-amber-700 border-amber-200', SILVER: 'bg-gray-200 text-gray-700 border-gray-300', GOLD: 'bg-yellow-100 text-yellow-700 border-yellow-200', PLATINUM: 'bg-purple-100 text-purple-700 border-purple-200' };
    return m[level] || 'bg-gray-100 text-gray-600 border-gray-200';
  }

  getLevelIcon(level: string): string {
    const m: Record<string, string> = { BRONZE: '🥉', SILVER: '🥈', GOLD: '🥇', PLATINUM: '💎' };
    return m[level] || '⭐';
  }

  getTransactionClass(type: PointsTransactionType): string {
    return type === PointsTransactionType.EARNED || type === PointsTransactionType.BONUS ? 'text-green-600' : 'text-red-600';
  }

  isFieldInvalid(f: string): boolean { const c = this.profileForm.get(f); return !!(c && c.invalid && (c.dirty || c.touched)); }
  getFieldError(f: string): string {
    const e = this.profileForm.get(f)?.errors;
    if (!e) return '';
    if (e['required']) return 'Required'; if (e['email']) return 'Invalid email'; if (e['minlength']) return 'Too short'; if (e['pattern']) return 'Invalid format';
    return '';
  }

  formatDate(d: string): string { if (!d) return '—'; return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
}
