import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environment';

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  viewCount: number;
  isLiked?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ForumCategory {
  name: string;
  icon: string;
  count: number;
  color: string;
}

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private readonly apiUrl = `${environment.apiUrl}/posts`;

  // State
  readonly posts = signal<Post[]>([]);
  readonly isLoading = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  private mapPost(p: any): Post {
    return {
      id: p.id,
      authorId: p.authorId,
      authorName: p.authorName || 'Anonymous',
      authorAvatar: p.authorAvatar || 'assets/images/avatars/default.png',
      title: p.title,
      content: p.content,
      category: p.category || 'General',
      tags: p.tags || [],
      likesCount: p.likesCount || 0,
      commentsCount: p.commentsCount || 0,
      viewCount: p.viewCount || 0,
      isLiked: p.isLiked || false,
      createdAt: new Date(p.createdAt),
      updatedAt: p.updatedAt ? new Date(p.updatedAt) : undefined
    };
  }

  getAll(category?: string, search?: string): Observable<Post[]> {
    let params = new HttpParams();
    if (category && category !== 'All') params = params.set('category', category);
    if (search) params = params.set('q', search);

    this.isLoading.set(true);
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(posts => posts.map(p => this.mapPost(p))),
      tap(posts => {
        this.posts.set(posts);
        this.isLoading.set(false);
      })
    );
  }

  getById(id: string): Observable<Post> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(p => this.mapPost(p))
    );
  }

  create(post: any): Observable<Post> {
    return this.http.post<any>(this.apiUrl, post).pipe(
      map(p => this.mapPost(p))
    );
  }

  like(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/like`, {});
  }
}
