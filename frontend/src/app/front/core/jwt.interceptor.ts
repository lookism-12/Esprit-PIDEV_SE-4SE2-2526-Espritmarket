import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * JWT Interceptor
 * 
 * Automatically injects the JWT token into Authorization header
 * of outgoing HTTP requests if a token exists in localStorage.
 */
@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Get token from localStorage
    const token = localStorage.getItem('authToken');

    // If token exists, clone request and add Authorization header
    if (token) {
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole') ?? 'USER';
      const requiresActorHeaders =
        request.url.includes('/api/negotiations') ||
        request.url.includes('/api/negociations') ||
        request.url.includes('/api/notifications');
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          ...(requiresActorHeaders && userId ? { 'X-User-Id': userId } : {}),
          ...(requiresActorHeaders ? { 'X-User-Role': userRole } : {})
        }
      });
    }

    return next.handle(request);
  }
}
