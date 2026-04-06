import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Report {
  id: string;
  contentId: string;
  contentType: 'post' | 'comment';
  reporterId: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  content?: string;
}

@Component({
  selector: 'app-forum-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <!-- Header -->
      <div class="bg-white p-8 rounded-3xl shadow-soft border border-gray-100">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-black text-dark tracking-tight">Forum Reports</h1>
            <p class="text-secondary font-medium mt-1">Handle user reports and violations</p>
          </div>
          <div class="flex gap-3">
            <select (change)="filterByStatus($event)" 
                    class="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium bg-white">
              <option value="">All Reports</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <select (change)="filterByReason($event)" 
                    class="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium bg-white">
              <option value="">All Reasons</option>
              <option value="spam">Spam</option>
              <option value="harassment">Harassment</option>
              <option value="inappropriate">Inappropriate Content</option>
              <option value="misinformation">Misinformation</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Reports Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-xl">⚠️</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Pending</p>
            <p class="text-2xl font-black text-dark">{{ getPendingCount() }}</p>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-xl">👁️</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Reviewing</p>
            <p class="text-2xl font-black text-dark">{{ getReviewingCount() }}</p>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-xl">✅</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Resolved</p>
            <p class="text-2xl font-black text-dark">{{ getResolvedCount() }}</p>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-xl">📊</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Total</p>
            <p class="text-2xl font-black text-dark">{{ getTotalCount() }}</p>
          </div>
        </div>
      </div>

      <!-- Reports List -->
      <div class="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
        @if (loading()) {
          <div class="flex items-center justify-center py-16">
            <div class="flex flex-col items-center gap-3">
              <div class="w-8 h-8 border-4 border-gray-100 border-t-primary rounded-full animate-spin"></div>
              <p class="text-xs font-black text-secondary uppercase tracking-widest">Loading...</p>
            </div>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50/50">
                  <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Report</th>
                  <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Content</th>
                  <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Reason</th>
                  <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Status</th>
                  <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Reported</th>
                  <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                @for (report of filteredReports(); track report.id) {
                  <tr class="hover:bg-gray-50/50 transition-colors group">
                    <td class="px-6 py-4">
                      <div class="flex items-start gap-3">
                        <div class="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 text-lg">⚠️</div>
                        <div class="min-w-0 flex-1">
                          <p class="font-black text-dark text-sm mb-1">Report #{{ report.id.substring(0, 8) }}</p>
                          <p class="text-secondary text-xs">By: {{ report.reporterId }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2 mb-1">
                        <span [class]="getContentTypeClass(report.contentType)" class="px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">
                          {{ report.contentType }}
                        </span>
                      </div>
                      <p class="text-secondary text-sm">{{ getContentPreview(report.content || 'Content not available') }}</p>
                    </td>
                    <td class="px-6 py-4">
                      <span [class]="getReasonClass(report.reason)" class="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {{ report.reason }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <span [class]="getStatusClass(report.status)" class="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {{ report.status }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-secondary text-sm">{{ formatDate(report.createdAt) }}</td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        @if (report.status === 'pending') {
                          <button (click)="reviewReport(report)" title="Start Review"
                              class="p-2 hover:bg-yellow-50 text-yellow-500 hover:text-yellow-700 rounded-lg transition-colors text-sm">👁️</button>
                        }
                        @if (report.status === 'reviewed') {
                          <button (click)="resolveReport(report)" title="Resolve"
                              class="p-2 hover:bg-green-50 text-green-500 hover:text-green-700 rounded-lg transition-colors text-sm">✅</button>
                          <button (click)="dismissReport(report)" title="Dismiss"
                              class="p-2 hover:bg-gray-50 text-gray-400 hover:text-gray-600 rounded-lg transition-colors text-sm">❌</button>
                        }
                        <button (click)="viewReport(report)" title="View Details"
                            class="p-2 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors text-sm">📋</button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="px-6 py-16 text-center">
                      <div class="flex flex-col items-center gap-4">
                        <span class="text-5xl">📋</span>
                        <p class="text-lg font-black text-dark mb-2">No reports found</p>
                        <p class="text-secondary font-medium">All reports have been handled</p>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Report Details Modal -->
      @if (selectedReport()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="closeModal()">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-8 space-y-6" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-black text-dark">Report Details</h2>
              <button (click)="closeModal()" class="text-secondary hover:text-dark transition-colors text-xl">✕</button>
            </div>
            
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Report ID</label>
                  <div class="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-dark">
                    #{{ selectedReport()?.id?.substring(0, 8) || 'Unknown' }}
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Status</label>
                  <div class="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-dark capitalize">
                    {{ selectedReport()?.status }}
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Reason</label>
                <div class="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-dark capitalize">
                  {{ selectedReport()?.reason }}
                </div>
              </div>
              
              <div>
                <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Description</label>
                <div class="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-dark">
                  {{ selectedReport()?.description || 'No description provided' }}
                </div>
              </div>
              
              <div>
                <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Reported Content</label>
                <div class="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-dark max-h-32 overflow-y-auto">
                  {{ selectedReport()?.content || 'Content not available' }}
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Reporter</label>
                  <div class="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-dark">
                    {{ selectedReport()?.reporterId }}
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Reported</label>
                  <div class="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-dark">
                    {{ formatDate(selectedReport()?.createdAt!) }}
                  </div>
                </div>
              </div>
              
              <div class="flex gap-3 pt-2">
                <button (click)="closeModal()"
                        class="flex-1 py-3 bg-gray-100 text-dark font-black rounded-xl hover:bg-gray-200 transition-all text-sm">
                  Close
                </button>
                @if (selectedReport()?.status === 'pending') {
                  <button (click)="reviewReport(selectedReport()!); closeModal()"
                          class="flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-black rounded-xl transition-all text-sm uppercase tracking-widest">
                    Start Review
                  </button>
                }
                @if (selectedReport()?.status === 'reviewed') {
                  <button (click)="resolveReport(selectedReport()!); closeModal()"
                          class="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-black rounded-xl transition-all text-sm uppercase tracking-widest">
                    Resolve
                  </button>
                  <button (click)="dismissReport(selectedReport()!); closeModal()"
                          class="flex-1 py-3 bg-gray-500 hover:bg-gray-600 text-white font-black rounded-xl transition-all text-sm uppercase tracking-widest">
                    Dismiss
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`.shadow-soft { box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); }`]
})
export class ForumReportsComponent implements OnInit {
  reports = signal<Report[]>([]);
  filteredReports = signal<Report[]>([]);
  loading = signal(true);
  selectedReport = signal<Report | null>(null);
  statusFilter = '';
  reasonFilter = '';

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
    this.loading.set(true);
    
    // Mock data - in a real app, this would come from the backend
    setTimeout(() => {
      const mockReports: Report[] = [
        {
          id: 'rep_001',
          contentId: 'post_123',
          contentType: 'post',
          reporterId: 'user_456',
          reason: 'spam',
          description: 'This post contains spam content and promotional links.',
          status: 'pending',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          content: 'Check out this amazing deal! Click here to get 50% off on everything! Limited time offer!'
        },
        {
          id: 'rep_002',
          contentId: 'comment_789',
          contentType: 'comment',
          reporterId: 'user_321',
          reason: 'harassment',
          description: 'User is being abusive and using inappropriate language.',
          status: 'reviewed',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          reviewedAt: new Date(Date.now() - 86400000).toISOString(),
          reviewedBy: 'admin_001',
          content: 'You are such an idiot! Nobody asked for your opinion!'
        },
        {
          id: 'rep_003',
          contentId: 'post_456',
          contentType: 'post',
          reporterId: 'user_789',
          reason: 'inappropriate',
          description: 'Contains inappropriate content not suitable for the community.',
          status: 'resolved',
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          reviewedAt: new Date(Date.now() - 172800000).toISOString(),
          reviewedBy: 'admin_002',
          content: 'This content has been removed due to community guidelines violation.'
        },
        {
          id: 'rep_004',
          contentId: 'comment_012',
          contentType: 'comment',
          reporterId: 'user_654',
          reason: 'misinformation',
          description: 'Spreading false information about health topics.',
          status: 'dismissed',
          createdAt: new Date(Date.now() - 345600000).toISOString(),
          reviewedAt: new Date(Date.now() - 259200000).toISOString(),
          reviewedBy: 'admin_001',
          content: 'Vaccines cause autism and other health problems. Don\'t trust doctors!'
        }
      ];
      
      this.reports.set(mockReports);
      this.applyFilters();
      this.loading.set(false);
    }, 1000);
  }

  filterByStatus(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.statusFilter = target.value;
    this.applyFilters();
  }

  filterByReason(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.reasonFilter = target.value;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = this.reports();
    
    if (this.statusFilter) {
      filtered = filtered.filter(report => report.status === this.statusFilter);
    }
    
    if (this.reasonFilter) {
      filtered = filtered.filter(report => report.reason === this.reasonFilter);
    }
    
    this.filteredReports.set(filtered);
  }

  getContentPreview(content: string): string {
    return content.length > 60 ? content.substring(0, 60) + '...' : content;
  }

  getContentTypeClass(type: string): string {
    return type === 'post' 
      ? 'bg-blue-100 text-blue-700'
      : 'bg-purple-100 text-purple-700';
  }

  getReasonClass(reason: string): string {
    switch (reason) {
      case 'spam': return 'bg-orange-100 text-orange-700';
      case 'harassment': return 'bg-red-100 text-red-700';
      case 'inappropriate': return 'bg-pink-100 text-pink-700';
      case 'misinformation': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'bg-red-100 text-red-700';
      case 'reviewed': return 'bg-yellow-100 text-yellow-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'dismissed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  getPendingCount(): number {
    return this.reports().filter(report => report.status === 'pending').length;
  }

  getReviewingCount(): number {
    return this.reports().filter(report => report.status === 'reviewed').length;
  }

  getResolvedCount(): number {
    return this.reports().filter(report => report.status === 'resolved').length;
  }

  getTotalCount(): number {
    return this.reports().length;
  }

  viewReport(report: Report) {
    this.selectedReport.set(report);
  }

  closeModal() {
    this.selectedReport.set(null);
  }

  reviewReport(report: Report) {
    // Update report status to reviewed
    const updatedReports = this.reports().map(r => 
      r.id === report.id 
        ? { ...r, status: 'reviewed' as const, reviewedAt: new Date().toISOString(), reviewedBy: 'current_admin' }
        : r
    );
    this.reports.set(updatedReports);
    this.applyFilters();
  }

  resolveReport(report: Report) {
    // Update report status to resolved
    const updatedReports = this.reports().map(r => 
      r.id === report.id 
        ? { ...r, status: 'resolved' as const }
        : r
    );
    this.reports.set(updatedReports);
    this.applyFilters();
  }

  dismissReport(report: Report) {
    // Update report status to dismissed
    const updatedReports = this.reports().map(r => 
      r.id === report.id 
        ? { ...r, status: 'dismissed' as const }
        : r
    );
    this.reports.set(updatedReports);
    this.applyFilters();
  }
}
