import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService, LoginRequest, AuthResponse, UserDTO } from './auth.service';
import { User, UserRole } from '../models/user.model';
import { environment } from '../../../environment';
import { JwtUtil } from './jwt.util';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: any;
  const apiUrl = `${environment.apiUrl}/users`;

  beforeEach(() => {
    const routerMock = {
      navigate: vi.fn().mockResolvedValue(true)
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerMock }
      ]
    });

    // Clear localStorage before each test, especially before service init
    localStorage.clear();

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    const loginReq: LoginRequest = { email: 'test@example.com', password: 'password123' };
    const authResponse: AuthResponse = { token: 'mock-jwt-token', userId: 'user-1' };
    const userDto: UserDTO = {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com',
      roles: ['CLIENT'],
      enabled: true
    };

    it('should perform login, store token, and load user profile', () => {
      // Mock JwtUtil.extractRole
      const extractRoleSpy = vi.spyOn(JwtUtil, 'extractRole').mockReturnValue('CLIENT');

      service.login(loginReq).subscribe(user => {
        expect(user.id).toBe('user-1');
        expect(localStorage.getItem('authToken')).toBe('mock-jwt-token');
        expect(localStorage.getItem('userId')).toBe('user-1');
        expect(service.isAuthenticated()).toBe(true);
      });

      // 1. Login request
      const loginRequest = httpMock.expectOne(`${apiUrl}/login`);
      expect(loginRequest.request.method).toBe('POST');
      loginRequest.flush(authResponse);

      // 2. Load profile request (from loadCurrentUser called in switchMap)
      const profileRequest = httpMock.expectOne(`${apiUrl}/me`);
      expect(profileRequest.request.method).toBe('GET');
      profileRequest.flush(userDto);

      expect(router.navigate).toHaveBeenCalledWith(['/profile']);
      extractRoleSpy.mockRestore();
    });

    it('should handle login error and clear storage', () => {
      service.login(loginReq).subscribe({
        error: (err) => {
          expect(err.status).toBe(401);
          expect(service.isAuthenticated()).toBe(false);
          expect(localStorage.getItem('authToken')).toBeNull();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout', () => {
    it('should clear localStorage and reset signals', () => {
      vi.useFakeTimers();
      // Setup state
      localStorage.setItem('authToken', 'token');
      localStorage.setItem('userId', '1');
      service.isAuthenticated.set(true);

      service.logout();
      
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(localStorage.getItem('userId')).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();

      vi.advanceTimersByTime(0); // For setTimeout in logout
      expect(router.navigate).toHaveBeenCalledWith(['/login'], expect.any(Object));
    });
  });

  describe('register', () => {
    it('should send registration request and return user data', () => {
      const registerData = {
        email: 'new@example.com',
        password: 'pass',
        firstName: 'New',
        lastName: 'User',
        phone: '12345678',
        role: 'CLIENT'
      };

      service.register(registerData as any).subscribe(res => {
        expect(res.email).toBe(registerData.email);
      });

      const req = httpMock.expectOne(`${apiUrl}/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerData);
      req.flush({ ...registerData, id: 'user-2', roles: ['CLIENT'], enabled: true });
    });
  });

  describe('loadCurrentUser', () => {
    it('should update signals with user data from backend', () => {
      const userDto: UserDTO = {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        roles: ['ADMIN'],
        enabled: true,
        avatarUrl: '/avatars/1.png'
      };

      service.loadCurrentUser().subscribe(user => {
        expect(user.role).toBe(UserRole.ADMIN);
        expect(service.userRole()).toBe(UserRole.ADMIN);
        expect(service.userFirstName()).toBe('John');
      });

      const req = httpMock.expectOne(`${apiUrl}/me`);
      req.flush(userDto);
    });
  });
});
