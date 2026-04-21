import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ServiceService, Service } from '../../../core/services/service.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-service-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './service-details.html',
  styleUrl: './service-details.scss',
})
export class ServiceDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private serviceService = inject(ServiceService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  service = signal<Service | null>(null);
  isLoading = signal(true);
  serviceNotFound = signal(false);

  safeService = computed(() => this.service() || {} as Service);
  hasService = computed(() => this.service() !== null);

  relatedServices = signal<Service[]>([]);

  ngOnInit(): void {
    const serviceId = this.route.snapshot.paramMap.get('id');
    if (serviceId) {
      this.loadService(serviceId);
    }
  }

  private loadService(id: string): void {
    console.log('🔍 Loading service:', id);
    this.isLoading.set(true);
    this.serviceNotFound.set(false);
    
    this.serviceService.getById(id).subscribe({
      next: (data) => {
        console.log('✅ Service loaded:', data);
        this.service.set(data);
        this.loadRelatedServices(data.categoryIds);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Failed to load service:', err);
        this.toastService.error('Failed to load service details');
        this.serviceNotFound.set(true);
        this.isLoading.set(false);
      }
    });
  }

  private loadRelatedServices(categoryIds: string[] | undefined): void {
    if (!categoryIds || categoryIds.length === 0) return;

    this.serviceService.getAll().subscribe({
      next: (services) => {
        const related = services
          .filter(s => 
            s.id !== this.service()?.id && 
            s.categoryIds?.some(catId => categoryIds.includes(catId))
          )
          .slice(0, 3);
        
        this.relatedServices.set(related);
      },
      error: (err) => {
        console.error('❌ Failed to load related services:', err);
      }
    });
  }

  contactProvider(): void {
    const service = this.service();
    if (!service) return;
    
    if (!this.authService.isAuthenticated()) {
      this.toastService.info('Please login to contact the provider');
      this.router.navigate(['/login']);
      return;
    }
    
    this.toastService.success('Contact feature coming soon!');
  }

  bookService(): void {
    const service = this.service();
    if (!service) return;
    
    if (!this.authService.isAuthenticated()) {
      this.toastService.info('Please login to book this service');
      this.router.navigate(['/login']);
      return;
    }
    
    this.toastService.success('Booking feature coming soon!');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}
