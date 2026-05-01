import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, of, switchMap } from 'rxjs';
import { ForumCategory, ModerationBadge, ReactionType, CreatePostRequest, CreateCommentRequest } from '../../models/forum.model';
import { ForumService, UserNameDto, PostDto, CategoryForumDto, CommentDto, ReactionDto, ReplyDto, RecommendedForumPostDto } from '../../core/forum.service';

interface SimplePost {
  id: string;
  authorId: string;
  author: {
    name: string;
    avatar?: string;
    badge?: string;
  };
  category: string;
  categoryId: string;
  categoryColor: string;
  title: string;
  content: string;
  time: Date;
  likes: number;
  loves: number;
  comments: number;
  tags: string[];
  isPinned?: boolean;
  approved: boolean;
  isLocked?: boolean;
  flames: number;
  moderationBadge?: ModerationBadge;
  userReaction?: ReactionType;
}

interface ForumReplyUI {
  id: string;
  commentId: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

interface ForumCommentUI {
  id: string;
  postId: string;
  authorId: string;
  parentCommentId?: string;
  content: string;
  createdAt: Date;
  replies: ForumReplyUI[];
}

import { ForumChatWidget } from '../../shared/components/forum-chat-widget/forum-chat-widget';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ForumChatWidget],
  templateUrl: './forum.html',
  styleUrl: './forum.scss',
})
export class Forum implements OnInit {
  private formBuilder = inject(FormBuilder);
  public chatService = inject(ChatService);
  private authService = inject(AuthService);
  private forumService: ForumService = inject(ForumService);

  readonly ReactionType = ReactionType;

  // Display names loaded from backend (userId -> "firstName lastName")
  readonly userNames = signal<Record<string, string>>({});

  private usersPrefetched = new Set<string>();
  private usersPrefetchInFlight = new Set<string>();

  // State
  activeCategory = signal<string>('all');
  searchQuery = signal<string>('');
  sortBy = signal<'recent' | 'popular' | 'comments'>('recent');
  showCreatePostModal = signal(false);
  showUpdatePostModal = signal(false);
  isCreatingPost = signal(false);
  expandedPostId = signal<string | null>(null);
  expandedComments = signal<ForumCommentUI[]>([]);
  expandedPostCommentsLoading = signal<boolean>(false);
  updatePostTarget = signal<SimplePost | null>(null);
  latestRecommendations = signal<RecommendedForumPostDto[]>([]);

  // Admin category management modal
  showManageCategoriesModal = signal(false);
  editingCategoryId = signal<string | null>(null);
  isSavingCategory = signal(false);

  // Forms
  createPostForm!: FormGroup;
  updatePostForm!: FormGroup;
  commentForm!: FormGroup;
  editCommentForm!: FormGroup;
  replyForm!: FormGroup;
  activeReplyingCommentId = signal<string | null>(null);

  editingCommentId = signal<string | null>(null);
  categoryForm!: FormGroup;

  // Categories
  categories = signal<ForumCategory[]>([]);

  // Posts
  posts = signal<SimplePost[]>([]);

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
        p.tags.some(t => t.toLowerCase().includes(query)) ||
        p.category.toLowerCase().includes(query) ||
        this.getUserDisplayName(p.authorId).toLowerCase().includes(query)
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
    this.loadForumData();
  }

  private initForms(): void {
    this.createPostForm = this.formBuilder.group({
      categoryId: ['', Validators.required],
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.minLength(20)]],
      tags: ['']
    });

    this.updatePostForm = this.formBuilder.group({
      categoryId: ['', Validators.required],
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.minLength(20)]],
      pinned: [false],
      approved: [false]
    });

    this.commentForm = this.formBuilder.group({
      content: ['', [Validators.required, Validators.minLength(2)]]
    });

    this.editCommentForm = this.formBuilder.group({
      content: ['', [Validators.required, Validators.minLength(2)]]
    });

    this.categoryForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]]
    });

    this.replyForm = this.formBuilder.group({
      content: ['', [Validators.required, Validators.minLength(1)]]
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

  closeUpdatePostModal(): void {
    this.showUpdatePostModal.set(false);
    this.updatePostTarget.set(null);
    this.updatePostForm.reset({
      categoryId: '',
      title: '',
      content: '',
      pinned: false,
      approved: false
    });
  }

  getUserDisplayName(userId: string): string {
    return this.userNames()[userId] ?? userId;
  }

  private prefetchUserNames(userIds: string[]): void {
    const unique = Array.from(new Set(userIds)).filter(Boolean);
    const toFetch = unique.filter((id) => !this.usersPrefetched.has(id) && !this.usersPrefetchInFlight.has(id));
    if (toFetch.length === 0) return;

    toFetch.forEach((id) => {
      this.usersPrefetchInFlight.add(id);
      this.forumService.getUserById(id).subscribe({
        next: (u: UserNameDto) => {
          const fullName = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
          this.userNames.set({ ...this.userNames(), [id]: fullName || id });
          this.usersPrefetched.add(id);
          this.usersPrefetchInFlight.delete(id);
        },
        error: () => {
          // Keep fallback as userId if the user service is protected or fails.
          this.usersPrefetched.add(id);
          this.usersPrefetchInFlight.delete(id);
        }
      });
    });
  }

  openManageCategories(): void {
    if (!this.isAdmin()) return;
    this.editingCategoryId.set(null);
    this.categoryForm.reset({ name: '', description: '' });
    this.showManageCategoriesModal.set(true);
  }

  openEditCategory(cat: ForumCategory): void {
    if (!this.isAdmin()) return;
    this.editingCategoryId.set(cat.id);
    this.categoryForm.patchValue({
      name: cat.name,
      description: cat.description
    });
    this.showManageCategoriesModal.set(true);
  }

  closeManageCategories(): void {
    this.showManageCategoriesModal.set(false);
    this.editingCategoryId.set(null);
    this.categoryForm.reset({ name: '', description: '' });
  }

  submitCategory(): void {
    if (!this.isAdmin()) return;
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const { name, description } = this.categoryForm.value as { name: string; description: string };
    const payload = { name: String(name).trim(), description: String(description).trim() };

    const editingId = this.editingCategoryId();
    this.isSavingCategory.set(true);

    if (!editingId) {
      this.forumService.createCategory(payload).subscribe({
        next: () => {
          this.isSavingCategory.set(false);
          this.closeManageCategories();
          this.loadForumData();
        },
        error: (err: unknown) => {
          console.error('Failed to create category:', err);
          this.isSavingCategory.set(false);
        }
      });
      return;
    }

    this.forumService.updateCategory(editingId, payload).subscribe({
      next: () => {
        this.isSavingCategory.set(false);
        this.closeManageCategories();
        this.loadForumData();
      },
      error: (err) => {
        console.error('Failed to update category:', err);
        this.isSavingCategory.set(false);
      }
    });
  }

  deleteCategory(cat: ForumCategory): void {
    if (!this.isAdmin()) return;
    if (!confirm(`Delete category "${cat.name}"?`)) return;

    this.isSavingCategory.set(true);
    this.forumService.deleteCategory(cat.id).subscribe({
      next: () => {
        this.isSavingCategory.set(false);
        this.closeManageCategories();
        this.loadForumData();
      },
      error: (err) => {
        console.error('Failed to delete category:', err);
        this.isSavingCategory.set(false);
      }
    });
  }

  openUpdatePostModal(post: SimplePost): void {
    if (!this.canManagePost(post)) return;

    this.updatePostTarget.set(post);
    this.updatePostForm.patchValue({
      categoryId: post.categoryId,
      title: post.title,
      content: post.content,
      pinned: !!post.isPinned,
      approved: !!post.approved
    });
    this.showUpdatePostModal.set(true);
  }

  isAdmin(): boolean {
    const role = localStorage.getItem('userRole') ?? '';
    return role.toUpperCase().includes('ADMIN');
  }

  private getCurrentUserId(): string | null {
    return localStorage.getItem('userId');
  }

  canManagePost(post: SimplePost): boolean {
    const currentUserId = this.getCurrentUserId();
    return this.isAdmin() || (currentUserId !== null && post.authorId === currentUserId);
  }

  canManageComment(comment: ForumCommentUI): boolean {
    const currentUserId = this.getCurrentUserId();
    return this.isAdmin() || (currentUserId !== null && comment.authorId === currentUserId);
  }

  canManageReply(reply: ForumReplyUI): boolean {
    const currentUserId = this.getCurrentUserId();
    return this.isAdmin() || (currentUserId !== null && reply.authorId === currentUserId);
  }

  createPost(): void {
    if (this.createPostForm.invalid) {
      this.createPostForm.markAllAsTouched();
      return;
    }

    this.isCreatingPost.set(true);
    const formValue = this.createPostForm.value;

    const tags = formValue.tags ? (String(formValue.tags).split(',').map((t: string) => t.trim()).filter(Boolean)) : [];

    const request: CreatePostRequest = {
      categoryId: formValue.categoryId,
      title: formValue.title,
      content: formValue.content,
      tags
    };

    this.forumService.createPost(request).subscribe({
      next: (createdPost) => {
        this.latestRecommendations.set(createdPost.recommendedPosts ?? []);
        this.isCreatingPost.set(false);
        this.closeCreatePostModal();
        this.loadForumData();
      },
      error: (err) => {
        console.error('Failed to create post:', err);
        this.isCreatingPost.set(false);
      }
    });
  }

  openRecommendedPost(recommendation: RecommendedForumPostDto): void {
    const existing = this.posts().find((post) => post.id === recommendation.postId);
    if (existing) {
      this.activeCategory.set('all');
      this.searchQuery.set('');
      this.togglePostExpansion(existing.id);
      return;
    }

    this.searchQuery.set(recommendation.title);
  }

  recommendationScore(recommendation: RecommendedForumPostDto): number {
    return Math.round((recommendation.score ?? 0) * 100);
  }

  togglePostExpansion(postId: string): void {
    const isOpening = this.expandedPostId() !== postId;
    this.expandedPostId.set(isOpening ? postId : null);

    if (!isOpening) {
      this.expandedComments.set([]);
      this.activeReplyingCommentId.set(null);
      return;
    }

    this.loadCommentsAndReplies(postId);
  }

  reactToPost(postId: string, reaction: ReactionType): void {
    const post = this.posts().find((p) => p.id === postId);
    if (!post) return;

    const previous = post.userReaction;
    const wasSameReaction = previous === reaction;

    if (reaction === ReactionType.FLAME) {
      // Bug 5: Specific logic for Flame
      this.forumService.reactToPostFlame(postId).subscribe({
        next: () => {
          this.posts.update(posts => posts.map(p => {
            if (p.id !== postId) return p;
            return {
              ...p,
              flames: p.flames + 1,
              userReaction: ReactionType.FLAME
            };
          }));
        },
        error: (err) => console.error('Failed to add flame:', err)
      });
      return;
    }

    if (wasSameReaction) {
      this.forumService.removeReaction(postId, 'post', reaction).subscribe({
        next: () => {
          this.posts.update((posts) =>
            posts.map((p) => {
              if (p.id !== postId) return p;
              const rStr = reaction as any;
              return {
                ...p,
                userReaction: undefined,
                likes: rStr === 'LIKE' ? Math.max(0, p.likes - 1) : p.likes,
                loves: rStr === 'LOVE' ? Math.max(0, p.loves - 1) : p.loves,
                flames: rStr === 'FLAME' ? Math.max(0, p.flames - 1) : p.flames
              };
            })
          );
        },
        error: (err) => console.error('Failed to remove reaction:', err)
      });

      return;
    }

    const remove$ = previous ? this.forumService.removeReaction(postId, 'post', previous as any) : of(void 0);
    remove$
      .pipe(switchMap(() => this.forumService.addReaction(postId, 'post', reaction)))
      .subscribe({
        next: () => {
          this.posts.update((posts) =>
            posts.map((p) => {
              if (p.id !== postId) return p;

              // Remove previous local reaction counts (if any), then add the new one.
              let likes = p.likes;
              let loves = p.loves;
              let flames = p.flames;

              const prevStr = previous as any;
              if (prevStr === 'LIKE') likes = Math.max(0, likes - 1);
              if (prevStr === 'LOVE') loves = Math.max(0, loves - 1);
              if (prevStr === 'FLAME') flames = Math.max(0, flames - 1);

              const rStr = reaction as any;
              if (rStr === 'LIKE') likes += 1;
              if (rStr === 'LOVE') loves += 1;
              if (rStr === 'FLAME') flames += 1;

              return {
                ...p,
                userReaction: reaction,
                likes,
                loves,
                flames
              };
            })
          );
        },
        error: (err) => console.error('Failed to add reaction:', err)
      });
  }

  submitComment(postId: string): void {
    if (this.commentForm.invalid) return;

    const content = this.commentForm.value.content;
    const request: CreateCommentRequest = { postId, content };

    this.forumService.createComment(request).subscribe({
      next: () => {
        this.commentForm.reset();
        this.loadCommentsAndReplies(postId);
      },
      error: (err) => {
        console.error('Failed to create comment:', err);
      }
    });
  }

  startReply(commentId: string): void {
    this.activeReplyingCommentId.set(commentId);
    this.replyForm.reset();
  }

  submitReply(): void {
    const commentId = this.activeReplyingCommentId();
    if (!commentId) return;
    if (this.replyForm.invalid) return;

    const content = this.replyForm.value.content;

    this.forumService.createReply({ commentId, content }).subscribe({
      next: () => {
        this.replyForm.reset();
        this.activeReplyingCommentId.set(null);

        const postId = this.expandedPostId();
        if (postId) this.loadCommentsAndReplies(postId);
      },
      error: (err) => {
        console.error('Failed to create reply:', err);
      }
    });
  }

  openMessage(authorId: string) {
    const currentUserId = this.authService.userId() || localStorage.getItem('userId') || '';
    this.chatService.openChatPopup(currentUserId, authorId);
  }

  submitUpdatePost(): void {
    const target = this.updatePostTarget();
    if (!target) return;

    if (this.updatePostForm.invalid) {
      this.updatePostForm.markAllAsTouched();
      return;
    }

    const formValue = this.updatePostForm.value;

    this.forumService
      .updatePost(target.id, {
        categoryId: formValue.categoryId,
        title: String(formValue.title).trim(),
        content: String(formValue.content).trim(),
        pinned: !!formValue.pinned,
        approved: !!formValue.approved
      })
      .subscribe({
        next: () => {
          this.closeUpdatePostModal();
          this.loadForumData();
        },
        error: (err) => console.error('Failed to update post:', err)
      });
  }

  deletePost(post: SimplePost): void {
    if (!this.canManagePost(post)) return;
    if (!confirm('Delete this post?')) return;

    this.forumService.deletePost(post.id).subscribe({
      next: () => {
        this.expandedComments.set([]);
        this.activeReplyingCommentId.set(null);
        if (this.expandedPostId() === post.id) this.expandedPostId.set(null);
        this.loadForumData();
      },
      error: (err) => console.error('Failed to delete post:', err)
    });
  }

  updateComment(comment: ForumCommentUI): void {
    // Start inline editing (no top popup).
    if (!this.canManageComment(comment)) return;
    this.editingCommentId.set(comment.id);
    this.editCommentForm.patchValue({ content: comment.content });
  }

  cancelEditComment(): void {
    this.editingCommentId.set(null);
    this.editCommentForm.reset();
  }

  submitEditComment(comment: ForumCommentUI): void {
    if (!this.canManageComment(comment)) return;
    if (this.editCommentForm.invalid) {
      this.editCommentForm.markAllAsTouched();
      return;
    }

    const content = String(this.editCommentForm.value.content).trim();

    this.forumService
      .updateComment(comment.id, {
        postId: comment.postId,
        parentId: comment.parentCommentId,
        content
      })
      .subscribe({
        next: () => {
          this.cancelEditComment();
          this.loadCommentsAndReplies(comment.postId);
        },
        error: (err) => console.error('Failed to update comment:', err)
      });
  }

  deleteComment(comment: ForumCommentUI): void {
    if (!this.canManageComment(comment)) return;
    if (!confirm('Delete this comment?')) return;

    this.forumService.deleteComment(comment.id).subscribe({
      next: () => this.loadCommentsAndReplies(comment.postId),
      error: (err) => console.error('Failed to delete comment:', err)
    });
  }

  updateReply(reply: ForumReplyUI, postId: string): void {
    if (!this.canManageReply(reply)) return;

    const newContent = prompt('Edit reply:', reply.content);
    if (newContent === null) return;

    this.forumService
      .updateReply(reply.id, { commentId: reply.commentId, content: String(newContent).trim() })
      .subscribe({
        next: () => this.loadCommentsAndReplies(postId),
        error: (err) => console.error('Failed to update reply:', err)
      });
  }

  deleteReply(reply: ForumReplyUI, postId: string): void {
    if (!this.canManageReply(reply)) return;
    if (!confirm('Delete this reply?')) return;

    this.forumService.deleteReply(reply.id).subscribe({
      next: () => this.loadCommentsAndReplies(postId),
      error: (err) => console.error('Failed to delete reply:', err)
    });
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

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private extractTitleAndContent(rawContent: string): { title: string; content: string } {
    const normalized = String(rawContent ?? '');
    const [firstLine, ...restLines] = normalized.split(/\r?\n/);
    const title = (firstLine ?? '').trim();
    const content = restLines.join('\n').trim();

    if (title) return { title: title.slice(0, 120), content: content || normalized };
    return { title: normalized.slice(0, 60) + (normalized.length > 60 ? '...' : ''), content: normalized };
  }

  private loadForumData(): void {
    const colorPalette = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-primary'];
    const iconPalette = ['💬', '📚', '💼', '🎉', '💻', '🛒'];

    this.forumService.isLoading.set(true);

    forkJoin({
      categoriesDto: this.forumService.getCategories(),
      postsDto: this.forumService.getPosts(),
      commentsDto: this.forumService.getComments(),
      reactionsDto: this.forumService.getReactions()
    }).subscribe({
      next: ({ categoriesDto, postsDto, commentsDto, reactionsDto }) => {
        const postCountByCategoryId = postsDto.reduce((acc: Record<string, number>, p: PostDto) => {
          acc[p.categoryId] = (acc[p.categoryId] ?? 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const categoriesMapped: ForumCategory[] = categoriesDto.map((c: CategoryForumDto, idx: number) => ({
          id: c.id,
          name: c.name,
          slug: this.slugify(c.name),
          description: c.description,
          icon: iconPalette[idx % iconPalette.length],
          color: colorPalette[idx % colorPalette.length],
          postCount: postCountByCategoryId[c.id] ?? 0,
          isLocked: false,
          sortOrder: idx + 1,
          createdAt: new Date()
        }));

        const categoryById = new Map(categoriesMapped.map((c) => [c.id, c]));

        const commentCountByPostId = commentsDto.reduce((acc: Record<string, number>, c: CommentDto) => {
          acc[c.postId] = (acc[c.postId] ?? 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const currentUserId = localStorage.getItem('userId');

        const postsMapped: SimplePost[] = postsDto.map((p: PostDto) => {
          const cat = categoryById.get(p.categoryId);
          const { title, content } = this.extractTitleAndContent(p.content);

          const postReactions = reactionsDto.filter((r: ReactionDto) => r.postId === p.id);
          const likes = postReactions.filter((r: ReactionDto) => r.type === ReactionType.LIKE).length;
          const loves = postReactions.filter((r: ReactionDto) => r.type === ReactionType.LOVE).length;

          let userReaction: ReactionType | undefined = undefined;
          if (currentUserId) {
            const myLike = postReactions.find((r: ReactionDto) => r.userId === currentUserId && r.type === ReactionType.LIKE);
            const myLove = postReactions.find((r: ReactionDto) => r.userId === currentUserId && r.type === ReactionType.LOVE);
            if (myLike) userReaction = ReactionType.LIKE;
            else if (myLove) userReaction = ReactionType.LOVE;
          }

          const moderationBadge = p.pinned
            ? ModerationBadge.PINNED
            : p.approved
              ? ModerationBadge.OFFICIAL
              : undefined;

          return {
            id: p.id,
            authorId: p.userId,
            author: { name: p.userId },
            category: cat?.name ?? 'General',
            categoryId: p.categoryId,
            categoryColor: cat?.color ?? 'bg-blue-500',
            title,
            content,
            time: p.createdAt ? new Date(p.createdAt) : new Date(),
            likes,
            loves,
            comments: commentCountByPostId[p.id] ?? 0,
            tags: [],
            isPinned: p.pinned,
            approved: p.approved,
            moderationBadge,
            userReaction,
            flames: postReactions.filter((r: ReactionDto) => r.type === 'FLAME').length
          };
        });

        this.categories.set(categoriesMapped);
        this.posts.set(postsMapped);
        this.prefetchUserNames(postsDto.map((p: PostDto) => p.userId));
        this.forumService.isLoading.set(false);
      },
      error: (err: unknown) => {
        console.error('Failed to load forum data:', err);
        this.forumService.isLoading.set(false);
      }
    });
  }

  private loadCommentsAndReplies(postId: string): void {
    this.expandedPostCommentsLoading.set(true);
    this.activeReplyingCommentId.set(null);
    this.replyForm.reset();

    forkJoin({
      commentsDto: this.forumService.getComments(postId),
      repliesDto: this.forumService.getReplies()
    }).subscribe({
      next: ({ commentsDto, repliesDto }) => {
        const mapped: ForumCommentUI[] = commentsDto.map((c: CommentDto) => ({
          id: c.id,
          postId: c.postId,
          authorId: c.userId,
          parentCommentId: c.parentCommentId,
          content: c.content,
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
          replies: repliesDto
            .filter((r: ReplyDto) => r.commentId === c.id)
            .map((r: ReplyDto) => ({
              id: r.id,
              commentId: r.commentId,
              authorId: r.userId,
              content: r.content,
              createdAt: r.createdAt ? new Date(r.createdAt) : new Date()
            }))
        }));

        this.expandedComments.set(mapped);
        this.prefetchUserNames([
          ...commentsDto.map((c: CommentDto) => c.userId),
          ...repliesDto.map((r: ReplyDto) => r.userId)
        ]);

        // Ensure the comments counter is accurate after refresh
        this.posts.update((posts) =>
          posts.map((p) => (p.id === postId ? { ...p, comments: mapped.length } : p))
        );
        this.expandedPostCommentsLoading.set(false);
      },
      error: (err: unknown) => {
        console.error('Failed to load comments/replies:', err);
        this.expandedPostCommentsLoading.set(false);
      }
    });
  }
}
