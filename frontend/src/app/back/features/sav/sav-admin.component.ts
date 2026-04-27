import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { SavAdminService, SavClaim } from '../../core/services/sav-admin.service';
import { LoadingSpinnerComponent } from '../../../front/shared/components/loading-spinner.component';

@Component({
  selector: 'app-sav-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LoadingSpinnerComponent],
  template: `
    <div class="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">

      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl shadow-soft border border-gray-100">
        <div>
          <h1 class="text-3xl font-black text-dark tracking-tight">After-Sales Service</h1>
          <p class="text-secondary font-medium mt-1">Manage return requests, customer claims and AI visual verification</p>
        </div>
        <button (click)="loadClaims()" class="px-6 py-3 bg-gray-50 hover:bg-gray-100 text-dark font-black rounded-xl transition-all uppercase tracking-widest text-[10px] border border-gray-100">
          🔄 Refresh
        </button>
      </div>

      <!-- KPIs -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-xl">⏳</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Pending</p>
            <p class="text-2xl font-black text-dark">{{ getPendingCount() }}</p>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-xl">🔍</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Investigating</p>
            <p class="text-2xl font-black text-dark">{{ getInvestigatingCount() }}</p>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-xl">✓</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Resolved</p>
            <p class="text-2xl font-black text-dark">{{ getResolvedCount() }}</p>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-xl">✕</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Rejected</p>
            <p class="text-2xl font-black text-dark">{{ getRejectedCount() }}</p>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-xl">🤖</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">AI Uncertain</p>
            <p class="text-2xl font-black text-dark">{{ getAiUncertainCount() }}</p>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-xl">📬</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Unread</p>
            <p class="text-2xl font-black text-dark">{{ getUnreadCount() }}</p>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 space-y-4">
        <h3 class="text-sm font-black text-dark uppercase tracking-wider">Filters</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-2">Status</label>
            <select (change)="filterByStatus($event)" class="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium bg-white">
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-2">Priority</label>
            <select (change)="filterByPriority($event)" class="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium bg-white">
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-2">AI Decision</label>
            <select (change)="filterByAiDecision($event)" class="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium bg-white">
              <option value="">All Decisions</option>
              <option value="MATCH">Match</option>
              <option value="UNCERTAIN">Uncertain</option>
              <option value="MISMATCH">Mismatch</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-2">Search</label>
            <input type="text" placeholder="Search by message, reason..." (keyup)="searchClaims($event)"
              class="w-full px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium">
          </div>
        </div>

        <div class="flex gap-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" (change)="toggleUnreadOnly($event)" class="w-4 h-4">
            <span class="text-sm font-medium text-dark">Unread Only</span>
          </label>
        </div>
      </div>

      <!-- Claims Table -->
      <div class="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/50">
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Claim</th>
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Client</th>
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Reason</th>
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Status</th>
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Priority</th>
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">AI</th>
                <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @if (isLoading()) {
                <tr><td colspan="7" class="px-6 py-16 text-center">
                  <app-loading-spinner></app-loading-spinner>
                </td></tr>
              } @else if (filteredClaims().length === 0) {
                <tr><td colspan="7" class="px-6 py-16 text-center">
                  <span class="text-5xl mb-4 block">📭</span>
                  <p class="text-lg font-black text-dark">No claims found</p>
                </td></tr>
              } @else {
                @for (claim of filteredClaims(); track claim.id) {
                  <tr class="hover:bg-gray-50/50 transition-colors group">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2">
                        @if (!claim.readByAdmin) {
                          <span class="w-2 h-2 bg-primary rounded-full"></span>
                        }
                        <div>
                          <p class="font-black text-dark text-sm">{{ claim.reason }}</p>
                          <p class="text-[10px] text-secondary truncate max-w-[200px]">{{ claim.message }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <p class="text-sm font-medium text-dark">{{ claim.userId || 'N/A' }}</p>
                    </td>
                    <td class="px-6 py-4">
                      <p class="text-sm font-medium text-dark">{{ claim.problemNature }}</p>
                    </td>
                    <td class="px-6 py-4">
                      <span [ngClass]="getStatusBadgeClass(claim.status)" class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {{ claim.status }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <span [ngClass]="getPriorityBadgeClass(claim.priority)" class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {{ claim.priority || 'N/A' }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      @if (claim.aiDecision) {
                        <span [ngClass]="getAiDecisionClass(claim.aiDecision)" class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                          {{ claim.aiDecision }}
                        </span>
                      } @else {
                        <span class="text-[10px] text-secondary">—</span>
                      }
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button (click)="viewDetails(claim)" title="View"
                          class="p-2 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors text-sm">👁️</button>
                        <button (click)="editClaim(claim)" title="Edit"
                          class="p-2 hover:bg-green-50 text-green-400 hover:text-green-600 rounded-lg transition-colors text-sm">✏️</button>
                        <button (click)="deleteClaim(claim.id!)" title="Delete"
                          class="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors text-sm">🗑️</button>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    @if (selectedClaim()) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" (click)="closeModal()">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 space-y-6 my-8" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-black text-dark">Claim Details</h2>
            <button (click)="closeModal()" class="text-secondary hover:text-dark transition-colors text-xl">✕</button>
          </div>

          <div class="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <p class="text-xs font-black text-secondary uppercase tracking-widest">Message</p>
              <p class="text-dark font-medium">{{ selectedClaim()!.message }}</p>
            </div>

            <div>
              <p class="text-xs font-black text-secondary uppercase tracking-widest">Reason</p>
              <p class="text-dark font-medium">{{ selectedClaim()!.reason }}</p>
            </div>

            <div>
              <p class="text-xs font-black text-secondary uppercase tracking-widest">Problem Nature</p>
              <p class="text-dark font-medium">{{ selectedClaim()!.problemNature }}</p>
            </div>

            <div>
              <p class="text-xs font-black text-secondary uppercase tracking-widest">Desired Solution</p>
              <p class="text-dark font-medium">{{ selectedClaim()!.desiredSolution }}</p>
            </div>

            @if (selectedClaim()!.imageUrls && selectedClaim()!.imageUrls!.length > 0) {
              <div>
                <p class="text-xs font-black text-secondary uppercase tracking-widest mb-2">Images</p>
                <div class="grid grid-cols-3 gap-2">
                  @for (image of selectedClaim()!.imageUrls; track image) {
                    <img [src]="image" alt="Product" class="w-full h-20 object-cover rounded-lg">
                  }
                </div>
              </div>
            }
          </div>

          <!-- Admin Response Form -->
          <div class="space-y-4 border-t border-gray-200 pt-4">
            <div>
              <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-2">Admin Response</label>
              <textarea [(ngModel)]="adminResponse" rows="3" placeholder="Type your response..."
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium resize-none"></textarea>
            </div>

            <div>
              <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-2">Status</label>
              <select [(ngModel)]="newStatus" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium bg-white">
                <option value="PENDING">Pending</option>
                <option value="INVESTIGATING">Investigating</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-4 border-t border-gray-200">
            <button (click)="saveChanges()" class="flex-1 py-3 bg-primary text-white font-black rounded-xl hover:bg-primary/90 transition-all text-sm uppercase tracking-widest">
              Save Changes
            </button>
            <button (click)="closeModal()" class="px-6 py-3 bg-gray-100 text-dark font-black rounded-xl hover:bg-gray-200 transition-all text-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .shadow-soft { box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); }
  `]
})
export class SavAdminComponent implements OnInit {
  private savAdminService = inject(SavAdminService);

  claims = signal<SavClaim[]>([]);
  filteredClaims = signal<SavClaim[]>([]);
  selectedClaim = signal<SavClaim | null>(null);
  isLoading = signal(false);
  
  adminResponse = '';
  newStatus = 'PENDING';
  
  currentFilters = {
    status: '',
    priority: '',
    aiDecision: '',
    searchText: '',
    unreadOnly: false
  };

  ngOnInit(): void {
    this.loadClaims();
  }

  loadClaims(): void {
    this.isLoading.set(true);
    this.savAdminService.getAllSavClaims().subscribe({
      next: (data) => {
        this.claims.set(data);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading claims:', err);
        this.isLoading.set(false);
      }
    });
  }

  filterByStatus(event: any): void {
    this.currentFilters.status = event.target.value;
    this.applyFilters();
  }

  filterByPriority(event: any): void {
    this.currentFilters.priority = event.target.value;
    this.applyFilters();
  }

  filterByAiDecision(event: any): void {
    this.currentFilters.aiDecision = event.target.value;
    this.applyFilters();
  }

  searchClaims(event: any): void {
    this.currentFilters.searchText = event.target.value.toLowerCase();
    this.applyFilters();
  }

  toggleUnreadOnly(event: any): void {
    this.currentFilters.unreadOnly = event.target.checked;
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = this.claims();

    if (this.currentFilters.status) {
      filtered = filtered.filter(c => c.status === this.currentFilters.status);
    }

    if (this.currentFilters.priority) {
      filtered = filtered.filter(c => c.priority === this.currentFilters.priority);
    }

    if (this.currentFilters.aiDecision) {
      filtered = filtered.filter(c => c.aiDecision === this.currentFilters.aiDecision);
    }

    if (this.currentFilters.searchText) {
      filtered = filtered.filter(c =>
        c.message?.toLowerCase().includes(this.currentFilters.searchText) ||
        c.reason?.toLowerCase().includes(this.currentFilters.searchText)
      );
    }

    if (this.currentFilters.unreadOnly) {
      filtered = filtered.filter(c => !c.readByAdmin);
    }

    this.filteredClaims.set(filtered);
  }

  viewDetails(claim: SavClaim): void {
    this.selectedClaim.set(claim);
    this.adminResponse = claim.adminResponse || '';
    this.newStatus = claim.status || 'PENDING';
  }

  editClaim(claim: SavClaim): void {
    this.viewDetails(claim);
  }

  deleteClaim(id: string): void {
    if (confirm('Are you sure you want to delete this claim?')) {
      this.savAdminService.deleteClaim(id).subscribe({
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

  saveChanges(): void {
    const claim = this.selectedClaim();
    if (!claim || !claim.id) return;

    // Update status
    if (this.newStatus !== claim.status) {
      this.savAdminService.updateClaimStatus(claim.id, this.newStatus).subscribe({
        next: () => {
          // Update response if changed
          if (this.adminResponse !== claim.adminResponse) {
            this.savAdminService.sendAdminResponse(claim.id!, this.adminResponse).subscribe({
              next: () => {
                this.loadClaims();
                this.closeModal();
              }
            });
          } else {
            this.loadClaims();
            this.closeModal();
          }
        }
      });
    } else if (this.adminResponse !== claim.adminResponse) {
      this.savAdminService.sendAdminResponse(claim.id, this.adminResponse).subscribe({
        next: () => {
          this.loadClaims();
          this.closeModal();
        }
      });
    } else {
      this.closeModal();
    }
  }

  closeModal(): void {
    this.selectedClaim.set(null);
  }

  getPendingCount(): number {
    return this.claims().filter(c => c.status === 'PENDING').length;
  }

  getInvestigatingCount(): number {
    return this.claims().filter(c => c.status === 'INVESTIGATING').length;
  }

  getResolvedCount(): number {
    return this.claims().filter(c => c.status === 'RESOLVED').length;
  }

  getRejectedCount(): number {
    return this.claims().filter(c => c.status === 'REJECTED').length;
  }

  getAiUncertainCount(): number {
    return this.claims().filter(c => c.aiDecision === 'UNCERTAIN').length;
  }

  getUnreadCount(): number {
    return this.claims().filter(c => !c.readByAdmin).length;
  }

  getStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'INVESTIGATING': return 'bg-blue-100 text-blue-700';
      case 'RESOLVED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  getPriorityBadgeClass(priority?: string): string {
    switch (priority) {
      case 'LOW': return 'bg-green-100 text-green-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'URGENT': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  getAiDecisionClass(decision?: string): string {
    switch (decision) {
      case 'MATCH': return 'bg-green-100 text-green-700';
      case 'UNCERTAIN': return 'bg-orange-100 text-orange-700';
      case 'MISMATCH': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}