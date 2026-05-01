import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ServiceService, ServiceDto, ServiceAvailabilityDTO, TimeRangeDTO } from '../../../core/services/service.service';
import { CategoryService } from '../../core/shop.service';
import { ShopService } from '../../core/shop.service';
import { ProductCategory } from '../../models/product';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-add-service',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-service.html',
  styleUrl: './add-service.scss'
})
export class AddService implements OnInit {
  private serviceService = inject(ServiceService);
  private categoryService = inject(CategoryService);
  private shopService = inject(ShopService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  // Categories from backend
  categories = signal<ProductCategory[]>([]);
  isLoadingCategories = signal<boolean>(false);

  // Form state
  serviceName = signal<string>('');
  description = signal<string>('');
  price = signal<number>(0);
  durationMinutes = signal<number>(60);
  selectedCategoryIds = signal<string[]>([]);
  
  // Availability configuration
  selectedDays = signal<string[]>([]);
  timeRanges = signal<TimeRangeDTO[]>([{ startTime: '09:00', endTime: '17:00', availableMode: 'BOTH' }]);
  breaks = signal<TimeRangeDTO[]>([]);
  
  // Shop ID
  shopId = signal<string>('');

  // UI State
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Days of week
  readonly daysOfWeek = [
    { value: 'MONDAY', label: 'Monday' },
    { value: 'TUESDAY', label: 'Tuesday' },
    { value: 'WEDNESDAY', label: 'Wednesday' },
    { value: 'THURSDAY', label: 'Thursday' },
    { value: 'FRIDAY', label: 'Friday' },
    { value: 'SATURDAY', label: 'Saturday' },
    { value: 'SUNDAY', label: 'Sunday' }
  ];

  ngOnInit(): void {
    this.loadCategories();
    this.loadUserShop();
  }

  loadCategories(): void {
    this.isLoadingCategories.set(true);
    this.errorMessage.set('');
    
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.isLoadingCategories.set(false);
        
        if (categories.length === 0) {
          this.errorMessage.set('No categories available. Please contact an administrator.');
        }
      },
      error: (err) => {
        console.error('Failed to load categories:', err);
        this.errorMessage.set('Failed to load categories. Please try again.');
        this.isLoadingCategories.set(false);
      }
    });
  }

  loadUserShop(): void {
    this.shopService.getMyShop().subscribe({
      next: (shop) => {
        if (shop && shop.id) {
          this.shopId.set(shop.id);
        } else {
          this.errorMessage.set('Your provider account does not have a shop.');
        }
      },
      error: (error) => {
        console.error('Failed to load user shop:', error);
        this.errorMessage.set('Failed to load shop information.');
      }
    });
  }

  toggleCategory(categoryId: string): void {
    const current = this.selectedCategoryIds();
    if (current.includes(categoryId)) {
      this.selectedCategoryIds.set(current.filter(id => id !== categoryId));
    } else {
      this.selectedCategoryIds.set([...current, categoryId]);
    }
  }

  isCategorySelected(categoryId: string): boolean {
    return this.selectedCategoryIds().includes(categoryId);
  }

  toggleDay(day: string): void {
    const current = this.selectedDays();
    if (current.includes(day)) {
      this.selectedDays.set(current.filter(d => d !== day));
    } else {
      this.selectedDays.set([...current, day]);
    }
  }

  isDaySelected(day: string): boolean {
    return this.selectedDays().includes(day);
  }

  addTimeRange(): void {
    this.timeRanges.update(ranges => [...ranges, { startTime: '09:00', endTime: '17:00', availableMode: 'BOTH' }]);
  }

  removeTimeRange(index: number): void {
    this.timeRanges.update(ranges => ranges.filter((_, i) => i !== index));
  }

  addBreak(): void {
    this.breaks.update(breaks => [...breaks, { startTime: '12:00', endTime: '13:00' }]);
  }

  removeBreak(index: number): void {
    this.breaks.update(breaks => breaks.filter((_, i) => i !== index));
  }

  validateForm(): boolean {
    this.errorMessage.set('');

    if (!this.serviceName().trim()) {
      this.errorMessage.set('Service name is required');
      return false;
    }

    if (!this.description().trim()) {
      this.errorMessage.set('Description is required');
      return false;
    }

    if (this.price() <= 0) {
      this.errorMessage.set('Price must be greater than 0');
      return false;
    }

    if (this.durationMinutes() <= 0) {
      this.errorMessage.set('Duration must be greater than 0');
      return false;
    }

    if (this.selectedCategoryIds().length === 0) {
      this.errorMessage.set('You must select at least one category');
      return false;
    }

    if (this.selectedDays().length === 0) {
      this.errorMessage.set('You must select at least one working day');
      return false;
    }

    if (!this.shopId()) {
      this.errorMessage.set('Shop ID is missing. Please contact support.');
      return false;
    }

    return true;
  }

  createService(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const availability: ServiceAvailabilityDTO = {
      workingDays: this.selectedDays(),
      timeRanges: this.timeRanges(),
      breaks: this.breaks()
    };

    const serviceData: Partial<ServiceDto> = {
      name: this.serviceName().trim(),
      description: this.description().trim(),
      shopId: this.shopId(),
      categoryIds: this.selectedCategoryIds(),
      price: this.price(),
      durationMinutes: this.durationMinutes(),
      availability: availability
    };

    console.log('Creating service with data:', serviceData);

    this.serviceService.create(serviceData).subscribe({
      next: (createdService) => {
        console.log('Service created successfully:', createdService);
        this.toastService.success('Service created successfully!');
        this.isSubmitting.set(false);
        this.router.navigate(['/provider-dashboard']);
      },
      error: (err) => {
        console.error('Failed to create service:', err);
        
        let errorMsg = 'Failed to create service. ';
        if (err.status === 400) {
          errorMsg = err.error?.message || 'Please check all fields are valid.';
        } else if (err.status === 403) {
          errorMsg = 'Access denied. Please ensure you are logged in as a PROVIDER.';
        } else {
          errorMsg += err.error?.message || 'Unknown error occurred.';
        }
        
        this.errorMessage.set(errorMsg);
        this.isSubmitting.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/provider-dashboard']);
  }
}
