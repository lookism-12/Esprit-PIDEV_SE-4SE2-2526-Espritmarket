import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import axios, { AxiosInstance } from 'axios';
import { from, Observable, of } from 'rxjs';
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
  private readonly http: AxiosInstance;

  readonly categories = signal<ForumCategory[]>([]);
  readonly posts = signal<Post[]>([]);
  readonly currentPost = signal<Post | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor() {
    // baseURL already includes `/api` (see `environment.ts`)
    this.http = axios.create({ baseURL: environment.apiUrl, timeout: 10000 });

    // Replicate your `JwtInterceptor` behavior for axios.
    this.http.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers = config.headers ?? {};
        (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
      return config;
    });
  }

  private getUserIdOrThrow(): string {
    const userId = localStorage.getItem('userId');
    if (!userId) throw new Error('Missing userId in localStorage');
    return userId;
  }

  // Used to display authors as "firstName lastName" instead of only userId.
  getUserById(id: string): Observable<UserNameDto> {
    return from(this.http.get<UserNameDto>(`/users/${id}`).then((res) => res.data));
  }

  // Categories
  getCategories(): Observable<CategoryForumDto[]> {
    return from(this.http.get<CategoryForumDto[]>('/forum/categories').then((res) => res.data));
  }

  createCategory(request: CategoryForumRequestDto): Observable<CategoryForumDto> {
    return from(this.http.post<CategoryForumDto>('/forum/categories', request).then((res) => res.data));
  }

  updateCategory(id: string, request: CategoryForumRequestDto): Observable<CategoryForumDto> {
    return from(this.http.put<CategoryForumDto>(`/forum/categories/${id}`, request).then((res) => res.data));
  }

  deleteCategory(id: string): Observable<void> {
    return from(this.http.delete(`/forum/categories/${id}`).then(() => undefined));
  }

  getCategoryBySlug(slug: string): Observable<ForumCategory> {
    // TODO: Implement HTTP call
    console.log('ForumService.getCategoryBySlug() called with:', slug);
    return of({} as ForumCategory);
  }

  // Posts
  getPosts(filter?: PostFilter): Observable<PostDto[]> {
    // Backend currently exposes only "getAll posts" (no advanced filtering).
    void filter;
    return from(this.http.get<PostDto[]>('/forum/posts').then((res) => res.data));
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

    return from(this.http.post<PostDto>('/forum/posts', body).then((res) => res.data));
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

    return from(this.http.put<PostDto>(`/forum/posts/${id}`, body).then((res) => res.data));
  }

  deletePost(id: string): Observable<void> {
    console.log('ForumService.deletePost() called with:', id);
    return from(this.http.delete(`/forum/posts/${id}`).then(() => undefined));
  }

  // Comments
  getComments(postId?: string): Observable<CommentDto[]> {
    return from(this.http.get<CommentDto[]>('/forum/comments').then((res) => {
      if (!postId) return res.data;
      return res.data.filter((c) => c.postId === postId);
    }));
  }

  createComment(request: CreateCommentRequest): Observable<CommentDto> {
    const userId = this.getUserIdOrThrow();

    const body = {
      postId: request.postId,
      userId,
      parentCommentId: request.parentId,
      content: request.content
    };

    return from(this.http.post<CommentDto>('/forum/comments', body).then((res) => res.data));
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

    return from(
      this.http.put<CommentDto>(`/forum/comments/${id}`, body).then((res) => res.data)
    );
  }

  deleteComment(id: string): Observable<void> {
    console.log('ForumService.deleteComment() called with:', id);
    return from(this.http.delete(`/forum/comments/${id}`).then(() => undefined));
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

    return from(this.http.post<ReactionDto>('/forum/reactions', body).then((res) => res.data));
  }

  removeReaction(
    targetId: string,
    targetType: 'post' | 'comment',
    reaction: ReactionType
  ): Observable<void> {
    const userId = this.getUserIdOrThrow();

    return from(
      this.http.get<ReactionDto[]>('/forum/reactions').then(async (res) => {
        const match = res.data.find((r) => {
          const sameTarget =
            targetType === 'post' ? r.postId === targetId : r.commentId === targetId;
          return sameTarget && r.userId === userId && r.type === reaction;
        });

        if (!match) return;
        await this.http.delete(`/forum/reactions/${match.id}`);
      })
    );
  }

  // Used to compute likes/loves/comments counts on the forum page.
  getReactions(): Observable<ReactionDto[]> {
    return from(this.http.get<ReactionDto[]>('/forum/reactions').then((res) => res.data));
  }

  // Replies
  getReplies(commentId?: string): Observable<ReplyDto[]> {
    return from(this.http.get<ReplyDto[]>('/forum/replies').then((res) => {
      if (!commentId) return res.data;
      return res.data.filter((r) => r.commentId === commentId);
    }));
  }

  createReply(request: { commentId: string; content: string }): Observable<ReplyDto> {
    const userId = this.getUserIdOrThrow();

    const body = {
      commentId: request.commentId,
      userId,
      content: request.content
    };

    return from(this.http.post<ReplyDto>('/forum/replies', body).then((res) => res.data));
  }

  updateReply(id: string, payload: { commentId: string; content: string }): Observable<ReplyDto> {
    const userId = this.getUserIdOrThrow();

    const body = {
      commentId: payload.commentId,
      userId,
      content: payload.content
    };

    return from(this.http.put<ReplyDto>(`/forum/replies/${id}`, body).then((res) => res.data));
  }

  deleteReply(id: string): Observable<void> {
    return from(this.http.delete(`/forum/replies/${id}`).then(() => undefined));
  }
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private readonly apiUrl = '/api/groups';

  readonly groups = signal<Group[]>([]);
  readonly currentGroup = signal<Group | null>(null);
  readonly members = signal<GroupMember[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

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
  private readonly apiUrl = '/api/chat';

  readonly conversations = signal<Conversation[]>([]);
  readonly currentConversation = signal<Conversation | null>(null);
  readonly messages = signal<Message[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isTyping = signal<boolean>(false);

  constructor(private http: HttpClient) {}

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
