import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CategoryForum {
  id?: string;
  name: string;
  description: string;
}

export interface Post {
  id?: string;
  userId: string;
  categoryId: string;
  content: string;
  createdAt?: string;
  pinned: boolean;
  approved: boolean;
  commentIds?: string[];
  reactionIds?: string[];
}

export interface Comment {
  id?: string;
  postId: string;
  userId: string;
  parentCommentId?: string;
  content: string;
  createdAt?: string;
  reactionIds?: string[];
}

export interface ForumStats {
  totalCategories: number;
  totalPosts: number;
  totalComments: number;
  pendingApprovals: number;
  recentActivity: any[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminForumService {
  private http = inject(HttpClient);
  private readonly API_URL = '/api/forum';

  // Categories
  getCategories(): Observable<CategoryForum[]> {
    return this.http.get<CategoryForum[]>(`${this.API_URL}/categories`);
  }

  getCategory(id: string): Observable<CategoryForum> {
    return this.http.get<CategoryForum>(`${this.API_URL}/categories/${id}`);
  }

  createCategory(category: Omit<CategoryForum, 'id'>): Observable<CategoryForum> {
    return this.http.post<CategoryForum>(`${this.API_URL}/categories`, category);
  }

  updateCategory(id: string, category: Omit<CategoryForum, 'id'>): Observable<CategoryForum> {
    return this.http.put<CategoryForum>(`${this.API_URL}/categories/${id}`, category);
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/categories/${id}`);
  }

  // Posts
  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.API_URL}/posts`);
  }

  getPost(id: string): Observable<Post> {
    return this.http.get<Post>(`${this.API_URL}/posts/${id}`);
  }

  updatePost(id: string, post: Partial<Post>): Observable<Post> {
    return this.http.put<Post>(`${this.API_URL}/posts/${id}`, post);
  }

  deletePost(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/posts/${id}`);
  }

  approvePost(id: string): Observable<Post> {
    return this.http.put<Post>(`${this.API_URL}/posts/${id}`, { approved: true });
  }

  pinPost(id: string, pinned: boolean): Observable<Post> {
    return this.http.put<Post>(`${this.API_URL}/posts/${id}`, { pinned });
  }

  // Comments
  getComments(): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.API_URL}/comments`);
  }

  getComment(id: string): Observable<Comment> {
    return this.http.get<Comment>(`${this.API_URL}/comments/${id}`);
  }

  updateComment(id: string, comment: Partial<Comment>): Observable<Comment> {
    return this.http.put<Comment>(`${this.API_URL}/comments/${id}`, comment);
  }

  deleteComment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/comments/${id}`);
  }

  // Stats and Overview
  getForumStats(): Observable<ForumStats> {
    // This would be a custom endpoint for admin stats
    return this.http.get<ForumStats>(`${this.API_URL}/admin/stats`);
  }
}