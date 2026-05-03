import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';
import { environment } from '../../../environment';
import {
  ForumCategory,
  Post,
  PostListResponse,
  PostFilter,
  CreatePostRequest,
  UpdatePostRequest,
  CreateCommentRequest,
  ReactionType,
  Group,
  GroupListResponse,
  GroupFilter,
  CreateGroupRequest,
  GroupMember,
  Conversation,
  Message,
  SendMessageRequest,
  CreateConversationRequest
} from '../models/forum.model';

// Backend DTOs (Spring Boot)
// Note: your current frontend `forum.model.ts` is richer than the backend DTOs.
// We keep these lightweight DTOs here and map them in the forum page.
export interface CategoryForumDto {
  id: string;
  name: string;
  description: string;
}

export interface CategoryForumRequestDto {
  name: string;
  description: string;
}

export interface PostDto {
  id: string;
  userId: string;
  categoryId: string;
  content: string;
  createdAt: string; // LocalDateTime serialized as string
  pinned: boolean;
  approved: boolean;
  commentIds: string[];
  reactionIds: string[];
  recommendedPosts?: RecommendedForumPostDto[];
}

export interface RecommendedForumPostDto {
  postId: string;
  title: string;
  excerpt: string;
  content: string;
  categoryId?: string;
  category?: string;
  score: number;
  source: string;
}

export interface CommentDto {
  id: string;
  postId: string;
  userId: string;
  parentCommentId?: string;
  content: string;
  createdAt: string; // LocalDateTime serialized as string
  reactionIds: string[];
}

export interface ReplyDto {
  id: string;
  commentId: string;
  userId: string;
  content: string;
  createdAt: string; // LocalDateTime serialized as string
}

export interface UserNameDto {
  id: string;
  firstName: string;
  lastName: string;
}

export interface ReactionDto {
  id: string;
  type: string;
  userId: string;
  postId?: string;
  commentId?: string;
  createdAt: string; // LocalDateTime serialized as string
}

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  readonly categories = signal<ForumCategory[]>([]);
  readonly posts = signal<Post[]>([]);
  readonly currentPost = signal<Post | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor() {}

  private getUserIdOrThrow(): string {
    const userId = localStorage.getItem('userId');
    if (!userId) throw new Error('Missing userId in localStorage');
    return userId;
  }

  // Used to display authors as "firstName lastName" instead of only userId.
  getUserById(id: string): Observable<UserNameDto> {
    return this.http.get<UserNameDto>(`${this.apiUrl}/users/${id}`);
  }

  // Categories
  getCategories(): Observable<CategoryForumDto[]> {
    return this.http.get<CategoryForumDto[]>(`${this.apiUrl}/forum/categories`);
  }

  createCategory(request: CategoryForumRequestDto): Observable<CategoryForumDto> {
    return this.http.post<CategoryForumDto>(`${this.apiUrl}/forum/categories`, request);
  }

  updateCategory(id: string, request: CategoryForumRequestDto): Observable<CategoryForumDto> {
    return this.http.put<CategoryForumDto>(`${this.apiUrl}/forum/categories/${id}`, request);
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/forum/categories/${id}`);
  }

  getCategoryBySlug(slug: string): Observable<ForumCategory> {
    // TODO: Implement HTTP call
    console.log('ForumService.getCategoryBySlug() called with:', slug);
    return of({} as ForumCategory);
  }

  // Posts
  getPosts(filter?: PostFilter): Observable<PostDto[]> {
    // Backend currently exposes only "getAll posts" (no advanced filtering).
    return this.http.get<PostDto[]>(`${this.apiUrl}/forum/posts`);
  }

  getPostById(id: string): Observable<Post> {
    // TODO: Implement HTTP call
    console.log('ForumService.getPostById() called with:', id);
    return of({} as Post);
  }

  getPostBySlug(slug: string): Observable<Post> {
    // TODO: Implement HTTP call
    console.log('ForumService.getPostBySlug() called with:', slug);
    return of({} as Post);
  }

  getPostRecommendations(id: string): Observable<RecommendedForumPostDto[]> {
    return this.http.get<RecommendedForumPostDto[]>(
      `${this.apiUrl}/forum/posts/${id}/recommendations`
    );
  }

  /**
   * Semantic search using all-MiniLM-L6-v2 + FAISS.
   * Returns posts semantically similar to the query, even with different wording.
   */
  semanticSearch(query: string, topK: number = 8): Observable<RecommendedForumPostDto[]> {
    const params = new HttpParams()
      .set('q', query)
      .set('topK', topK.toString());
    return this.http.get<RecommendedForumPostDto[]>(
      `${this.apiUrl}/forum/posts/search`, { params }
    ).pipe(catchError(() => of([])));
  }

  createPost(request: CreatePostRequest): Observable<PostDto> {
    const userId = this.getUserIdOrThrow();

    // Backend has no `title` field, so we store it as the first line in `content`.
    const title = request.title?.trim() ?? '';
    const content = request.content?.trim() ?? '';
    const body = {
      userId,
      categoryId: request.categoryId,
      content: title ? `${title}\n${content}` : content,
      pinned: false,
      approved: true
    };

    return this.http.post<PostDto>(`${this.apiUrl}/forum/posts`, body);
  }

  updatePost(
    id: string,
    payload: {
      categoryId: string;
      title: string;
      content: string;
      pinned?: boolean;
      approved?: boolean;
    }
  ): Observable<PostDto> {
    const userId = this.getUserIdOrThrow();

    const body = {
      userId,
      categoryId: payload.categoryId,
      content: payload.title ? `${payload.title}\n${payload.content}` : payload.content,
      pinned: payload.pinned,
      approved: payload.approved
    };

    return this.http.put<PostDto>(`${this.apiUrl}/forum/posts/${id}`, body);
  }

  deletePost(id: string): Observable<void> {
    console.log('ForumService.deletePost() called with:', id);
    return this.http.delete<void>(`${this.apiUrl}/forum/posts/${id}`);
  }

  // Comments
  getComments(postId?: string): Observable<CommentDto[]> {
    return this.http.get<CommentDto[]>(`${this.apiUrl}/forum/comments`).pipe(
      map((comments: CommentDto[]) => {
        if (!postId) return comments;
        return comments.filter((c: CommentDto) => c.postId === postId);
      })
    );
  }

  createComment(request: CreateCommentRequest): Observable<CommentDto> {
    const userId = this.getUserIdOrThrow();

    const body = {
      postId: request.postId,
      userId,
      parentCommentId: request.parentId,
      content: request.content
    };

    return this.http.post<CommentDto>(`${this.apiUrl}/forum/comments`, body);
  }

  updateComment(
    id: string,
    payload: { postId: string; parentId?: string; content: string }
  ): Observable<CommentDto> {
    const userId = this.getUserIdOrThrow();

    const body = {
      postId: payload.postId,
      userId,
      parentCommentId: payload.parentId,
      content: payload.content
    };

    return this.http.put<CommentDto>(`${this.apiUrl}/forum/comments/${id}`, body);
  }

  deleteComment(id: string): Observable<void> {
    console.log('ForumService.deleteComment() called with:', id);
    return this.http.delete<void>(`${this.apiUrl}/forum/comments/${id}`);
  }

  // Reactions
  addReaction(
    targetId: string,
    targetType: 'post' | 'comment',
    reaction: ReactionType
  ): Observable<ReactionDto> {
    const userId = this.getUserIdOrThrow();

    const body: {
      type: ReactionType;
      userId: string;
      postId?: string;
      commentId?: string;
    } = {
      type: reaction,
      userId
    };

    if (targetType === 'post') body.postId = targetId;
    else body.commentId = targetId;

    return this.http.post<ReactionDto>(`${this.apiUrl}/forum/reactions`, body);
  }

  // Bug 5: Specific endpoint for FLAME reaction
  reactToPostFlame(postId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/forum/posts/${postId}/react`, { type: 'FLAME' });
  }

  removeReaction(
    targetId: string,
    targetType: 'post' | 'comment',
    reaction: ReactionType
  ): Observable<void> {
    const userId = this.getUserIdOrThrow();

    return this.http.get<ReactionDto[]>(`${this.apiUrl}/forum/reactions`).pipe(
      map((reactions: ReactionDto[]) => {
        const match = reactions.find((r: ReactionDto) => {
          const sameTarget =
            targetType === 'post' ? r.postId === targetId : r.commentId === targetId;
          return sameTarget && r.userId === userId && r.type === reaction;
        });

        if (match) {
          // Delete the reaction
          this.http.delete(`${this.apiUrl}/forum/reactions/${match.id}`).subscribe();
        }
      }),
      map(() => void 0)
    );
  }

  // Used to compute likes/loves/comments counts on the forum page.
  getReactions(): Observable<ReactionDto[]> {
    return this.http.get<ReactionDto[]>(`${this.apiUrl}/forum/reactions`);
  }

  // Replies
  getReplies(commentId?: string): Observable<ReplyDto[]> {
    return this.http.get<ReplyDto[]>(`${this.apiUrl}/forum/replies`).pipe(
      map((replies: ReplyDto[]) => {
        if (!commentId) return replies;
        return replies.filter((r: ReplyDto) => r.commentId === commentId);
      })
    );
  }

  createReply(request: { commentId: string; content: string }): Observable<ReplyDto> {
    const userId = this.getUserIdOrThrow();

    const body = {
      commentId: request.commentId,
      userId,
      content: request.content
    };

    return this.http.post<ReplyDto>(`${this.apiUrl}/forum/replies`, body);
  }

  updateReply(id: string, payload: { commentId: string; content: string }): Observable<ReplyDto> {
    const userId = this.getUserIdOrThrow();

    const body = {
      commentId: payload.commentId,
      userId,
      content: payload.content
    };

    return this.http.put<ReplyDto>(`${this.apiUrl}/forum/replies/${id}`, body);
  }

  deleteReply(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/forum/replies/${id}`);
  }
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/groups`;

  readonly groups = signal<Group[]>([]);
  readonly currentGroup = signal<Group | null>(null);
  readonly members = signal<GroupMember[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor() {}

  getGroups(filter?: GroupFilter): Observable<GroupListResponse> {
    // TODO: Implement HTTP call
    console.log('GroupService.getGroups() called with:', filter);
    return of({ groups: [], total: 0, page: 1, totalPages: 0 });
  }

  getGroupById(id: string): Observable<Group> {
    // TODO: Implement HTTP call
    console.log('GroupService.getGroupById() called with:', id);
    return of({} as Group);
  }

  getMyGroups(): Observable<Group[]> {
    // TODO: Implement HTTP call
    console.log('GroupService.getMyGroups() called');
    return of([]);
  }

  createGroup(request: CreateGroupRequest): Observable<Group> {
    // TODO: Implement HTTP call
    console.log('GroupService.createGroup() called with:', request);
    return of({} as Group);
  }

  updateGroup(id: string, request: Partial<CreateGroupRequest>): Observable<Group> {
    // TODO: Implement HTTP call
    console.log('GroupService.updateGroup() called with:', id, request);
    return of({} as Group);
  }

  deleteGroup(id: string): Observable<void> {
    // TODO: Implement HTTP call
    console.log('GroupService.deleteGroup() called with:', id);
    return of(void 0);
  }

  joinGroup(groupId: string): Observable<void> {
    // TODO: Implement HTTP call
    console.log('GroupService.joinGroup() called with:', groupId);
    return of(void 0);
  }

  leaveGroup(groupId: string): Observable<void> {
    // TODO: Implement HTTP call
    console.log('GroupService.leaveGroup() called with:', groupId);
    return of(void 0);
  }

  getMembers(groupId: string): Observable<GroupMember[]> {
    // TODO: Implement HTTP call
    console.log('GroupService.getMembers() called with:', groupId);
    return of([]);
  }
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/chat`;

  readonly conversations = signal<Conversation[]>([]);
  readonly currentConversation = signal<Conversation | null>(null);
  readonly messages = signal<Message[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isTyping = signal<boolean>(false);

  constructor() {}

  getConversations(): Observable<Conversation[]> {
    // TODO: Implement HTTP call
    console.log('ChatService.getConversations() called');
    return of([]);
  }

  getConversationById(id: string): Observable<Conversation> {
    // TODO: Implement HTTP call
    console.log('ChatService.getConversationById() called with:', id);
    return of({} as Conversation);
  }

  createConversation(request: CreateConversationRequest): Observable<Conversation> {
    // TODO: Implement HTTP call
    console.log('ChatService.createConversation() called with:', request);
    return of({} as Conversation);
  }

  getMessages(conversationId: string, page = 1): Observable<Message[]> {
    // TODO: Implement HTTP call
    console.log('ChatService.getMessages() called with:', conversationId, page);
    return of([]);
  }

  sendMessage(request: SendMessageRequest): Observable<Message> {
    // TODO: Implement HTTP call
    console.log('ChatService.sendMessage() called with:', request);
    return of({} as Message);
  }

  markAsRead(conversationId: string): Observable<void> {
    // TODO: Implement HTTP call
    console.log('ChatService.markAsRead() called with:', conversationId);
    return of(void 0);
  }

  deleteMessage(messageId: string): Observable<void> {
    // TODO: Implement HTTP call
    console.log('ChatService.deleteMessage() called with:', messageId);
    return of(void 0);
  }

  // Typing indicator placeholder
  sendTypingIndicator(conversationId: string): void {
    console.log('ChatService.sendTypingIndicator() called with:', conversationId);
  }
}
