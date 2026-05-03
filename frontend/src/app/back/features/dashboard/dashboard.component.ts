import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AdminAuthService } from '../../core/services/admin-auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgFor, RouterLink],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private adminAuth = inject(AdminAuthService);

  isLoading = signal(true);
  adminName = computed(() => { const u = this.adminAuth.currentUser(); return u ? (u.firstName + ' ' + u.lastName).trim() : 'Admin'; });
  totalUsers = signal(0);
  totalProducts = signal(0);
  pendingProducts = signal(0);
  approvedProducts = signal(0);
  rejectedProducts = signal(0);
  totalPosts = signal(0);
  pendingPostsCount = signal(0);
  totalOrders = signal(0);
  totalShops = signal(0);
  totalFavorites = signal(0);
  totalBookings = signal(0);
  pendingBookings = signal(0);
  totalRides = signal(0);
  totalNegotiations = signal(0);
  pendingNegotiations = signal(0);
  activeRides = signal(0);
  mongoStats = signal<Record<string, number>>({});
  recentBookings = signal<any[]>([]);
  recentUsers = signal<any[]>([]);
  recentProducts = signal<any[]>([]);
  selectedCollection = signal<string | null>(null);
  collectionData = signal<any[]>([]);
  isBrowsingData = signal(false);
  currentDate = signal(new Date());
  calendarMonthYear = computed(() => this.currentDate().toLocaleString('default', { month: 'long', year: 'numeric' }));
  calendarDays = computed(() => {
    const d = this.currentDate(), year = d.getFullYear(), month = d.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const days: { day: number; currentMonth: boolean; isToday: boolean }[] = [];
    const prevLast = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) days.push({ day: prevLast - i, currentMonth: false, isToday: false });
    for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, currentMonth: true, isToday: today.getFullYear() === year && today.getMonth() === month && today.getDate() === i });
    for (let i = 1; days.length < 35; i++) days.push({ day: i, currentMonth: false, isToday: false });
    return days;
  });
  quickActions = [
    { title: 'Manage Users', desc: 'View and moderate users', icon: '👥', route: '/admin/users', bg: 'bg-blue-50' },
    { title: 'Review Products', desc: 'Approve pending listings', icon: '📦', route: '/admin/marketplace/products', bg: 'bg-green-50' },
    { title: 'Service Bookings', desc: 'Manage appointments', icon: '📅', route: '/admin/services/bookings', bg: 'bg-purple-50' },
    { title: 'Content Moderation', desc: 'Review forum content', icon: '🛡️', route: '/admin/moderation', bg: 'bg-red-50' },
    { title: 'SAV & Deliveries', desc: 'Manage support tickets', icon: '🎧', route: '/admin/sav', bg: 'bg-orange-50' }
  ];
  ngOnInit(): void {
    forkJoin({
      users: this.http.get<any[]>('/api/users').pipe(catchError((err) => { console.error('❌ Failed to load users:', err); return of([]); })),
      products: this.http.get<any[]>('/api/products/all').pipe(catchError((err) => { console.error('❌ Failed to load products:', err); return of([]); })),
      posts: this.http.get<any[]>('/api/forum/posts').pipe(catchError((err) => { console.error('❌ Failed to load posts:', err); return of([]); })),
      orders: this.http.get<any[]>('/api/orders').pipe(catchError((err) => { console.error('❌ Failed to load orders:', err); return of([]); })),
      shops: this.http.get<any[]>('/api/shops').pipe(catchError((err) => { console.error('❌ Failed to load shops:', err); return of([]); })),
      favorites: this.http.get<any[]>('/api/admin/favoris').pipe(catchError(() => of([]))),
      bookings: this.http.get<any[]>('/api/service-bookings/admin/all').pipe(catchError(() => of([]))),
      rides: this.http.get<any[]>('/api/rides').pipe(catchError(() => of([]))),
      negotiations: this.http.get<any>('/api/negotiations/admin/all?page=0&size=1000').pipe(catchError(() => of({ content: [] }))),
      mongo: this.http.get<Record<string, number>>('/api/admin/mongodb/stats').pipe(catchError(() => of({})))
    }).subscribe(({ users, products, posts, orders, shops, favorites, bookings, rides, negotiations, mongo }) => {
      // ✅ SAFETY: Ensure all responses are arrays
      const safeUsers = Array.isArray(users) ? users : [];
      const safeProducts = Array.isArray(products) ? products : [];
      const safePosts = Array.isArray(posts) ? posts : [];
      const safeOrders = Array.isArray(orders) ? orders : [];
      const safeShops = Array.isArray(shops) ? shops : [];
      const safeFavorites = Array.isArray(favorites) ? favorites : [];
      const safeBookings = Array.isArray(bookings) ? bookings : [];
      const safeMongo = mongo || {};

      // ✅ NEW: Count favorites per product
      const favoritesCountMap = new Map<string, number>();
      safeFavorites.forEach((fav: any) => {
        if (fav.productId) {
          const count = favoritesCountMap.get(fav.productId) || 0;
          favoritesCountMap.set(fav.productId, count + 1);
        }
      });

      // ✅ NEW: Add favoriteCount to each product
      const productsWithFavorites = safeProducts.map((p: any) => ({
        ...p,
        favoriteCount: favoritesCountMap.get(p.id) || 0
      }));

      // ✅ NEW: Sort products by favoriteCount (most liked first)
      const sortedProducts = [...productsWithFavorites].sort((a, b) => b.favoriteCount - a.favoriteCount);

      const safeRides = Array.isArray(rides) ? rides : [];
      const negList = negotiations?.content || [];
      
      this.totalUsers.set(safeUsers.length);
      this.totalProducts.set(safeProducts.length);
      this.pendingProducts.set(safeProducts.filter((p: any) => p.status === 'PENDING').length);
      this.approvedProducts.set(safeProducts.filter((p: any) => p.status === 'APPROVED').length);
      this.rejectedProducts.set(safeProducts.filter((p: any) => p.status === 'REJECTED').length);
      this.totalPosts.set(safePosts.length);
      this.pendingPostsCount.set(safePosts.filter((p: any) => !p.approved).length);
      this.totalOrders.set(safeOrders.length);
      this.totalShops.set(safeShops.length);
      this.totalFavorites.set(safeFavorites.length);
      this.totalBookings.set(safeBookings.length);
      this.pendingBookings.set(safeBookings.filter((b: any) => b.status === 'PENDING').length);
      
      this.totalRides.set(safeRides.length);
      this.activeRides.set(safeRides.filter((r: any) => r.status === 'IN_PROGRESS' || r.status === 'ACCEPTED').length);
      this.totalNegotiations.set(negList.length);
      this.pendingNegotiations.set(negList.filter((n: any) => n.status === 'PENDING' || n.status === 'IN_PROGRESS').length);
      this.mongoStats.set(safeMongo);

      this.recentUsers.set([...safeUsers].reverse().slice(0, 5));
      this.recentBookings.set([...safeBookings].reverse().slice(0, 5));
      // ✅ MODIFIED: Show pending products sorted by favorites, or top 4 most liked if no pending
      const pendingProductsSorted = sortedProducts.filter((p: any) => p.status === 'PENDING');
      this.recentProducts.set(
        pendingProductsSorted.length > 0 
          ? pendingProductsSorted.slice(0, 4)
          : sortedProducts.slice(0, 4)
      );
      this.isLoading.set(false);
    });
  }
  load(): void { this.ngOnInit(); }

  viewCollection(name: string): void {
    this.selectedCollection.set(name);
    this.isBrowsingData.set(true);
    this.http.get<any[]>(`/api/admin/mongodb/collection/${name}`).subscribe({
      next: (data) => this.collectionData.set(data),
      error: () => alert('Failed to fetch collection data.')
    });
  }

  closeInspector(): void {
    this.isBrowsingData.set(false);
    this.selectedCollection.set(null);
    this.collectionData.set([]);
  }

  exportSystemData(): void {
    const confirmExport = confirm('This will retrieve and download all project data from MongoDB. Continue?');
    if (!confirmExport) return;

    this.http.get('/api/admin/mongodb/export').subscribe({
      next: (data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `espritmarket_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => alert('Failed to export data. Ensure you have admin privileges.')
    });
  }
  prevMonth(): void { this.currentDate.update(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)); }
  nextMonth(): void { this.currentDate.update(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)); }
  getCurrentDate(): string { return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); }
  getGreeting(): string { const h = new Date().getHours(); if (h < 12) return 'Good morning'; if (h < 18) return 'Good afternoon'; return 'Good evening'; }
  getApprovalRate(): number { const t = this.totalProducts(); return t ? Math.round((this.approvedProducts() / t) * 100) : 0; }
  getPendingRate(): number { const t = this.totalProducts(); return t ? Math.round((this.pendingProducts() / t) * 100) : 0; }
  getPostApprovalRate(): number { const t = this.totalPosts(); if (!t) return 0; return Math.round(((t - this.pendingPostsCount()) / t) * 100); }
  getShopRate(): number { return Math.min(100, this.totalShops() * 10); }
  getBarHeight(value: number, max: number): number { if (!max) return 8; return Math.max(8, (value / max) * 100); }
  getCircleDash(pct: number): string { const r = 32, circ = 2 * Math.PI * r; return (pct / 100) * circ + ' ' + circ; }
  getStatusClass(status: string): string {
    const m: Record<string, string> = { PENDING: 'bg-amber-100 text-amber-700', APPROVED: 'bg-green-100 text-green-700', REJECTED: 'bg-red-100 text-red-700', SUSPENDED: 'bg-gray-100 text-gray-600' };
    return m[status] || 'bg-gray-100 text-gray-600';
  }
  
  getBookingStatusClass(status: string): string {
    const m: Record<string, string> = { 
      PENDING: 'bg-amber-100 text-amber-700', 
      CONFIRMED: 'bg-green-100 text-green-700', 
      REJECTED: 'bg-red-100 text-red-700', 
      CANCELLED: 'bg-gray-100 text-gray-600',
      COMPLETED: 'bg-blue-100 text-blue-700',
      NO_SHOW: 'bg-orange-100 text-orange-700'
    };
    return m[status] || 'bg-gray-100 text-gray-600';
  }
}