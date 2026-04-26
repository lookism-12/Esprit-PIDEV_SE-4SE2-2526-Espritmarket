import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ChatUser } from '../models/chat.models';

@Injectable({
  providedIn: 'root'
})
export class ChatUserService {
  private http = inject(HttpClient);
  // ✅ Fixed port: backend runs on 8090, not 8080
  private userApiUrl = 'http://localhost:8090/api/users';

  // In-memory cache to avoid repeated HTTP calls (fixes slow popup + ID display)
  private cache = new Map<string, ChatUser>();

  getUserById(id: string): Observable<ChatUser> {
    if (!id) {
      return of({ id: '', fullName: 'Unknown', profileImage: 'https://ui-avatars.com/api/?name=U&background=6366f1&color=fff' });
    }

    // Return cached result immediately if available
    const cached = this.cache.get(id);
    if (cached) return of(cached);

    return this.http.get<any>(`${this.userApiUrl}/${id}`).pipe(
      map(user => {
        let avatar = user.avatarUrl || user.profileImage;
        if (avatar && !avatar.startsWith('http') && !avatar.startsWith('data:')) {
          // Prefix relative paths with backend host
          avatar = `http://localhost:8090/uploads/avatars/${avatar}`;
        }
        
        return {
          id: id,
          fullName: (user.firstName || user.lastName)
            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
            : (user.fullName || 'Unknown User'),
          profileImage: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName || 'U')}&background=6366f1&color=fff`
        };
      }),
      tap(u => this.cache.set(id, u)),
      catchError(() => {
        const fallback: ChatUser = {
          id: id,
          fullName: 'Forum User',
          profileImage: `https://ui-avatars.com/api/?name=FU&background=6366f1&color=fff`
        };
        this.cache.set(id, fallback);
        return of(fallback);
      })
    );
  }
}
