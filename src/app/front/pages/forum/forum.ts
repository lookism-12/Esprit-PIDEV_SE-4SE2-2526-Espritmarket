import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ForumCategory, Post, PostStatus, ModerationBadge, ReactionType, ReactionSummary, Comment } from '../../models/forum.model';

interface SimplePost {
  id: string;
  author: {
    name: string;
    avatar?: string;
    badge?: string;
  };
  category: string;
  categoryColor: string;
  title: string;
  content: string;
  time: Date;
  likes: number;
  loves: number;
  comments: number;
  tags: string[];
  isPinned?: boolean;
  isLocked?: boolean;
  moderationBadge?: ModerationBadge;
  userReaction?: ReactionType;
}

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './forum.html',
  styleUrl: './forum.scss',
})
export class Forum implements OnInit {
  private fb = inject(FormBuilder);

  readonly ReactionType = ReactionType;

  // State
  activeCategory = signal<string>('all');
  searchQuery = signal<string>('');
  sortBy = signal<'recent' | 'popular' | 'comments'>('recent');
  showCreatePostModal = signal(false);
  isCreatingPost = signal(false);
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
  posts = signal<SimplePost[]>([
    {
      id: '1',
      author: { name: 'Ahmed B.', badge: 'Expert' },
      category: 'Study & Exams',
      categoryColor: 'bg-green-500',
      title: 'Previous Exam Papers for Probability and Statistics',
      content: 'Does anyone have the previous exam papers for Probability and Statistics? I really need them for revision. Any help would be appreciated!',
      time: new Date(Date.now() - 2 * 60 * 60 * 1000),
      likes: 12,
      loves: 3,
      comments: 5,
      tags: ['Exams', 'Help', '2nd Year'],
      isPinned: false,
      userReaction: undefined
    },
    {
      id: '2',
      author: { name: 'Selima K.', avatar: 'https://ui-avatars.com/api/?name=SK&background=8B0000&color=fff' },
      category: 'Events & Clubs',
      categoryColor: 'bg-pink-500',
      title: 'AI Club Event Tomorrow - Don\'t Miss It!',
      content: 'The AI Club is hosting an amazing event tomorrow at the main hall! We\'ll have guest speakers from leading tech companies. Free pizza for all attendees! 🍕',
      time: new Date(Date.now() - 5 * 60 * 60 * 1000),
      likes: 24,
      loves: 8,
      comments: 12,
      tags: ['Event', 'AI Club', 'Free Food'],
      isPinned: true,
      moderationBadge: ModerationBadge.PINNED
    },
    {
      id: '3',
      author: { name: 'ESPRIT Official', badge: 'Official' },
      category: 'General Discussion',
      categoryColor: 'bg-blue-500',
      title: 'Important: New Library Hours Starting Next Week',
      content: 'Starting next Monday, the library will have extended hours from 7 AM to 11 PM on weekdays. Weekend hours remain unchanged.',
      time: new Date(Date.now() - 24 * 60 * 60 * 1000),
      likes: 45,
      loves: 12,
      comments: 8,
      tags: ['Announcement', 'Library'],
      isPinned: true,
      moderationBadge: ModerationBadge.OFFICIAL
    },
    {
      id: '4',
      author: { name: 'Yassine R.' },
      category: 'Tech & Projects',
      categoryColor: 'bg-orange-500',
      title: 'Looking for teammates for PFE project - Mobile App',
      content: 'I\'m working on a mobile app for campus navigation and looking for 2 teammates. Tech stack: React Native, Firebase. DM if interested!',
      time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      likes: 18,
      loves: 5,
      comments: 15,
      tags: ['PFE', 'Mobile', 'Team'],
      userReaction: ReactionType.LIKE
    },
    {
      id: '5',
      author: { name: 'Meriam L.' },
      category: 'Jobs & Internships',
      categoryColor: 'bg-purple-500',
      title: 'Internship Experience at Vermeg - AMA',
      content: 'Just finished my 6-month internship at Vermeg. Happy to answer any questions about the application process, daily work, and what they look for in candidates.',
      time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      likes: 56,
      loves: 15,
      comments: 32,
      tags: ['Internship', 'Experience', 'AMA'],
      moderationBadge: ModerationBadge.TRENDING
    }
  ]);

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
        filtered = [...filtered].sort((a, b) => (b.likes + b.loves) - (a.likes + a.loves));
        break;
      case 'comments':
        filtered = [...filtered].sort((a, b) => b.comments - a.comments);
        break;
      case 'recent':
      default:
        filtered = [...filtered].sort((a, b) => b.time.getTime() - a.time.getTime());
        break;
    }

    // Pinned posts first
    return [...filtered.filter(p => p.isPinned), ...filtered.filter(p => !p.isPinned)];
  });

  ngOnInit(): void {
    this.initForms();
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

    setTimeout(() => {
      const newPost: SimplePost = {
        id: 'new-' + Date.now(),
        author: { name: 'You' },
        category: category?.name || 'General',
        categoryColor: category?.color || 'bg-blue-500',
        title: formValue.title,
        content: formValue.content,
        time: new Date(),
        likes: 0,
        loves: 0,
        comments: 0,
        tags: formValue.tags ? formValue.tags.split(',').map((t: string) => t.trim()) : []
      };

      this.posts.update(posts => [newPost, ...posts]);
      this.isCreatingPost.set(false);
      this.closeCreatePostModal();
    }, 1000);
  }

  togglePostExpansion(postId: string): void {
    this.expandedPostId.set(this.expandedPostId() === postId ? null : postId);
  }

  reactToPost(postId: string, reaction: ReactionType): void {
    this.posts.update(posts =>
      posts.map(p => {
        if (p.id === postId) {
          const wasReacted = p.userReaction === reaction;
          return {
            ...p,
            userReaction: wasReacted ? undefined : reaction,
            likes: reaction === ReactionType.LIKE ? (wasReacted ? p.likes - 1 : p.likes + 1) : p.likes,
            loves: reaction === ReactionType.LOVE ? (wasReacted ? p.loves - 1 : p.loves + 1) : p.loves
          };
        }
        return p;
      })
    );
  }

  submitComment(postId: string): void {
    if (this.commentForm.invalid) return;
    
    // Mock comment submission
    console.log('Submitting comment for post:', postId, this.commentForm.value);
    
    this.posts.update(posts =>
      posts.map(p => p.id === postId ? { ...p, comments: p.comments + 1 } : p)
    );
    
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
