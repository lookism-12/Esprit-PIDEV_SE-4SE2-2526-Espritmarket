import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminForumService, ForumStats } from '../../core/services/admin-forum.service';

@Component({
  selector: 'app-forum-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

      <!-- Header -->
      <div class="bg-white p-8 rounded-3xl shadow-soft border border-gray-100">
        <h1 class="text-3xl font-black text-dark tracking-tight">Forum Management</h1>
        <p class="text-secondary font-medium mt-1">Manage categories, posts, and community interactions</p>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-xl">📂</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Categories</p>
            <p class="text-2xl font-black text-dark">{{ stats()?.totalCategories || 0 }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-xl">📝</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Posts</p>
            <p class="text-2xl font-black text-dark">{{ stats()?.totalPosts || 0 }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-xl">💬</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Comments</p>
            <p class="text-2xl font-black text-dark">{{ stats()?.totalComments || 0 }}</p>
          </div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex items-center gap-3">
          <div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-xl">⏳</div>
          <div>
            <p class="text-[10px] font-black text-secondary uppercase tracking-widest">Pending</p>
            <p class="text-2xl font-black text-dark">{{ stats()?.pendingApprovals || 0 }}</p>
          </div>
        </div>
      </div>

      <!-- Navigation Cards -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

        <a routerLink="/admin/forum/categories"
          class="bg-white rounded-3xl border border-gray-100 shadow-soft p-6 hover:border-primary/40 hover:shadow-md transition-all group cursor-pointer">
          <div class="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📂</div>
          <h3 class="font-black text-dark text-lg mb-1">Categories</h3>
          <p class="text-secondary text-sm font-medium mb-4">Create and organize forum categories</p>
          <span class="text-[10px] font-black text-primary uppercase tracking-widest">Manage Categories →</span>
        </a>

        <a routerLink="/admin/forum/posts"
          class="bg-white rounded-3xl border border-gray-100 shadow-soft p-6 hover:border-primary/40 hover:shadow-md transition-all group cursor-pointer">
          <div class="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📝</div>
          <h3 class="font-black text-dark text-lg mb-1">Posts</h3>
          <p class="text-secondary text-sm font-medium mb-4">Review and moderate forum posts</p>
          <span class="text-[10px] font-black text-primary uppercase tracking-widest">Manage Posts →</span>
        </a>

        <a routerLink="/admin/forum/comments"
          class="bg-white rounded-3xl border border-gray-100 shadow-soft p-6 hover:border-primary/40 hover:shadow-md transition-all group cursor-pointer">
          <div class="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">💬</div>
          <h3 class="font-black text-dark text-lg mb-1">Comments</h3>
          <p class="text-secondary text-sm font-medium mb-4">Manage and moderate comments</p>
          <span class="text-[10px] font-black text-primary uppercase tracking-widest">Manage Comments →</span>
        </a>

        <a routerLink="/admin/forum/moderation"
          class="bg-white rounded-3xl border border-gray-100 shadow-soft p-6 hover:border-primary/40 hover:shadow-md transition-all group cursor-pointer">
          <div class="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">🛡️</div>
          <h3 class="font-black text-dark text-lg mb-1">Moderation</h3>
          <p class="text-secondary text-sm font-medium mb-4">Handle reports and violations</p>
          <span class="text-[10px] font-black text-primary uppercase tracking-widest">Moderation Tools →</span>
        </a>

        <a routerLink="/admin/forum/reports"
          class="bg-white rounded-3xl border border-gray-100 shadow-soft p-6 hover:border-primary/40 hover:shadow-md transition-all group cursor-pointer">
          <div class="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">⚠️</div>
          <h3 class="font-black text-dark text-lg mb-1">Reports</h3>
          <p class="text-secondary text-sm font-medium mb-4">Review user reports and flags</p>
          <span class="text-[10px] font-black text-primary uppercase tracking-widest">View Reports →</span>
        </a>

        <a routerLink="/forum" target="_blank"
          class="bg-white rounded-3xl border border-gray-100 shadow-soft p-6 hover:border-primary/40 hover:shadow-md transition-all group cursor-pointer">
          <div class="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">👁️</div>
          <h3 class="font-black text-dark text-lg mb-1">Client Forum View</h3>
          <p class="text-secondary text-sm font-medium mb-4">Preview the forum as users see it</p>
          <span class="text-[10px] font-black text-primary uppercase tracking-widest">Open Forum ↗</span>
        </a>

      </div>
    </div>
  `,
  styles: [`.shadow-soft { box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); }`]
})
export class ForumOverviewComponent implements OnInit {
  private forumService = inject(AdminForumService);
  
  stats = signal<ForumStats | null>(null);
  loading = signal(true);

  ngOnInit() {
    this.loadStats();
  }

  private loadStats() {
    // For now, we'll create mock stats since the backend endpoint might not exist
    setTimeout(() => {
      this.stats.set({
        totalCategories: 8,
        totalPosts: 156,
        totalComments: 423,
        pendingApprovals: 12,
        recentActivity: []
      });
      this.loading.set(false);
    }, 1000);
  }
}
