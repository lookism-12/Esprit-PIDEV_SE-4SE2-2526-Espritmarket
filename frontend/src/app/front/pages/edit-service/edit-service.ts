import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ServiceService, ServiceDto, ServiceAvailabilityDTO, TimeRangeDTO } from '../../../core/services/service.service';
import { CategoryService } from '../../core/shop.service';
import { ProductCategory } from '../../models/product';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-edit-service',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-service.html',
  styleUrl: './edit-service.scss'
})
export class EditService implements OnInit {
  private serviceService = inject(ServiceService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  // Service ID
  serviceId = signal<string>('');
  
  // Categories from backend
  categories = signal<ProductCategory[]>([]);
  isLoadingCategories = signal<boolean>(false);
  isLoadingService = signal<boolean>(false);

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
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.serviceId.set(id);
      this.loadService(id);
    } else {
      this.errorMessage.set('Service ID is missing');
    }
    this.loadCategories();
  }

  loadService(id: string): void {
    this.isLoadingService.set(true);
    this.serviceService.getById(id).subscribe({
      next: (service) => {
        this.serviceName.set(service.name);
        this.description.set(service.description);
        this.price.set(service.price);
        this.durationMinutes.set(service.durationMinutes || 60);
        this.selectedCategoryIds.set(service.categoryIds || []);
        
        if (service.availability) {
          this.selectedDays.set(service.availability.workingDays || []);
          this.timeRanges.set((service.availability.timeRanges || [{ startTime: '09:00', endTime: '17:00', availableMode: 'BOTH' }])
            .map(range => ({ ...range, availableMode: range.availableMode || 'BOTH' })));
          this.breaks.set(service.availability.breaks || []);
        }
        
        this.isLoadingService.set(false);
      },
      error: (err) => {
        console.error('Failed to load service:', err);
        this.errorMessage.set('Failed to load service. Please try again.');
        this.isLoadingService.set(false);
      }
    });
  }

  loadCategories(): void {
    this.isLoadingCategories.set(true);
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.isLoadingCategories.set(false);
      },
      error: (err) => {
        console.error('Failed to load categories:', err);
        this.isLoadingCategories.set(false);
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

    return true;
  }

  updateService(): void {
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
      categoryIds: this.selectedCategoryIds(),
      price: this.price(),
      durationMinutes: this.durationMinutes(),
      availability: availability
    };

    console.log('Updating service with data:', serviceData);

    this.serviceService.update(this.serviceId(), serviceData).subscribe({
      next: (updatedService) => {
        console.log('Service updated successfully:', updatedService);
        this.toastService.success('Service updated successfully!');
        this.isSubmitting.set(false);
        this.router.navigate(['/provider-dashboard']);
      },
      error: (err) => {
        console.error('Failed to update service:', err);
        
        let errorMsg = 'Failed to update service. ';
        if (err.status === 400) {
          errorMsg = err.error?.message || 'Please check all fields are valid.';
        } else if (err.status === 403) {
          errorMsg = 'Access denied. You do not have permission to edit this service.';
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
