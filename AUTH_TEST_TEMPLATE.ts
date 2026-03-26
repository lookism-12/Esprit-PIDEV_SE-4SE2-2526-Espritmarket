/**
 * CORRECT AUTH SERVICE TEST TEMPLATE - Jasmine + Karma
 * 
 * This file demonstrates the CORRECT patterns for:
 * - Service testing with HttpClientTestingModule
 * - Proper async handling (no broken done())
 * - Correct spy configuration
 * - Valid type assertions
 * - Real signals (not jasmine.createSignal)
 */

import { TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AuthService } from './auth.service';

describe('AuthService - CORRECT PATTERNS', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;
  const apiUrl = 'http://localhost:8090/api/users';

  // ✅ CORRECT: Mock data that matches the actual service interface
  const mockUser = {
    id: 'user_123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'USER' as const,
    enabled: true,
    emailVerified: true,
    phone: '+1234567890'
  };

  const mockLoginResponse = {
    token: 'jwt_token_123',
    userId: 'user_123',
    user: mockUser
  };

  beforeEach(() => {
    // ✅ CORRECT: Create router spy with jasmine, NOT vi.fn()
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    httpMock.verify(); // Verify no outstanding HTTP requests
  });

  describe('Login - Async Patterns', () => {
    
    // ✅ CORRECT: Use async/await pattern (PREFERRED)
    it('should login successfully and store token', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };

      // Start the request
      const loginPromise = service.login(credentials).toPromise();

      // Mock the HTTP response
      const req = httpMock.expectOne(`${apiUrl}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(mockLoginResponse);

      // Wait for the promise and assert
      const result = await loginPromise;
      expect(result).toEqual(mockLoginResponse);
      expect(service.isAuthenticated()).toBe(true);
      expect(localStorage.getItem('authToken')).toBe('jwt_token_123');
    });

    // ✅ CORRECT: Use waitForAsync when dealing with observables
    it('should handle login failure gracefully', waitForAsync(() => {
      const credentials = { email: 'wrong@example.com', password: 'wrong' };
      let errorReceived = false;

      service.login(credentials).subscribe(
        () => fail('should have failed'),
        (error) => {
          errorReceived = true;
          expect(error.status).toBe(401);
          expect(service.isAuthenticated()).toBe(false);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush(
        { message: 'Invalid credentials' },
        { status: 401, statusText: 'Unauthorized' }
      );
    }));

    // ✅ CORRECT: Use fakeAsync + tick for time-dependent code
    it('should handle delayed responses', fakeAsync(() => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      let completed = false;

      service.login(credentials).subscribe(() => {
        completed = true;
      });

      tick(100); // Simulate 100ms delay

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush(mockLoginResponse);

      tick(100); // Additional tick to process response

      expect(completed).toBe(true);
    }));
  });

  describe('Router Navigation - Spy Patterns', () => {

    // ✅ CORRECT: Verify spy was called with jasmine matchers
    it('should navigate to dashboard after login', waitForAsync(() => {
      router.navigate.and.returnValue(Promise.resolve(true));

      service.login({ email: 'test@example.com', password: 'pass' }).subscribe(
        () => {
          service.navigateToDashboard();

          // ✅ CORRECT: Use jasmine.objectContaining for partial matching
          expect(router.navigate).toHaveBeenCalledWith(
            ['/dashboard'],
            jasmine.objectContaining({ replaceUrl: true })
          );
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush(mockLoginResponse);
    }));

    // ✅ CORRECT: Use jasmine.any() for type checking
    it('should pass any Object as query params', () => {
      router.navigate.and.returnValue(Promise.resolve(true));

      service.navigateToLogin({
        returnUrl: '/products',
        session: 'expired'
      });

      expect(router.navigate).toHaveBeenCalledWith(
        ['/login'],
        jasmine.objectContaining({
          queryParams: jasmine.any(Object)
        })
      );
    });
  });

  describe('Authentication State - Signal Patterns', () => {

    // ✅ CORRECT: Use real signals from @angular/core, NOT jasmine.createSignal
    it('should track authentication state with signals', () => {
      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();

      // Simulate login
      service.setAuthState(true, mockUser);

      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()).toEqual(mockUser);
    });

    // ✅ CORRECT: Verify signal updates
    it('should update signals on logout', () => {
      service.setAuthState(true, mockUser);
      expect(service.isAuthenticated()).toBe(true);

      service.logout();

      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();
    });
  });

  describe('Mock Data Type Safety', () => {

    // ✅ CORRECT: Type-safe mock data
    interface LoginRequest {
      email: string;
      password: string;
    }

    // ✅ CORRECT: Ensure mock matches interface exactly
    const validLoginRequest: LoginRequest = {
      email: 'user@example.com',
      password: 'SecurePass123!'
    };

    it('should require email and password', waitForAsync(() => {
      service.login(validLoginRequest).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      expect(req.request.body).toEqual(validLoginRequest);
      req.flush(mockLoginResponse);
    }));
  });

  describe('Error Handling - No broken done()', () => {

    // ✅ CORRECT: Proper error subscription with async
    it('should handle network errors', async () => {
      const credentials = { email: 'test@example.com', password: 'pass' };

      try {
        await service.login(credentials).toPromise();
        fail('should have thrown');
      } catch (error) {
        expect(error.status).toBe(500);
      }

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.error(new ProgressEvent('Network error'), { status: 500 });
    });

    // ✅ CORRECT: Use waitForAsync with explicit error assertion
    it('should catch service errors', waitForAsync(() => {
      let errorOccurred = false;

      service.login({ email: 'test@example.com', password: 'pass' }).subscribe(
        () => fail('should have errored'),
        (err) => {
          errorOccurred = true;
          expect(err).toBeDefined();
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.error(new ProgressEvent('error'));

      // Verify error was handled
      expect(errorOccurred).toBe(true);
    }));
  });

  describe('Multiple Scenarios - Realistic Tests', () => {

    // ✅ CORRECT: Real-world login flow
    it('should complete full login flow', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };

      // 1. Initiate login
      const loginPromise = service.login(credentials).toPromise();

      // 2. Mock API response
      const loginReq = httpMock.expectOne(`${apiUrl}/login`);
      loginReq.flush(mockLoginResponse);

      // 3. Verify result
      const result = await loginPromise;
      expect(result).toEqual(mockLoginResponse);

      // 4. Verify state
      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()?.id).toBe('user_123');

      // 5. Verify storage
      expect(localStorage.getItem('authToken')).toBe('jwt_token_123');
    });

    // ✅ CORRECT: Test with mocked router navigation
    it('should navigate after successful login', waitForAsync(() => {
      router.navigate.and.returnValue(Promise.resolve(true));

      const credentials = { email: 'test@example.com', password: 'password123' };

      service.login(credentials).subscribe(() => {
        service.navigateToDashboard();

        // Verify navigation was called
        expect(router.navigate).toHaveBeenCalledWith(
          ['/dashboard'],
          jasmine.any(Object)
        );
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush(mockLoginResponse);
    }));
  });
});

/**
 * ✅ KEY TAKEAWAYS FOR CORRECT JASMINE TESTS:
 * 
 * 1. SIGNALS: Use real signal() from @angular/core, NEVER jasmine.createSignal()
 * 2. ASYNC: Use async/await (preferred), waitForAsync(), or fakeAsync()
 * 3. DONE(): Don't use done() - use async patterns instead
 * 4. SPIES: Use jasmine.createSpyObj() and jasmine.any() NOT vi.fn() or expect.any()
 * 5. TYPES: Mock data MUST match service interface exactly
 * 6. MATCHERS: Use jasmine.objectContaining() NOT expect.objectContaining()
 * 7. HTTP: Always verify requests with httpMock.expectOne() or similar
 * 8. CLEANUP: Always call httpMock.verify() in afterEach()
 * 
 * ❌ PATTERNS TO AVOID:
 * - jasmine.createSignal() - doesn't exist
 * - vi.fn() - Vitest only
 * - expect.any() - Jest only
 * - done() without proper DoneFn type
 * - Direct .set() on InputSignal
 * - Private property access without (as any)
 * - Incomplete mock data
 */
