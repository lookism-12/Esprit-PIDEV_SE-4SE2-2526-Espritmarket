import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { ServiceService, Service } from "../../../core/services/service.service";
import { ServiceCard } from "../../shared/components/service-card/service-card";
import { CategoryService, Category } from "../../../core/services/category.service";

@Component({
  selector: "app-marketplace-services",
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ServiceCard],
  templateUrl: "./marketplace-services.html",
  styleUrl: "./marketplace-services.scss",
})
export class MarketplaceServices implements OnInit {
  protected readonly Math = Math;
  private serviceService = inject(ServiceService);
  private categoryService = inject(CategoryService);

  allServices = signal<Service[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  categoriesFromDB = signal<Category[]>([]);
  categories = computed(() => {
    const dbCategories = this.categoriesFromDB().map(c => c.name);
    return ['All', ...dbCategories];
  });
  isLoadingCategories = signal(true);

  searchQuery = signal<string>('');
  selectedCategory = signal<string>('All');
  sortBy = signal<string>('newest');

  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(9);

  filteredServices = computed(() => {
    let filtered = this.allServices();

    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query)
      );
    }

    if (this.selectedCategory() !== 'All') {
      const selectedCatName = this.selectedCategory();
      const selectedCat = this.categoriesFromDB().find(c => c.name === selectedCatName);
      
      filtered = filtered.filter(s => {
        const hasMatchingId = selectedCat && s.categoryId === selectedCat.id;
        return hasMatchingId;
      });
    }

    switch (this.sortBy()) {
      case 'price-low':
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
      case 'newest':
      default:
        break;
    }

    return filtered;
  });

  paginatedServices = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.filteredServices().slice(start, end);
  });

  totalPages = computed(() => Math.ceil(this.filteredServices().length / this.itemsPerPage()));

  ngOnInit(): void {
    this.loadCategories();
    this.loadServices();
  }

  loadCategories(): void {
    console.log('Loading categories for services page...');
    this.isLoadingCategories.set(true);
    
    this.categoryService.getAll().subscribe({
      next: (data) => {
        console.log('Categories loaded:', data.length);
        this.categoriesFromDB.set(data);
        this.isLoadingCategories.set(false);
      },
      error: (err) => {
        console.error('Failed to load categories:', err);
        this.categoriesFromDB.set([]);
        this.isLoadingCategories.set(false);
      }
    });
  }

  loadServices(): void {
    console.log('Loading services for services page...');
    this.isLoading.set(true);
    
    this.serviceService.getAll().subscribe({
      next: (data) => {
        console.log('Services loaded:', data.length);
        
        const sortedServices = [...data].sort((a: any, b: any) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        
        this.allServices.set(sortedServices);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load services:', err);
        this.errorMessage.set('Could not load services. Please try again later.');
        this.isLoading.set(false);
      }
    });
  }

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
    this.currentPage.set(1);
  }

  updateSort(sort: string): void {
    this.sortBy.set(sort);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('All');
    this.sortBy.set('newest');
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
