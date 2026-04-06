import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminForumService, Comment, Post } from '../../core/services/admin-forum.service';

@Component({
  selector: 'app-forum-comments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl shadow-soft border border-gray-100">
        <div>
          <h1 class="text-3xl font-black text-dark tracking-tight">Forum Comments</h1>
          <p class="text-secondary font-medium mt-1">Manage and moderate forum comments</p>
        </div>
        <select (change)="filterByPost($event)" 
                class="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium bg-white">
          <option value="">All Comments</option>
          @for (post of posts(); track post.id) {
            <option [value]="post.id">{{ getPostPreview(post.content) }}</option>
          }
        </select>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-xl">💬</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Total</p>
            <p class="text-2xl font-black text-dark">{{ comments().length }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-xl">💬</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Comments</p>
            <p class="text-2xl font-black text-dark">{{ comments().filter(c => !c.parentCommentId).length }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-xl">↩️</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Replies</p>
            <p class="text-2xl font-black text-dark">{{ comments().filter(c => c.parentCommentId).length }}</p>
          </div>
        </div>
      </div>

      <!-- Comments List -->
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
                  <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Comment</th>
                  <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Post</th>
                  <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Type</th>
                  <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest">Created</th>
                  <th class="px-6 py-5 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50">
                @for (comment of filteredComments(); track comment.id) {
                  <tr class="hover:bg-gray-50/50 transition-colors group">
                    <td class="px-6 py-4">
                      <div class="flex items-start gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">💬</div>
                        <div class="min-w-0 flex-1">
                          <p class="font-black text-dark text-sm mb-1">{{ getCommentPreview(comment.content) }}</p>
                          <span class="text-secondary text-xs">{{ comment.reactionIds?.length || 0 }} reactions</span>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="text-secondary text-sm bg-gray-50 px-3 py-1 rounded-lg">
                        {{ getPostTitle(comment.postId) }}
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span [class]="comment.parentCommentId ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'" 
                            class="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {{ getCommentType(comment) }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-secondary text-sm">{{ formatDate(comment.createdAt) }}</td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button (click)="viewComment(comment)" title="View"
                            class="p-2 hover:bg-gray-50 text-gray-400 hover:text-gray-600 rounded-lg transition-colors text-sm">👁️</button>
                        <button (click)="editComment(comment)" title="Edit"
                            class="p-2 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-colors text-sm">✏️</button>
                        <button (click)="deleteComment(comment.id!)" title="Delete"
                            class="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors text-sm">🗑️</button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="px-6 py-16 text-center">
                      <div class="flex flex-col items-center gap-4">
                        <span class="text-5xl">💬</span>
                        <p class="text-lg font-black text-dark mb-2">No comments found</p>
                        <p class="text-secondary font-medium">Comments will appear here when users interact with posts</p>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Comment Details/Edit Modal -->
      @if (selectedComment()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="closeModal()">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-8 space-y-6" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-black text-dark">{{ isEditing() ? 'Edit Comment' : 'Comment Details' }}</h2>
              <button (click)="closeModal()" class="text-secondary hover:text-dark transition-colors text-xl">✕</button>
            </div>
            
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Content</label>
                @if (isEditing()) {
                  <textarea [(ngModel)]="editForm.content" 
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium resize-none"
                            rows="6"></textarea>
                } @else {
                  <div class="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-dark">
                    {{ selectedComment()?.content }}
                  </div>
                }
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Post</label>
                  <div class="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-dark">
                    {{ getPostTitle(selectedComment()?.postId!) }}
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Type</label>
                  <div class="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-dark">
                    {{ getCommentType(selectedComment()!) }}
                  </div>
                </div>
              </div>
              
              <div>
                <label class="block text-xs font-black text-secondary uppercase tracking-widest mb-1">Created</label>
                <div class="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-dark">
                  {{ formatDate(selectedComment()?.createdAt) }}
                </div>
              </div>
              
              <div class="flex gap-3 pt-2">
                <button (click)="closeModal()"
                        class="flex-1 py-3 bg-gray-100 text-dark font-black rounded-xl hover:bg-gray-200 transition-all text-sm">
                  Cancel
                </button>
                @if (isEditing()) {
                  <button (click)="saveComment()" 
                          [disabled]="saving()"
                          class="flex-1 py-3 bg-primary text-white font-black rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 text-sm uppercase tracking-widest">
                    {{ saving() ? 'Saving...' : 'Save Changes' }}
                  </button>
                } @else {
                  <button (click)="startEditing()"
                          class="flex-1 py-3 bg-primary text-white font-black rounded-xl hover:bg-primary/90 transition-all text-sm uppercase tracking-widest">
                    Edit Comment
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
export class ForumCommentsComponent implements OnInit {
  private forumService = inject(AdminForumService);
  
  comments = signal<Comment[]>([]);
  posts = signal<Post[]>([]);
  filteredComments = signal<Comment[]>([]);
  loading = signal(true);
  selectedComment = signal<Comment | null>(null);
  isEditing = signal(false);
  saving = signal(false);
  currentFilter = '';
  
  editForm = {
    content: ''
  };

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    Promise.all([
      this.forumService.getComments().toPromise(),
      this.forumService.getPosts().toPromise()
    ]).then(([comments, posts]) => {
      this.comments.set(comments || []);
      this.posts.set(posts || []);
      this.applyFilter();
      this.loading.set(false);
    }).catch(error => {
      console.error('Error loading data:', error);
      this.loading.set(false);
    });
  }

  filterByPost(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.currentFilter = target.value;
    this.applyFilter();
  }

  applyFilter() {
    let filtered = this.comments();
    
    if (this.currentFilter) {
      filtered = filtered.filter(comment => comment.postId === this.currentFilter);
    }
    
    this.filteredComments.set(filtered);
  }

  getCommentPreview(content: string): string {
    return content.length > 80 ? content.substring(0, 80) + '...' : content;
  }

  getPostPreview(content: string): string {
    return content.length > 50 ? content.substring(0, 50) + '...' : content;
  }

  getPostTitle(postId: string): string {
    const post = this.posts().find(p => p.id === postId);
    return post ? this.getPostPreview(post.content) : 'Unknown Post';
  }

  getCommentType(comment: Comment): string {
    return comment.parentCommentId ? 'Reply' : 'Comment';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  }

  viewComment(comment: Comment) {
    this.selectedComment.set(comment);
    this.isEditing.set(false);
  }

  editComment(comment: Comment) {
    this.selectedComment.set(comment);
    this.editForm.content = comment.content;
    this.isEditing.set(true);
  }

  startEditing() {
    this.editForm.content = this.selectedComment()?.content || '';
    this.isEditing.set(true);
  }

  closeModal() {
    this.selectedComment.set(null);
    this.isEditing.set(false);
    this.editForm.content = '';
  }

  saveComment() {
    if (!this.editForm.content.trim() || !this.selectedComment()) {
      return;
    }

    this.saving.set(true);
    const commentId = this.selectedComment()!.id!;
    
    this.forumService.updateComment(commentId, { content: this.editForm.content.trim() }).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadData();
      },
      error: (error) => {
        console.error('Error saving comment:', error);
        this.saving.set(false);
      }
    });
  }

  deleteComment(id: string) {
    if (confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      this.forumService.deleteComment(id).subscribe({
        next: () => {
          this.loadData();
        },
        error: (error) => {
          console.error('Error deleting comment:', error);
        }
      });
    }
  }
}
