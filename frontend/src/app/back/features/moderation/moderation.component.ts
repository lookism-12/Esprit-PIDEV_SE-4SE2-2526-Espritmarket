import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface Post {
  id: string;
  userId: string;
  categoryId: string;
  content: string;
  createdAt: string;
  pinned: boolean;
  approved: boolean;
}

interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
}

interface ModerationItem {
  id: string;
  type: 'post' | 'comment';
  content: string;
  userId: string;
  createdAt: string;
  approved: boolean;
  pinned?: boolean;
  postId?: string;
}

type FilterStatus = 'all' | 'pending' | 'approved';
type FilterType = 'all' | 'post' | 'comment';

@Component({
  selector: 'app-moderation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './moderation.component.html'
})
export class ModerationComponent implements OnInit {
  private http = inject(HttpClient);

  items = signal<ModerationItem[]>([]);
  isLoading = signal(true);
  actionLoading = signal<string | null>(null);
  selectedItem = signal<ModerationItem | null>(null);
  search = signal('');
  filterStatus = signal<FilterStatus>('all');
  filterType = signal<FilterType>('all');
  successMsg = signal<string | null>(null);
  errorMsg = signal<string | null>(null);

  readonly statusOptions: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'All Content' },
    { value: 'pending', label: 'Pending Review' },
    { value: 'approved', label: 'Approved' }
  ];

  readonly typeOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'post', label: 'Posts' },
    { value: 'comment', label: 'Comments' }
  ];

  filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const s = this.filterStatus();
    const t = this.filterType();
    return this.items().filter(item => {
      const matchQ = !q || item.content.toLowerCase().includes(q) || item.userId.toLowerCase().includes(q);
      const matchS = s === 'all' || (s === 'pending' ? !item.approved : item.approved);
      const matchT = t === 'all' || item.type === t;
      return matchQ && matchS && matchT;
    });
  });

  pendingCount = computed(() => this.items().filter(i => !i.approved).length);
  approvedCount = computed(() => this.items().filter(i => i.approved).length);
  postCount = computed(() => this.items().filter(i => i.type === 'post').length);
  commentCount = computed(() => this.items().filter(i => i.type === 'comment').length);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading.set(true);
    forkJoin({
      posts: this.http.get<Post[]>('/api/forum/posts').pipe(catchError(() => of([]))),
      comments: this.http.get<Comment[]>('/api/forum/comments').pipe(catchError(() => of([])))
    }).subscribe(({ posts, comments }) => {
      const mapped: ModerationItem[] = [
        ...(posts as Post[]).map(p => ({
          id: p.id,
          type: 'post' as const,
          content: p.content,
          userId: p.userId,
          createdAt: p.createdAt,
          approved: p.approved,
          pinned: p.pinned
        })),
        ...(comments as Comment[]).map(c => ({
          id: c.id,
          type: 'comment' as const,
          content: c.content,
          userId: c.userId,
          createdAt: c.createdAt,
          approved: true, // comments don't have approval field
          postId: c.postId
        }))
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      this.items.set(mapped);
      this.isLoading.set(false);
    });
  }

  approve(item: ModerationItem): void {
    this.actionLoading.set(item.id);
    this.http.put(`/api/forum/posts/${item.id}`, { approved: true, pinned: item.pinned ?? false }).subscribe({
      next: () => {
        this.items.update(list => list.map(i => i.id === item.id ? { ...i, approved: true } : i));
        this.actionLoading.set(null);
        this.showSuccess('Post approved successfully');
        if (this.selectedItem()?.id === item.id) this.selectedItem.update(i => i ? { ...i, approved: true } : null);
      },
      error: () => { this.actionLoading.set(null); this.showError('Failed to approve'); }
    });
  }

  reject(item: ModerationItem): void {
    if (!confirm('Reject and delete this content?')) return;
    this.delete(item);
  }

  pin(item: ModerationItem): void {
    if (item.type !== 'post') return;
    this.actionLoading.set(item.id);
    const newPinned = !item.pinned;
    this.http.put(`/api/forum/posts/${item.id}`, { approved: item.approved, pinned: newPinned }).subscribe({
      next: () => {
        this.items.update(list => list.map(i => i.id === item.id ? { ...i, pinned: newPinned } : i));
        this.actionLoading.set(null);
        this.showSuccess(newPinned ? 'Post pinned' : 'Post unpinned');
        if (this.selectedItem()?.id === item.id) this.selectedItem.update(i => i ? { ...i, pinned: newPinned } : null);
      },
      error: () => { this.actionLoading.set(null); this.showError('Failed to update pin'); }
    });
  }

  delete(item: ModerationItem): void {
    if (!confirm('Permanently delete this content?')) return;
    this.actionLoading.set(item.id);
    const url = item.type === 'post' ? `/api/forum/posts/${item.id}` : `/api/forum/comments/${item.id}`;
    this.http.delete(url).subscribe({
      next: () => {
        this.items.update(list => list.filter(i => i.id !== item.id));
        this.actionLoading.set(null);
        this.showSuccess('Content deleted');
        if (this.selectedItem()?.id === item.id) this.selectedItem.set(null);
      },
      error: () => { this.actionLoading.set(null); this.showError('Failed to delete'); }
    });
  }

  openDetail(item: ModerationItem): void { this.selectedItem.set(item); }
  closeDetail(): void { this.selectedItem.set(null); }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  preview(content: string, max = 80): string {
    return content?.length > max ? content.substring(0, max) + '…' : content;
  }

  private showSuccess(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(null), 3000);
  }

  private showError(msg: string): void {
    this.errorMsg.set(msg);
    setTimeout(() => this.errorMsg.set(null), 3000);
  }
}
