import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MetricCardComponent } from '../../shared/components/metric-card/metric-card.component';
import { ForumService, CategoryForumDto, CategoryForumRequestDto } from '../../../front/core/forum.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-forum-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MetricCardComponent],
  template: `
    <div class="p-6 max-w-7xl mx-auto">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Forum Management</h1>
        <p class="text-sm text-gray-500 mt-1">Stats and latest activity from the forum.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        @for (m of metrics; track m.label) {
          <app-metric-card [data]="m"></app-metric-card>
        }
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl border border-[#7D0408] overflow-hidden shadow-sm">
          <div class="p-4 border-b border-gray-100 bg-gray-50/30">
            <h3 class="text-sm font-bold text-gray-800">Latest Posts</h3>
          </div>
          <div class="p-4 space-y-3">
            @if (loading) {
              <p class="text-sm text-gray-500">Loading...</p>
            } @else if (recentPosts.length === 0) {
              <p class="text-sm text-gray-500">No posts yet.</p>
            } @else {
              @for (p of recentPosts; track p.id) {
                <div class="p-3 border border-gray-100 rounded-lg">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="text-xs text-gray-500 font-bold">
                        {{ p.userId }} • {{ formatDate(p.createdAt) }}
                      </div>
                      <p class="font-bold text-gray-900 line-clamp-2">
                        {{ extractTitle(p.content) }}
                      </p>
                      <p class="text-xs text-gray-600 mt-1">
                        Category: {{ p.categoryId }}
                      </p>
                    </div>
                  </div>
                </div>
              }
            }
          </div>
        </div>

        <div class="bg-white rounded-xl border border-[#7D0408] overflow-hidden shadow-sm">
          <div class="p-4 border-b border-gray-100 bg-gray-50/30">
            <h3 class="text-sm font-bold text-gray-800">Discussion Health</h3>
          </div>
          <div class="p-4 space-y-3">
            <div class="p-3 border border-gray-100 rounded-lg">
              <p class="text-sm font-bold text-gray-900">Comments per Post</p>
              <p class="text-2xl font-extrabold text-primary mt-1">
                {{ commentsPerPost }}
              </p>
            </div>
            <div class="p-3 border border-gray-100 rounded-lg">
              <p class="text-sm font-bold text-gray-900">Replies per Comment</p>
              <p class="text-2xl font-extrabold text-primary mt-1">
                {{ repliesPerComment }}
              </p>
            </div>
            <div class="p-3 border border-gray-100 rounded-lg">
              <p class="text-sm font-bold text-gray-900">Top Category</p>
              <p class="text-lg font-bold text-gray-900 mt-1">{{ topCategoryName }}</p>
              <p class="text-xs text-gray-600 mt-1">
                Based on number of posts in each category.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Category Management (Admin only) -->
      @if (isAdmin()) {
        <div class="mt-8 bg-white rounded-xl border border-[#7D0408] overflow-hidden shadow-sm">
          <div class="p-4 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
            <h3 class="text-sm font-bold text-gray-800">Category Management</h3>
            <span class="text-xs text-gray-500">Create / Update / Delete</span>
          </div>

          <div class="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="border border-gray-100 rounded-xl p-4">
              <h4 class="text-sm font-bold text-gray-900 mb-3">{{ editingCategoryId ? 'Edit Category' : 'Add Category' }}</h4>

              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Name</label>
                  <input
                    class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    [(ngModel)]="categoryForm.name"
                    placeholder="e.g. General Discussion"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">Description</label>
                  <textarea
                    class="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    rows="4"
                    [(ngModel)]="categoryForm.description"
                    placeholder="Category description..."
                  ></textarea>
                </div>

                <div class="flex gap-3 pt-2">
                  <button
                    (click)="submitCategory()"
                    class="flex-1 btn-primary py-2 disabled:opacity-50"
                    [disabled]="!categoryForm.name.trim() || !categoryForm.description.trim() || loadingCategories">
                    {{ editingCategoryId ? 'Update' : 'Create' }}
                  </button>
                  <button
                    type="button"
                    (click)="resetCategoryForm()"
                    class="flex-1 px-3 py-2 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                    [disabled]="loadingCategories">
                    Cancel
                  </button>
                </div>

                @if (loadingCategories) {
                  <p class="text-xs text-gray-500">Loading...</p>
                }
              </div>
            </div>

            <div class="border border-gray-100 rounded-xl p-4">
              <h4 class="text-sm font-bold text-gray-900 mb-3">Existing Categories</h4>

              @if (adminCategories.length === 0) {
                <p class="text-sm text-gray-500">No categories yet.</p>
              } @else {
                <div class="space-y-3 max-h-[320px] overflow-y-auto hide-scrollbar pr-1">
                  @for (c of adminCategories; track c.id) {
                    <div class="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <p class="text-sm font-bold text-gray-900 line-clamp-1">{{ c.name }}</p>
                          <p class="text-xs text-gray-600 mt-1 line-clamp-2">{{ c.description }}</p>
                        </div>
                        <div class="flex flex-col gap-2">
                          <button
                            type="button"
                            (click)="editCategory(c)"
                            class="text-xs font-bold text-primary hover:underline whitespace-nowrap">
                            Edit
                          </button>
                          <button
                            type="button"
                            (click)="deleteCategory(c)"
                            class="text-xs font-bold text-red-600 hover:underline whitespace-nowrap">
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ForumAdminComponent implements OnInit {
  loading = true;

  metrics: Array<{ label: string; value: string; icon: string; color: string }> = [];

  recentPosts: Array<any> = [];

  commentsPerPost = '0';
  repliesPerComment = '0';
  topCategoryName = '-';

  private categoryById = new Map<string, string>();

  // Category CRUD (admin)
  loadingCategories = false;
  adminCategories: CategoryForumDto[] = [];
  editingCategoryId: string | null = null;
  categoryForm: CategoryForumRequestDto = { name: '', description: '' };

  constructor(private forumService: ForumService) {}

  ngOnInit(): void {
    this.loadCategories();
    this.reloadStats();
  }

  isAdmin(): boolean {
    const role = localStorage.getItem('userRole') ?? '';
    return role.toUpperCase().includes('ADMIN');
  }

  private loadCategories(): void {
    this.loadingCategories = true;
    this.forumService.getCategories().subscribe({
      next: (cats) => {
        this.adminCategories = cats;
        this.loadingCategories = false;
      },
      error: (err) => {
        console.error('Failed to load forum categories:', err);
        this.loadingCategories = false;
      }
    });
  }

  private reloadStats(): void {
    this.loading = true;

    forkJoin({
      posts: this.forumService.getPosts(),
      comments: this.forumService.getComments(),
      replies: this.forumService.getReplies(),
      categories: this.forumService.getCategories()
    }).subscribe({
      next: ({ posts, comments, replies, categories }) => {
        this.categoryById = new Map(categories.map((c) => [c.id, c.name]));

        const postsCount = posts.length;
        const commentsCount = comments.length;
        const repliesCount = replies.length;

        const postsByCategory = posts.reduce((acc: Record<string, number>, p: any) => {
          acc[p.categoryId] = (acc[p.categoryId] ?? 0) + 1;
          return acc;
        }, {});

        const topCategoryId = Object.entries(postsByCategory).sort((a, b) => b[1] - a[1])[0]?.[0];
        this.topCategoryName = topCategoryId
          ? this.categoryById.get(topCategoryId) ?? topCategoryId
          : '-';

        this.commentsPerPost = postsCount ? (commentsCount / postsCount).toFixed(2) : '0';
        this.repliesPerComment = commentsCount ? (repliesCount / commentsCount).toFixed(2) : '0';

        this.metrics = [
          { label: 'Forum Posts', value: String(postsCount), icon: '📝', color: 'blue' },
          { label: 'Total Comments', value: String(commentsCount), icon: '💬', color: 'green' },
          { label: 'Total Replies', value: String(repliesCount), icon: '↩️', color: 'purple' },
          { label: 'Top Category', value: this.topCategoryName, icon: '🏷️', color: 'orange' }
        ];

        this.recentPosts = [...posts]
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load forum admin stats:', err);
        this.loading = false;
      }
    });
  }

  resetCategoryForm(): void {
    this.editingCategoryId = null;
    this.categoryForm = { name: '', description: '' };
  }

  editCategory(c: CategoryForumDto): void {
    this.editingCategoryId = c.id;
    this.categoryForm = { name: c.name, description: c.description };
  }

  submitCategory(): void {
    if (!this.editingCategoryId) {
      this.forumService.createCategory(this.categoryForm).subscribe({
        next: () => this.afterCategoryMutation(),
        error: (err) => console.error('Failed to create category:', err)
      });
      return;
    }

    this.forumService.updateCategory(this.editingCategoryId, this.categoryForm).subscribe({
      next: () => this.afterCategoryMutation(),
      error: (err) => console.error('Failed to update category:', err)
    });
  }

  deleteCategory(c: CategoryForumDto): void {
    if (!confirm(`Delete category "${c.name}"?`)) return;

    this.forumService.deleteCategory(c.id).subscribe({
      next: () => this.afterCategoryMutation(),
      error: (err) => console.error('Failed to delete category:', err)
    });
  }

  private afterCategoryMutation(): void {
    this.resetCategoryForm();
    this.loadCategories();
    this.reloadStats();
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString();
  }

  extractTitle(rawContent: string): string {
    const normalized = String(rawContent ?? '');
    const [firstLine] = normalized.split(/\r?\n/);
    const title = (firstLine ?? '').trim();
    return title || '(no title)';
  }
}

