# Angular Jasmine Testing Guide - EspritMarket

This guide covers the best practices and patterns for writing tests in this Angular project using **Jasmine + Karma ONLY**.

## 🚫 STRICTLY FORBIDDEN

- ❌ `import { ... } from 'vitest'`
- ❌ `import { ... } from '@testing-library/angular'`
- ❌ `vi.fn()`, `vi.spyOn()`, `vi.mock()`
- ❌ `expect.any()`, `expect.objectContaining()`, `expect.arrayContaining()`
- ❌ `node_modules/` imports in tests
- ❌ `jasmine.createSignal()` (doesn't exist)
- ❌ Modifying readonly signal properties
- ❌ Accessing private fields directly

## ✅ REQUIRED PATTERNS

### 1. Service Testing with Spies

**Good:**
```ts
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { of, throwError } from 'rxjs';
import { User, UserRole } from '../models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: jasmine.SpyObj<HttpClient>;

  const mockUser: User = {
    id: 'user_1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.CLIENT,
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    const httpSpy = jasmine.createSpyObj('HttpClient', ['get', 'post']);
    
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: HttpClient, useValue: httpSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
  });

  it('should login successfully', () => {
    httpMock.post.and.returnValue(of(mockUser));
    
    service.login({ email: 'test@example.com', password: 'pass' })
      .subscribe(user => {
        expect(user.email).toBe('test@example.com');
      });
  });
});
```

### 2. Component Testing with Proper Input/Output

**Good:**
```ts
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../services/auth.service';
import { of } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should submit login form', () => {
    authService.login.and.returnValue(of(mockUser));
    
    component.loginForm.patchValue({
      email: 'user@example.com',
      password: 'password123'
    });
    
    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith(
      jasmine.objectContaining({
        email: 'user@example.com'
      })
    );
  });
});
```

### 3. Async Testing Patterns

**Good - Using setTimeout with DoneFn:**
```ts
import { DoneFn } from '@angular/core/testing';

it('should handle login error', (done: DoneFn) => {
  authService.login.and.returnValue(
    throwError(() => ({ status: 401 }))
  );

  component.loginForm.patchValue({
    email: 'user@example.com',
    password: 'wrong'
  });

  component.onSubmit();

  setTimeout(() => {
    expect(component.errorMessage()).toBeTruthy();
    done();  // Call done() when assertions complete
  }, 50);
});
```

**Good - Using fakeAsync/tick:**
```ts
import { fakeAsync, tick } from '@angular/core/testing';

it('should debounce multiple submissions', fakeAsync(() => {
  authService.login.and.returnValue(of(mockUser));

  component.onSubmit();
  component.onSubmit();
  component.onSubmit();

  tick(100);

  expect(authService.login).toHaveBeenCalled();
}));
```

### 4. Signal Testing

**Good - Set via component creation:**
```ts
// For input signals
fixture.componentRef.setInput('autoDismiss', true);
fixture.componentRef.setInput('delay', 1000);
fixture.detectChanges();

expect(component.autoDismiss()).toBe(true);
```

**Good - For regular signals:**
```ts
// Signals in spy mocks
const currentUserSignal = signal(mockUser);
const authServiceSpy = jasmine.createSpyObj(
  'AuthService',
  ['logout'],
  { currentUser: currentUserSignal }  // Create signal once, pass in spy
);
```

### 5. HTTP Testing

**Good:**
```ts
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
    providers: [AuthService]
  });

  httpMock = TestBed.inject(HttpTestingController);
  service = TestBed.inject(AuthService);
});

it('should call login endpoint', () => {
  service.login({ email: 'test@example.com', password: 'pass' })
    .subscribe();

  const req = httpMock.expectOne('/api/users/login');
  expect(req.request.method).toBe('POST');
  
  req.flush({ token: 'jwt_token', userId: 'user_1' });
});

afterEach(() => {
  httpMock.verify();
});
```

## 🔍 Common Mistakes to Avoid

### ❌ WRONG: Jest matchers
```ts
// WRONG
expect(value).toContain('string');  // This is wrong for strings
expect(arr).toStrictEqual([1, 2]);
```

### ✅ RIGHT: Jasmine matchers
```ts
// RIGHT  
expect(value).toContain('string');  // This works for arrays
expect(arr).toEqual([1, 2]);
expect(value).toContain('substring');  // Use for string contains
```

### ❌ WRONG: Creating signals in tests
```ts
// WRONG - jasmine.createSignal doesn't exist
adminService.currentUser = jasmine.createSignal(null);
```

### ✅ RIGHT: Creating and using signals
```ts
// RIGHT - create signal first, then add to spy
const userSignal = signal(null);
const adminServiceSpy = jasmine.createSpyObj(
  'AdminService',
  ['logout'],
  { currentUser: userSignal }
);
```

### ❌ WRONG: Calling set() on input signals
```ts
// WRONG - inputs are readonly
component.autoDismiss.set(true);
```

### ✅ RIGHT: Setting inputs properly
```ts
// RIGHT - use setInput for component inputs
fixture.componentRef.setInput('autoDismiss', true);
```

## 📋 Test Structure Template

```ts
import { TestBed, ComponentFixture, DoneFn } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { YourComponent } from './your.component';
import { YourService } from '../services/your.service';
import { of, throwError } from 'rxjs';

describe('YourComponent', () => {
  let component: YourComponent;
  let fixture: ComponentFixture<YourComponent>;
  let service: jasmine.SpyObj<YourService>;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('YourService', ['method1', 'method2']);

    await TestBed.configureTestingModule({
      imports: [YourComponent, ReactiveFormsModule],
      providers: [
        { provide: YourService, useValue: serviceSpy }
      ]
    }).compileComponents();

    service = TestBed.inject(YourService) as jasmine.SpyObj<YourService>;
    fixture = TestBed.createComponent(YourComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Feature Name', () => {
    it('should do something', () => {
      service.method1.and.returnValue(of({ success: true }));
      
      component.doSomething();

      expect(service.method1).toHaveBeenCalled();
      expect(component.result()).toBe(true);
    });

    it('should handle error', (done: DoneFn) => {
      service.method1.and.returnValue(throwError(() => new Error('Failed')));
      
      component.doSomething();

      setTimeout(() => {
        expect(component.errorMessage()).toBeTruthy();
        done();
      }, 50);
    });
  });
});
```

## 🎯 Jasmine Matcher Cheat Sheet

```ts
// Equality
expect(value).toBe(expected);           // ===
expect(value).toEqual(expected);        // deep equal

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThan(5);
expect(value).toBeCloseTo(0.3, 2);

// Strings
expect(value).toContain('substring');
expect(value).toMatch(/regex/);

// Arrays
expect(array).toContain(item);
expect(array.length).toBe(3);

// Exceptions
expect(() => fn()).toThrow();
expect(() => fn()).toThrowError('message');

// Spies
expect(spy).toHaveBeenCalled();
expect(spy).toHaveBeenCalledWith(arg1, arg2);
expect(spy).toHaveBeenCalledTimes(3);

// Custom matchers
expect(value).toBeDefined();
expect(value).not.toEqual(other);
```

## 🔗 Service Mocking Patterns

### Pattern 1: Simple Method Mocking
```ts
const authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'logout']);
authServiceSpy.login.and.returnValue(of(mockUser));
```

### Pattern 2: Property Mocking
```ts
const authServiceSpy = jasmine.createSpyObj(
  'AuthService',
  ['logout'],
  {
    currentUser: signal(mockUser),
    isAuthenticated: signal(true)
  }
);
```

### Pattern 3: Complex Returns
```ts
authServiceSpy.login.and.callFake((email) => {
  if (email === 'admin@example.com') {
    return of(adminUser);
  }
  return of(normalUser);
});
```

## 🚀 Running Tests

```bash
# Run all tests
npm test

# Run tests for specific file
ng test --include='**/auth.service.spec.ts'

# Run tests with coverage
ng test --code-coverage

# Run tests once (CI mode)
ng test --watch=false --browsers=Chrome
```

## 📚 Additional Resources

- [Jasmine Documentation](https://jasmine.github.io/)
- [Angular Testing Guide](https://angular.io/guide/testing)
- [TestBed API](https://angular.io/api/core/testing/TestBed)
- [Signals Testing](https://angular.io/guide/signals#testing-components-with-signals)

---

**Last Updated**: 2026-03-26
**Framework**: Jasmine + Karma ONLY
**Angular Version**: Latest (Signals Support)
