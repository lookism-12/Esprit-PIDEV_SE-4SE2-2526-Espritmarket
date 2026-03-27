import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ForumService, Post } from '../../core/forum.service';
import { ForumCategory, ModerationBadge, ReactionType, ReactionSummary, Comment } from '../../models/forum.model';

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './forum.html',
  styleUrl: './forum.scss',
})
export class Forum implements OnInit {
  private fb = inject(FormBuilder);
  private forumService = inject(ForumService);

  readonly ReactionType = ReactionType;

  // State
  activeCategory = signal<string>('all');
  searchQuery = signal<string>('');
  sortBy = signal<'recent' | 'popular' | 'comments'>('recent');
  showCreatePostModal = signal(false);
  isCreatingPost = signal(false);
  isLoading = signal(false);
  expandedPostId = signal<string | null>(null);

  // Forms
  createPostForm!: FormGroup;
  commentForm!: FormGroup;

  // Categories
  categories = signal<ForumCategory[]>([
    {
      id: '1',
      name: 'General Discussion',
      slug: 'general',
      description: 'Talk about anything ESPRIT related',
      icon: '💬',
      color: 'bg-blue-500',
      postCount: 156,
      isLocked: false,
      sortOrder: 1,
      createdAt: new Date()
    },
    {
      id: '2',
      name: 'Study & Exams',
      slug: 'study',
      description: 'Share notes, ask questions, discuss courses',
      icon: '📚',
      color: 'bg-green-500',
      postCount: 89,
      isLocked: false,
      sortOrder: 2,
      createdAt: new Date()
    },
    {
      id: '3',
      name: 'Jobs & Internships',
      slug: 'jobs',
      description: 'Career opportunities and advice',
      icon: '💼',
      color: 'bg-purple-500',
      postCount: 45,
      isLocked: false,
      sortOrder: 3,
      createdAt: new Date()
    },
    {
      id: '4',
      name: 'Events & Clubs',
      slug: 'events',
      description: 'Campus events and club activities',
      icon: '🎉',
      color: 'bg-pink-500',
      postCount: 67,
      isLocked: false,
      sortOrder: 4,
      createdAt: new Date()
    },
    {
      id: '5',
      name: 'Tech & Projects',
      slug: 'tech',
      description: 'Share your projects and tech discussions',
      icon: '💻',
      color: 'bg-orange-500',
      postCount: 112,
      isLocked: false,
      sortOrder: 5,
      createdAt: new Date()
    },
    {
      id: '6',
      name: 'Marketplace Tips',
      slug: 'marketplace',
      description: 'Tips for buying and selling',
      icon: '🛒',
      color: 'bg-primary',
      postCount: 34,
      isLocked: false,
      sortOrder: 6,
      createdAt: new Date()
    }
  ]);

  // Posts
  posts = signal<Post[]>([]);

  // Comments for expanded post
  comments = signal<Comment[]>([]);

  // Filtered posts
  filteredPosts = computed(() => {
    let filtered = this.posts();
    
    // Category filter
    if (this.activeCategory() !== 'all') {
      const category = this.categories().find(c => c.slug === this.activeCategory());
      if (category) {
        filtered = filtered.filter(p => p.category === category.name);
      }
    }

    // Search filter
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query) ||
        p.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    // Sorting
    switch (this.sortBy()) {
      case 'popular':
        filtered = [...filtered].sort((a, b) => b.likesCount - a.likesCount);
        break;
      case 'comments':
        filtered = [...filtered].sort((a, b) => b.commentsCount - a.commentsCount);
        break;
      case 'recent':
      default:
        filtered = [...filtered].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
    }
 
    // Pinned posts first (if isPinned exists on backend, otherwise fallback)
    return filtered;
  });

  ngOnInit(): void {
    this.initForms();
    this.fetchPosts();
  }
 
  fetchPosts(): void {
    this.isLoading.set(true);
    this.forumService.getAll(this.activeCategory(), this.searchQuery()).subscribe({
      next: (posts) => {
        this.posts.set(posts);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching posts:', err);
        this.isLoading.set(false);
      }
    });
  }

  private initForms(): void {
    this.createPostForm = this.fb.group({
      categoryId: ['', Validators.required],
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.minLength(20)]],
      tags: ['']
    });

    this.commentForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  selectCategory(slug: string): void {
    this.activeCategory.set(slug);
  }

  updateSort(sort: 'recent' | 'popular' | 'comments'): void {
    this.sortBy.set(sort);
  }

  openCreatePostModal(): void {
    this.showCreatePostModal.set(true);
  }

  closeCreatePostModal(): void {
    this.showCreatePostModal.set(false);
    this.createPostForm.reset();
  }

  createPost(): void {
    if (this.createPostForm.invalid) {
      this.createPostForm.markAllAsTouched();
      return;
    }

    this.isCreatingPost.set(true);
    const formValue = this.createPostForm.value;
    const category = this.categories().find(c => c.id === formValue.categoryId);
 
    const postData = {
      title: formValue.title,
      content: formValue.content,
      category: category?.name || 'General',
      tags: formValue.tags ? formValue.tags.split(',').map((t: string) => t.trim()) : []
    };
 
    this.forumService.create(postData).subscribe({
      next: () => {
        this.isCreatingPost.set(false);
        this.closeCreatePostModal();
        this.fetchPosts();
      },
      error: (err) => {
        console.error('Error creating post:', err);
        this.isCreatingPost.set(false);
      }
    });
  }

  togglePostExpansion(postId: string): void {
    this.expandedPostId.set(this.expandedPostId() === postId ? null : postId);
  }

  reactToPost(postId: string, reaction: ReactionType): void {
    // Only supporting Like for now based on backend
    if (reaction === ReactionType.LIKE) {
      this.forumService.like(postId).subscribe({
        next: () => this.fetchPosts(),
        error: (err) => console.error('Error liking post:', err)
      });
    }
  }
 
  submitComment(postId: string): void {
    if (this.commentForm.invalid) return;
    
    // Mock comment submission for now
    this.commentForm.reset();
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  getBadgeClass(badge?: ModerationBadge): string {
    switch (badge) {
      case ModerationBadge.OFFICIAL: return 'bg-blue-100 text-blue-700';
      case ModerationBadge.PINNED: return 'bg-yellow-100 text-yellow-700';
      case ModerationBadge.TRENDING: return 'bg-orange-100 text-orange-700';
      case ModerationBadge.VERIFIED: return 'bg-green-100 text-green-700';
      case ModerationBadge.EXPERT: return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.createPostForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
