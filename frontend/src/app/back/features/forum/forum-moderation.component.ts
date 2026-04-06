import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminForumService, Post, Comment } from '../../core/services/admin-forum.service';

interface ModerationItem {
  id: string;
  type: 'post' | 'comment';
  content: string;
  userId: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reportCount?: number;
}

@Component({
  selector: 'app-forum-moderation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <!-- Header -->
      <div class="bg-white p-8 rounded-3xl shadow-soft border border-gray-100">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-black text-dark tracking-tight">Forum Moderation</h1>
            <p class="text-secondary font-medium mt-1">Review and moderate forum content</p>
          </div>
          <div class="flex gap-3">
            <select (change)="filterByStatus($event)" 
                    class="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium bg-white">
              <option value="">All Items</option>
              <option value="pending">Pending Review</option>
              <option value="reported">Reported Content</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select (change)="filterByType($event)" 
                    class="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium bg-white">
              <option value="">All Types</option>
              <option value="post">Posts</option>
              <option value="comment">Comments</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Moderation Queue Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-xl">⏳</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Pending</p>
            <p class="text-2xl font-black text-dark">{{ getPendingCount() }}</p>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-xl">⚠️</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Reported</p>
            <p class="text-2xl font-black text-dark">{{ getReportedCount() }}</p>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-xl">✅</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Approved</p>
            <p class="text-2xl font-black text-dark">{{ getApprovedCount() }}</p>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-xl">🛡️</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Actions</p>
            <p class="text-2xl font-black text-dark">{{ getTotalActions() }}</p>
          </div>
        </div>
      </div>

      <!-- Moderation Queue -->
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
                  <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Content</th>
                  <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Type</th>
                  <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Status</th>
                  <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Reports</th>
                  <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Created</th>
                  <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                @for (item of filteredItems(); track item.id) {
                  <tr class="hover:bg-gray-50/50 transition-colors group">
                    <td class="px-6 py-4">
                      <div class="flex items-start gap-3">
                        <div [class]="getTypeIconClass(item.type)" class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg">
                          {{ getTypeIcon(item.type) }}
                        </div>
                        <div class="min-w-0 flex-1">
                          <p class="font-black text-dark text-sm mb-1">{{ getContentPreview(item.content) }}</p>
                          <p class="text-secondary text-xs">User ID: {{ item.userId }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span [class]="getTypeClass(item.type)" class="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {{ item.type }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <span [class]="getStatusClass(item.status)" class="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {{ item.status }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      @if (item.reportCount && item.reportCount > 0) {
                        <span class="bg-red-100 text-red-700 px-2 py-1 rounded-lg text-[10px] font-black">
                          {{ item.reportCount }} reports
                        </span>
                      } @else {
                        <span class="text-secondary text-xs">No reports</span>
                      }
                    </td>
                    <td class="px-6 py-4 text-secondary text-sm">{{ formatDate(item.createdAt) }}</td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        @if (item.status === 'pending') {
                          <button (click)="approveItem(item)" title="Approve"
                              class="p-2 hover:bg-green-50 text-green-500 hover:text-green-700 rounded-lg transition-colors text-sm">✅</button>
                          <button (click)="rejectItem(item)" title="Reject"
                              class="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors text-sm">❌</button>
                        }
                        <button (click)="viewItem(item)" title="View"
                            class="p-2 hover:bg-gray-50 text-gray-400 hover:text-gray-600 rounded-lg transition-colors text-sm">👁️</button>
                        <button (click)="deleteItem(item)" title="Delete"
                            class="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors text-sm">🗑️</button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="px-6 py-16 text-center">
                      <div class="flex flex-col items-center gap-4">
                        <span class="text-5xl">🛡️</span>
                        <p class="text-lg font-black text-dark mb-2">No items in moderation queue</p>
                        <p class="text-secondary font-medium">All content has been reviewed</p>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Item Details Modal -->
      @if (selectedItem()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="closeModal()">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-8 space-y-6" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-black text-dark">Content Details</h2>
              <button (click)="closeModal()" class="text-secondary hover:text-dark transition-colors text-xl">✕</button>
            </div>
            
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Content</label>
                <div class="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-dark max-h-40 overflow-y-auto">
                  {{ selectedItem()?.content }}
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Type</label>
                  <div class="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-dark capitalize">
                    {{ selectedItem()?.type }}
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Status</label>
                  <div class="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-dark capitalize">
                    {{ selectedItem()?.status }}
                  </div>
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">User ID</label>
                  <div class="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-dark">
                    {{ selectedItem()?.userId }}
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Created</label>
                  <div class="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-dark">
                    {{ formatDate(selectedItem()?.createdAt || '') }}
                  </div>
                </div>
              </div>
              
              @if (selectedItem()?.reportCount && selectedItem()!.reportCount! > 0) {
                <div>
                  <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Reports</label>
                  <div class="px-4 py-3 bg-red-50 border-2 border-red-200 rounded-xl text-sm text-red-700">
                    {{ selectedItem()?.reportCount }} user reports received
                  </div>
                </div>
              }
              
              <div class="flex gap-3 pt-2">
                <button (click)="closeModal()"
                        class="flex-1 py-3 bg-gray-100 text-dark font-black rounded-xl hover:bg-gray-200 transition-all text-sm">
                  Close
                </button>
                @if (selectedItem()?.status === 'pending') {
                  <button (click)="approveItem(selectedItem()!); closeModal()"
                          class="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-black rounded-xl transition-all text-sm uppercase tracking-widest">
                    Approve
                  </button>
                  <button (click)="rejectItem(selectedItem()!); closeModal()"
                          class="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl transition-all text-sm uppercase tracking-widest">
                    Reject
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
export class ForumModerationComponent implements OnInit {
  private forumService = inject(AdminForumService);
  
  moderationItems = signal<ModerationItem[]>([]);
  filteredItems = signal<ModerationItem[]>([]);
  loading = signal(true);
  selectedItem = signal<ModerationItem | null>(null);
  statusFilter = '';
  typeFilter = '';

  ngOnInit() {
    this.loadModerationData();
  }

  loadModerationData() {
    this.loading.set(true);
    Promise.all([
      this.forumService.getPosts().toPromise(),
      this.forumService.getComments().toPromise()
    ]).then(([posts, comments]) => {
      const items: ModerationItem[] = [];
      
      // Convert posts to moderation items
      (posts || []).forEach(post => {
        items.push({
          id: post.id!,
          type: 'post',
          content: post.content,
          userId: post.userId,
          createdAt: post.createdAt!,
          status: post.approved ? 'approved' : 'pending',
          reportCount: Math.floor(Math.random() * 5) // Mock report count
        });
      });
      
      // Convert comments to moderation items
      (comments || []).forEach(comment => {
        items.push({
          id: comment.id!,
          type: 'comment',
          content: comment.content,
          userId: comment.userId,
          createdAt: comment.createdAt!,
          status: 'approved', // Comments don't have approval status in the current model
          reportCount: Math.floor(Math.random() * 3) // Mock report count
        });
      });
      
      this.moderationItems.set(items);
      this.applyFilters();
      this.loading.set(false);
    }).catch(error => {
      console.error('Error loading moderation data:', error);
      this.loading.set(false);
    });
  }

  filterByStatus(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.statusFilter = target.value;
    this.applyFilters();
  }

  filterByType(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.typeFilter = target.value;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = this.moderationItems();
    
    if (this.statusFilter) {
      if (this.statusFilter === 'reported') {
        filtered = filtered.filter(item => (item.reportCount || 0) > 0);
      } else {
        filtered = filtered.filter(item => item.status === this.statusFilter);
      }
    }
    
    if (this.typeFilter) {
      filtered = filtered.filter(item => item.type === this.typeFilter);
    }
    
    this.filteredItems.set(filtered);
  }

  getContentPreview(content: string): string {
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  }

  getTypeIcon(type: string): string {
    return type === 'post' ? '📝' : '💬';
  }

  getTypeIconClass(type: string): string {
    return type === 'post' 
      ? 'bg-blue-100'
      : 'bg-purple-100';
  }

  getTypeClass(type: string): string {
    return type === 'post' 
      ? 'bg-blue-100 text-blue-700'
      : 'bg-purple-100 text-purple-700';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  }

  getPendingCount(): number {
    return this.moderationItems().filter(item => item.status === 'pending').length;
  }

  getReportedCount(): number {
    return this.moderationItems().filter(item => (item.reportCount || 0) > 0).length;
  }

  getApprovedCount(): number {
    return this.moderationItems().filter(item => item.status === 'approved').length;
  }

  getTotalActions(): number {
    return this.moderationItems().length;
  }

  viewItem(item: ModerationItem) {
    this.selectedItem.set(item);
  }

  closeModal() {
    this.selectedItem.set(null);
  }

  approveItem(item: ModerationItem) {
    if (item.type === 'post') {
      this.forumService.approvePost(item.id).subscribe({
        next: () => {
          this.loadModerationData();
        },
        error: (error) => {
          console.error('Error approving post:', error);
        }
      });
    }
    // For comments, we would need a similar approve endpoint
  }

  rejectItem(item: ModerationItem) {
    // This would require a reject endpoint in the backend
    console.log('Rejecting item:', item.id);
    // For now, we'll just delete it
    this.deleteItem(item);
  }

  deleteItem(item: ModerationItem) {
    if (confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      const deleteOperation = item.type === 'post' 
        ? this.forumService.deletePost(item.id)
        : this.forumService.deleteComment(item.id);
      
      deleteOperation.subscribe({
        next: () => {
          this.loadModerationData();
        },
        error: (error) => {
          console.error('Error deleting item:', error);
        }
      });
    }
  }
}
