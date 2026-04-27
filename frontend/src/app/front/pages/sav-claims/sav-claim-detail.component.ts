import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SavClaimService, SavClaim } from '../../core/sav-claim.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';

@Component({
  selector: 'app-sav-claim-detail',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  template: `
    <div class="p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      <!-- Back Button -->
      <button (click)="goBack()" class="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-secondary hover:text-primary transition-colors">
        <span class="text-lg">←</span>
        <span>Back to My Claims</span>
      </button>

      @if (isLoading()) {
        <div class="flex justify-center py-12">
          <app-loading-spinner></app-loading-spinner>
        </div>
      } @else if (claim()) {
        <div class="space-y-6">
          
          <!-- Header -->
          <div class="bg-white rounded-3xl shadow-soft border border-gray-100 p-8">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h1 class="text-3xl font-black text-dark tracking-tight">Return Request Details</h1>
                <p class="text-secondary font-medium mt-1">{{ claim()!.reason }}</p>
              </div>
              <span [ngClass]="getStatusBadgeClass(claim()!.status)" class="px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider w-fit">
                {{ claim()!.status }}
              </span>
            </div>
          </div>

          <!-- Timeline -->
          <div class="bg-white rounded-3xl shadow-soft border border-gray-100 p-8">
            <h3 class="text-sm font-black text-dark uppercase tracking-wider mb-6">Status Timeline</h3>
            <div class="space-y-4">
              @for (step of getTimeline(); track step.status) {
                <div class="flex gap-4">
                  <div class="flex flex-col items-center">
                    <div [ngClass]="step.active ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'" 
                         class="w-10 h-10 rounded-full flex items-center justify-center font-bold">
                      {{ step.icon }}
                    </div>
                    @if (!$last) {
                      <div class="w-1 h-8 bg-gray-200 mt-2"></div>
                    }
                  </div>
                  <div class="pt-1">
                    <p class="font-bold text-dark">{{ step.label }}</p>
                    <p class="text-xs text-secondary">{{ step.description }}</p>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Claim Details -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <!-- Left Column -->
            <div class="space-y-6">
              
              <!-- Message -->
              <div class="bg-white rounded-3xl shadow-soft border border-gray-100 p-6">
                <h3 class="text-sm font-black text-dark uppercase tracking-wider mb-4">Your Message</h3>
                <p class="text-dark font-medium leading-relaxed">{{ claim()!.message }}</p>
              </div>

              <!-- Details -->
              <div class="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 space-y-4">
                <h3 class="text-sm font-black text-dark uppercase tracking-wider">Details</h3>
                
                <div>
                  <p class="text-xs font-black text-secondary uppercase tracking-widest">Reason</p>
                  <p class="text-dark font-medium">{{ claim()!.reason }}</p>
                </div>
                
                <div>
                  <p class="text-xs font-black text-secondary uppercase tracking-widest">Problem Nature</p>
                  <p class="text-dark font-medium">{{ claim()!.problemNature }}</p>
                </div>
                
                <div>
                  <p class="text-xs font-black text-secondary uppercase tracking-widest">Desired Solution</p>
                  <p class="text-dark font-medium">{{ claim()!.desiredSolution }}</p>
                </div>

                @if (claim()!.priority) {
                  <div>
                    <p class="text-xs font-black text-secondary uppercase tracking-widest">Priority</p>
                    <p class="text-dark font-medium">{{ claim()!.priority }}</p>
                  </div>
                }

                <div>
                  <p class="text-xs font-black text-secondary uppercase tracking-widest">Submitted</p>
                  <p class="text-dark font-medium">{{ claim()!.creationDate | date: 'medium' }}</p>
                </div>
              </div>
            </div>

            <!-- Right Column -->
            <div class="space-y-6">
              
              <!-- Images -->
              @if (claim()!.imageUrls && claim()!.imageUrls!.length > 0) {
                <div class="bg-white rounded-3xl shadow-soft border border-gray-100 p-6">
                  <h3 class="text-sm font-black text-dark uppercase tracking-wider mb-4">Uploaded Images</h3>
                  <div class="grid grid-cols-2 gap-4">
                    @for (image of claim()!.imageUrls; track image) {
                      <img [src]="image" alt="Product image" class="w-full h-32 object-cover rounded-lg">
                    }
                  </div>
                </div>
              }

              <!-- Admin Response -->
              @if (claim()!.adminResponse) {
                <div class="bg-primary/5 border border-primary/20 rounded-3xl p-6">
                  <h3 class="text-sm font-black text-primary uppercase tracking-wider mb-4">Admin Response</h3>
                  <p class="text-dark font-medium leading-relaxed">{{ claim()!.adminResponse }}</p>
                </div>
              } @else {
                <div class="bg-gray-50 border border-gray-200 rounded-3xl p-6 text-center">
                  <p class="text-secondary font-medium">An admin has not replied yet.</p>
                </div>
              }

              <!-- AI Verification -->
              @if (claim()!.aiSimilarityScore !== null && claim()!.aiSimilarityScore !== undefined) {
                <div class="bg-white rounded-3xl shadow-soft border border-gray-100 p-6">
                  <h3 class="text-sm font-black text-dark uppercase tracking-wider mb-4">Visual Verification</h3>
                  
                  <div class="space-y-3">
                    <div>
                      <p class="text-xs font-black text-secondary uppercase tracking-widest mb-1">Similarity Score</p>
                      <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-primary h-2 rounded-full" [style.width.%]="claim()!.aiSimilarityScore"></div>
                      </div>
                      <p class="text-sm font-bold text-dark mt-1">{{ claim()!.aiSimilarityScore }}%</p>
                    </div>

                    <div>
                      <p class="text-xs font-black text-secondary uppercase tracking-widest mb-1">Decision</p>
                      <span [ngClass]="getAiDecisionClass(claim()!.aiDecision)" class="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider inline-block">
                        {{ claim()!.aiDecision }}
                      </span>
                    </div>

                    @if (claim()!.aiRecommendation) {
                      <div>
                        <p class="text-xs font-black text-secondary uppercase tracking-widest mb-1">Recommendation</p>
                        <p class="text-sm text-dark">{{ claim()!.aiRecommendation }}</p>
                      </div>
                    }
                  </div>
                </div>
              } @else {
                <div class="bg-gray-50 border border-gray-200 rounded-3xl p-6 text-center">
                  <p class="text-secondary font-medium">Visual verification will be processed when AI analysis becomes available.</p>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class SavClaimDetailComponent implements OnInit {
  private savService = inject(SavClaimService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  claim = signal<SavClaim | null>(null);
  isLoading = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadClaim(id);
    }
  }

  loadClaim(id: string): void {
    this.isLoading.set(true);
    this.savService.getMySavClaimById(id).subscribe({
      next: (data) => {
        this.claim.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading claim:', err);
        this.isLoading.set(false);
      }
    });
  }

  getTimeline() {
    const statuses = ['PENDING', 'INVESTIGATING', 'RESOLVED', 'REJECTED'];
    const currentStatus = this.claim()?.status || 'PENDING';
    const currentIndex = statuses.indexOf(currentStatus);

    return [
      {
        status: 'PENDING',
        label: 'Submitted',
        description: 'Your request has been submitted',
        icon: '📝',
        active: currentIndex >= 0
      },
      {
        status: 'INVESTIGATING',
        label: 'Under Investigation',
        description: 'We are reviewing your request',
        icon: '🔍',
        active: currentIndex >= 1
      },
      {
        status: 'RESOLVED',
        label: 'Resolved',
        description: 'Your request has been resolved',
        icon: '✓',
        active: currentIndex >= 2
      }
    ];
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

  getAiDecisionClass(decision?: string): string {
    switch (decision) {
      case 'MATCH':
        return 'bg-green-100 text-green-700';
      case 'UNCERTAIN':
        return 'bg-orange-100 text-orange-700';
      case 'MISMATCH':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  goBack(): void {
    this.router.navigate(['/sav/claims']);
  }
}