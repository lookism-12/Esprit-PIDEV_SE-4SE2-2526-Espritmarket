import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ShopService, ShopDto } from '../../../core/services/shop.service';

export interface Shop extends ShopDto {}

@Component({
  selector: 'app-shops',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './shops.html',
  styleUrl: './shops.scss',
})
export class Shops implements OnInit {
  private router = inject(Router);
  private shopService = inject(ShopService);

  shops = signal<Shop[]>([]);
  isLoading = signal(false);
  searchQuery = signal('');
  sortBy = signal('newest');
  currentPage = signal(1);
  readonly itemsPerPage = 9;

  filteredShops = computed(() => {
    let filtered = this.shops();
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        (s.ownerName && s.ownerName.toLowerCase().includes(query))
      );
    }
    switch (this.sortBy()) {
      case 'name':    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
      case 'products':return [...filtered].sort((a, b) => (b.productCount || 0) - (a.productCount || 0));
      case 'oldest':  return [...filtered].sort((a, b) => new Date(a.createdAt||0).getTime() - new Date(b.createdAt||0).getTime());
      default:        return [...filtered].sort((a, b) => new Date(b.createdAt||0).getTime() - new Date(a.createdAt||0).getTime());
    }
  });

  paginatedShops = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return this.filteredShops().slice(start, start + this.itemsPerPage);
  });

  totalPages = computed(() => Math.ceil(this.filteredShops().length / this.itemsPerPage));
  totalProducts = computed(() => this.shops().reduce((s, sh) => s + (sh.productCount || 0), 0));
  averageProducts = computed(() => this.shops().length ? Math.round(this.totalProducts() / this.shops().length) : 0);

  ngOnInit(): void { this.loadShops(); }

  loadShops(): void {
    this.isLoading.set(true);
    this.shopService.getAll().subscribe({
      next: (shops) => { this.shops.set(shops); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  onSearchChange(): void { this.currentPage.set(1); }
  onSortChange(): void { this.currentPage.set(1); }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getPageNumbers(): number[] {
    const total = this.totalPages(), cur = this.currentPage(), pages: number[] = [];
    for (let i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++) pages.push(i);
    return pages;
  }

  getOwnerInitials(name?: string): string {
    if (!name) return 'SO';
    return name.split(' ').map(p => p[0].toUpperCase()).join('').slice(0, 2);
  }

  goToShopProducts(shop: Shop): void {
    this.router.navigate(['/products'], { queryParams: { shop: shop.id, shopName: shop.name } });
  }
}
