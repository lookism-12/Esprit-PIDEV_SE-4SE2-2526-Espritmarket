import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminForumService, Post, CategoryForum } from '../../core/services/admin-forum.service';

@Component({
  selector: 'app-forum-posts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl shadow-soft border border-gray-100">
        <div>
          <h1 class="text-3xl font-black text-dark tracking-tight">Forum Posts</h1>
          <p class="text-secondary font-medium mt-1">Manage and moderate forum posts</p>
        </div>
        <select (change)="filterByStatus($event)" 
                class="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium bg-white">
          <option value="">All Posts</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending Approval</option>
          <option value="pinned">Pinned</option>
        </select>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-xl">📝</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Total</p>
            <p class="text-2xl font-black text-dark">{{ posts().length }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-xl">✅</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Approved</p>
            <p class="text-2xl font-black text-dark">{{ posts().filter(p => p.approved).length }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-xl">⏳</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Pending</p>
            <p class="text-2xl font-black text-dark">{{ posts().filter(p => !p.approved).length }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-xl">📌</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Pinned</p>
            <p class="text-2xl font-black text-dark">{{ posts().filter(p => p.pinned).length }}</p>
          </div>
        </div>
      </div>

      <!-- Posts List -->
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
                  <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Post</th>
                  <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Category</th>
                  <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Status</th>
                  <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Created</th>
                  <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                @for (post of filteredPosts(); track post.id) {
                  <tr class="hover:bg-gray-50/50 transition-colors group">
                    <td class="px-6 py-4">
                      <div class="flex items-start gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">📝</div>
                        <div class="min-w-0 flex-1">
                          <p class="font-black text-dark text-sm mb-1">{{ getPostPreview(post.content) }}</p>
                          <div class="flex items-center gap-3 text-xs">
                            <span class="text-secondary">{{ post.commentIds?.length || 0 }} comments</span>
                            <span class="text-secondary">{{ post.reactionIds?.length || 0 }} reactions</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span class="px-3 py-1 bg-gray-100 text-[10px] font-black text-secondary rounded-lg uppercase tracking-widest">
                        {{ getCategoryName(post.categoryId) }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex flex-col gap-1">
                        <span [class]="post.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'" 
                              class="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit">
                          {{ post.approved ? 'Approved' : 'Pending' }}
                        </span>
                        @if (post.pinned) {
                          <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit">
                            📌 Pinned
                          </span>
                        }
                      </div>
                    </td>
                    <td class="px-6 py-4 text-secondary text-sm">{{ formatDate(post.createdAt) }}</td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        @if (!post.approved) {
                          <button (click)="approvePost(post.id!)" title="Approve"
                              class="p-2 hover:bg-green-50 text-green-500 hover:text-green-700 rounded-lg transition-colors text-sm">✅</button>
                        }
                        <button (click)="togglePin(post)" [title]="post.pinned ? 'Unpin' : 'Pin'"
                            class="p-2 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors text-sm">📌</button>
                        <button (click)="viewPost(post)" title="View"
                            class="p-2 hover:bg-gray-50 text-gray-400 hover:text-gray-600 rounded-lg transition-colors text-sm">👁️</button>
                        <button (click)="deletePost(post.id!)" title="Delete"
                            class="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors text-sm">🗑️</button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="px-6 py-16 text-center">
                      <div class="flex flex-col items-center gap-4">
                        <span class="text-5xl">📝</span>
                        <p class="text-lg font-black text-dark mb-2">No posts found</p>
                        <p class="text-secondary font-medium">Posts will appear here when users create them</p>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Post Details Modal -->
      @if (selectedPost()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="closeModal()">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-8 space-y-6" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-black text-dark">Post Details</h2>
              <button (click)="closeModal()" class="text-secondary hover:text-dark transition-colors text-xl">✕</button>
            </div>
            
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Content</label>
                <div class="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-dark">
                  {{ selectedPost()?.content }}
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Category</label>
                  <div class="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-dark">
                    {{ getCategoryName(selectedPost()?.categoryId!) }}
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Created</label>
                  <div class="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-dark">
                    {{ formatDate(selectedPost()?.createdAt) }}
                  </div>
                </div>
              </div>
              
              <div class="flex gap-3 pt-2">
                <button (click)="closeModal()"
                        class="flex-1 py-3 bg-gray-100 text-dark font-black rounded-xl hover:bg-gray-200 transition-all text-sm">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`.shadow-soft { box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); }`]
})
export class ForumPostsComponent implements OnInit {
  private forumService = inject(AdminForumService);
  
  posts = signal<Post[]>([]);
  categories = signal<CategoryForum[]>([]);
  filteredPosts = signal<Post[]>([]);
  loading = signal(true);
  selectedPost = signal<Post | null>(null);
  currentFilter = '';

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    Promise.all([
      this.forumService.getPosts().toPromise(),
      this.forumService.getCategories().toPromise()
    ]).then(([posts, categories]) => {
      this.posts.set(posts || []);
      this.categories.set(categories || []);
      this.applyFilter();
      this.loading.set(false);
    }).catch(error => {
      console.error('Error loading data:', error);
      this.loading.set(false);
    });
  }

  filterByStatus(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.currentFilter = target.value;
    this.applyFilter();
  }

  applyFilter() {
    let filtered = this.posts();
    
    switch (this.currentFilter) {
      case 'approved':
        filtered = filtered.filter(post => post.approved);
        break;
      case 'pending':
        filtered = filtered.filter(post => !post.approved);
        break;
      case 'pinned':
        filtered = filtered.filter(post => post.pinned);
        break;
    }
    
    this.filteredPosts.set(filtered);
  }

  getPostPreview(content: string): string {
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories().find(c => c.id === categoryId);
    return category?.name || 'Unknown Category';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  }

  approvePost(id: string) {
    this.forumService.approvePost(id).subscribe({
      next: () => {
        this.loadData();
      },
      error: (error) => {
        console.error('Error approving post:', error);
      }
    });
  }

  togglePin(post: Post) {
    this.forumService.pinPost(post.id!, !post.pinned).subscribe({
      next: () => {
        this.loadData();
      },
      error: (error) => {
        console.error('Error toggling pin:', error);
      }
    });
  }

  viewPost(post: Post) {
    this.selectedPost.set(post);
  }

  closeModal() {
    this.selectedPost.set(null);
  }

  deletePost(id: string) {
    if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      this.forumService.deletePost(id).subscribe({
        next: () => {
          this.loadData();
        },
        error: (error) => {
          console.error('Error deleting post:', error);
        }
      });
    }
  }
}
