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
    // Skip adding auth header for upload endpoints or if explicitly requested
    if (request.url.includes('/uploads/') || request.headers.has('X-Skip-Auth')) {
      console.log('🔓 Skipping JWT for request:', request.url);
      // Remove the skip-auth header before forwarding
      if (request.headers.has('X-Skip-Auth')) {
        request = request.clone({
          headers: request.headers.delete('X-Skip-Auth')
        });
      }
      return next.handle(request);
    }
    
    // Get token from localStorage
    const token = localStorage.getItem('authToken');

    // If token exists, clone request and add Authorization header
    if (token) {
      const headers: { [key: string]: string } = {
        Authorization: `Bearer ${token}`
      };
      
      request = request.clone({
        setHeaders: headers
      });
      
      console.log('🔐 Added JWT token to request:', request.url);
    } else {
      console.log('🔓 No JWT token found for request:', request.url);
    }

    return next.handle(request);
  }
}
