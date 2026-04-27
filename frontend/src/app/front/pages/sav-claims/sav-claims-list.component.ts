import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SavClaimService, SavClaim } from '../../core/sav-claim.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';

@Component({
  selector: 'app-sav-claims-list',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  template: `
    <div class="p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-black text-dark tracking-tight">My Return Requests</h1>
          <p class="text-secondary font-medium mt-1">Track your return requests and customer claims</p>
        </div>
        <button (click)="navigateToCreate()" 
                class="px-6 py-3 bg-primary text-white font-black rounded-xl hover:bg-primary/90 transition-all uppercase tracking-widest text-[10px]">
          + Create Return Request
        </button>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex justify-center py-12">
          <app-loading-spinner></app-loading-spinner>
        </div>
      } @else if (claims().length === 0) {
        <!-- Empty State -->
        <div class="bg-white rounded-3xl shadow-soft border border-gray-100 p-12 text-center">
          <span class="text-6xl mb-4 block">📦</span>
          <h2 class="text-xl font-black text-dark mb-2">No Return Requests Yet</h2>
          <p class="text-secondary font-medium mb-6">You haven't submitted any return requests yet.</p>
          <button (click)="navigateToCreate()" 
                  class="px-6 py-3 bg-primary text-white font-black rounded-xl hover:bg-primary/90 transition-all">
            Create Your First Return Request
          </button>
        </div>
      } @else {
        <!-- Claims List -->
        <div class="space-y-4">
          @for (claim of claims(); track claim.id) {
            <div class="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 hover:shadow-md transition-all">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                <!-- Claim Info -->
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <h3 class="font-black text-dark text-lg">{{ claim.reason }}</h3>
                    <span [ngClass]="getStatusBadgeClass(claim.status)" class="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                      {{ claim.status }}
                    </span>
                  </div>
                  
                  <p class="text-secondary text-sm mb-2 line-clamp-2">{{ claim.message }}</p>
                  
                  <div class="flex flex-wrap gap-4 text-xs text-secondary">
                    <span>📅 {{ claim.creationDate | date: 'short' }}</span>
                    <span>🎯 {{ claim.desiredSolution }}</span>
                    @if (claim.priority) {
                      <span>⚡ {{ claim.priority }}</span>
                    }
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex gap-2">
                  <button (click)="viewDetails(claim.id!)" 
                          class="px-4 py-2 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition-all text-sm">
                    View Details
                  </button>
                  
                  @if (claim.status === 'PENDING') {
                    <button (click)="editClaim(claim.id!)" 
                            class="px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 transition-all text-sm">
                      Edit
                    </button>
                    <button (click)="deleteClaim(claim.id!)" 
                            class="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-all text-sm">
                      Delete
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class SavClaimsListComponent implements OnInit {
  private savService = inject(SavClaimService);
  private router = inject(Router);

  claims = signal<SavClaim[]>([]);
  isLoading = signal(false);

  ngOnInit(): void {
    this.loadClaims();
  }

  loadClaims(): void {
    this.isLoading.set(true);
    this.savService.getMySavClaims().subscribe({
      next: (data) => {
        this.claims.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading SAV claims:', err);
        this.isLoading.set(false);
      }
    });
  }

  navigateToCreate(): void {
    this.router.navigate(['/sav/claims/create']);
  }

  viewDetails(id: string): void {
    this.router.navigate(['/sav/claims', id]);
  }

  editClaim(id: string): void {
    this.router.navigate(['/sav/claims', id, 'edit']);
  }

  deleteClaim(id: string): void {
    if (confirm('Are you sure you want to delete this return request?')) {
      this.savService.deleteMySavClaim(id).subscribe({
        next: () => {
          this.loadClaims();
        },
        error: (err) => {
          console.error('Error deleting claim:', err);
          alert('Failed to delete claim');
        }
      });
    }
  }

  getStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'INVESTIGATING':
        return 'bg-blue-100 text-blue-700';
      case 'RESOLVED':
        return 'bg-green-100 text-green-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }
}