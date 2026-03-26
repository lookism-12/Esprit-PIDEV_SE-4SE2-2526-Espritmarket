# Testing Quick Reference Guide

## Project Testing Status

### ✅ INTEGRATED & TESTED (Run Tests)

**These are fully functional and integrated with backend APIs:**

```bash
# User Authentication
- Login form validation & submission
- Registration (all roles)
- Auth guards & route protection
- JWT token management
- User profile loading

# Test Files:
src/app/front/pages/login/login.spec.ts
src/app/front/pages/register/register.spec.ts
src/app/front/core/auth.service.spec.ts
src/app/front/core/auth.service.advanced.spec.ts
src/app/front/core/user.service.spec.ts
src/app/front/core/auth.guard.spec.ts
src/app/front/core/jwt.util.spec.ts
```

### ❌ NOT INTEGRATED (Placeholder Tests)

**These are UI-only (no backend integration yet):**

```bash
# Shopping Features
- Orders (order.service.advanced.spec.ts)
- Payments (payment.service.spec.ts)
- Cart (cart.service.advanced.spec.ts)
- Favorites (favorite.service.spec.ts)
- Coupons (coupon.service.spec.ts)

# Logistics
- Carpooling (carpooling.service.spec.ts)
- Delivery (delivery.service.spec.ts)

# Other
- Products (product.service.spec.ts)
- Forum (forum.service.spec.ts)
- Loyalty (loyalty.service.spec.ts)
- Notifications (notification.service.spec.ts)
- And more...

Note: These have placeholder tests marked with xdescribe()
They will NOT run (x = skip)
Clear TODO comments indicate what needs implementation
```

---

## Running Tests

### All Tests
```bash
cd frontend
npm test
```

### Specific Test Suite
```bash
# Auth tests only
npm test -- auth

# User service tests
npm test -- user.service

# Login component tests
npm test -- login.component
```

### Watch Mode
```bash
npm test -- --watch
```

### Code Coverage
```bash
npm test -- --code-coverage
```

---

## Understanding Test Structure

### Real Integration Test (Example: Login)

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, AuthResponse, UserDTO } from './auth.service';

describe('AuthService - Real Backend Integration', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:8090/api/users';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  it('should authenticate with valid credentials', (done) => {
    const credentials = { email: 'user@example.com', password: 'Password@123' };
    const authResponse: AuthResponse = {
      token: 'eyJhbGciOiJIUzI1NiIs...',
      userId: 'user-123'
    };

    // Call the service method
    service.login(credentials).subscribe((user) => {
      // Verify state was updated
      expect(service.isAuthenticated()).toBe(true);
      expect(localStorage.getItem('authToken')).toBe(authResponse.token);
      expect(user.email).toBe(credentials.email);
      done();
    });

    // Simulate HTTP request/response
    const loginReq = httpMock.expectOne(`${apiUrl}/login`);
    expect(loginReq.request.method).toBe('POST');
    loginReq.flush(authResponse);

    // Service also loads user profile after login
    const userReq = httpMock.expectOne(`${apiUrl}/me`);
    const userDto: UserDTO = {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'user@example.com',
      roles: ['CLIENT'],
      enabled: true
    };
    userReq.flush(userDto);
  });
});
```

### Placeholder Test (Example: Non-Integrated Feature)

```typescript
// TODO: Feature not yet integrated with backend
// This service currently handles only UI display
// Real unit tests will be implemented after backend integration

xdescribe('CarpoolingService', () => {
  it('should be implemented after backend integration', () => {
    expect(true).toBeTrue();
  });
});
```

---

## Key Testing Patterns Used

### 1. HTTP Testing with HttpClientTestingModule

```typescript
// Intercept and respond to HTTP requests
const req = httpMock.expectOne(`${apiUrl}/users`);
expect(req.request.method).toBe('POST');
req.flush(response); // Send mock response

// Verify no unexpected requests
httpMock.verify();
```

### 2. Signal Testing (Angular Signals)

```typescript
// Set signal value
service.isAuthenticated.set(true);

// Read signal value
expect(service.isAuthenticated()).toBe(true);

// Test signal updates
service.loadCurrentUser().subscribe(() => {
  expect(service.userEmail()).toBe('user@example.com');
});
```

### 3. Form Validation Testing

```typescript
// Check form validity
expect(component.loginForm.valid).toBe(false);

// Set field value
component.loginForm.get('email')?.setValue('test@example.com');

// Check field errors
expect(component.loginForm.get('email')?.hasError('email')).toBe(false);
```

### 4. Observable Testing with fakeAsync

```typescript
it('should handle async operations', fakeAsync(() => {
  authService.login(credentials).subscribe(() => {
    expect(router.navigate).toHaveBeenCalled();
  });

  // Advance all pending timers
  tick();
}));
```

### 5. Error Handling

```typescript
it('should handle 401 errors', (done) => {
  service.login(badCredentials).subscribe(
    () => fail('should have failed'),
    (error) => {
      expect(error.status).toBe(401);
      expect(service.isAuthenticated()).toBe(false);
      done();
    }
  );

  const req = httpMock.expectOne(`${apiUrl}/login`);
  req.flush(
    { message: 'Unauthorized' },
    { status: 401, statusText: 'Unauthorized' }
  );
});
```

---

## API Endpoints Being Tested

| Method | Endpoint | Status | Test File |
|--------|----------|--------|-----------|
| POST | /api/users/login | ✅ | auth.service.spec.ts |
| POST | /api/users/register | ✅ | auth.service.spec.ts |
| GET | /api/users/me | ✅ | auth.service.spec.ts |
| PATCH | /api/users/me | ✅ | user.service.spec.ts |
| POST | /api/users/me/avatar | ✅ | user.service.spec.ts |
| POST | /api/users/me/password | ✅ | user.service.spec.ts |
| POST | /api/users/me/verify | ✅ | user.service.spec.ts |
| DELETE | /api/users/me | ✅ | user.service.spec.ts |

---

## Test File Organization

```
frontend/src/app/
├── front/
│   ├── core/                          # Services & Guards
│   │   ├── auth.service.spec.ts              ✅ Real tests
│   │   ├── auth.service.advanced.spec.ts     ✅ Real tests
│   │   ├── user.service.spec.ts              ✅ Real tests
│   │   ├── auth.guard.spec.ts                ✅ Real tests
│   │   ├── jwt.util.spec.ts                  ✅ Real tests
│   │   ├── cart.service.spec.ts              ❌ Placeholder
│   │   ├── order.service.advanced.spec.ts    ❌ Placeholder
│   │   └── ... (other non-integrated)        ❌ Placeholder
│   ├── pages/                         # Page Components
│   │   ├── login/
│   │   │   ├── login.spec.ts                 ✅ Real tests
│   │   │   └── login.component.spec.ts       ✅ Real tests
│   │   ├── register/
│   │   │   ├── register.spec.ts              ✅ Real tests
│   │   │   └── register.comprehensive.spec.ts ✅ Real tests
│   │   ├── profile/
│   │   │   └── profile.spec.ts               ⚠️  Minimal
│   │   └── ... (other pages)                 ❌ Placeholder
│   ├── shared/
│   │   └── components/
│   │       ├── button.component.spec.ts      ✅ UI component
│   │       ├── alert.component.spec.ts       ✅ UI component
│   │       └── ...                           ✅ UI components
│   └── layout/
│       ├── navbar/navbar.spec.ts             ✅ Minimal
│       └── footer/footer.spec.ts             ✅ Minimal
└── app.spec.ts                              ✅ App bootstrap test
```

---

## Common Test Assertions

```typescript
// HTTP Requests
httpMock.expectOne(url);                    // Expect exactly one request
httpMock.expectNone(url);                   // Expect no requests
httpMock.verify();                          // Verify no pending requests

// Values & Types
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeDefined();
expect(value).toEqual(expected);
expect(value).toBe(expected);                // Strict equality
expect(value).toContain(item);

// Signals
expect(service.signal()).toEqual(value);
expect(service.isLoading()).toBe(true);

// Functions
expect(spy).toHaveBeenCalled();
expect(spy).toHaveBeenCalledWith(arg);
expect(spy).toHaveBeenCalledTimes(2);

// Errors
expect(() => method()).toThrowError();
expect(observable).toThrowError();
```

---

## Debugging Tests

### Enable Debug Output
```typescript
// Add console.logs in tests
console.log('Service state:', service.currentUser());

// Run test with verbose output
npm test -- --verbose
```

### Isolate Single Test
```typescript
// Change 'it' to 'fit' (focused test)
fit('should do something', () => {
  // Only this test will run
});
```

### Skip Test Temporarily
```typescript
// Change 'it' to 'xit'
xit('should be skipped', () => {
  // This test will not run
});
```

### Debug in Browser
```typescript
// ng test opens browser at http://localhost:9876
// Open browser DevTools (F12)
// Tests run with full debugging support
```

---

## Contributing Tests

### When Adding New Integrated Features

1. **Create test file** following naming convention:
   ```typescript
   src/app/front/core/feature.service.spec.ts
   src/app/front/pages/feature/feature.spec.ts
   ```

2. **Use HttpClientTestingModule:**
   ```typescript
   import { HttpClientTestingModule } from '@angular/common/http/testing';
   TestBed.configureTestingModule({
     imports: [HttpClientTestingModule],
     providers: [YourService]
   });
   ```

3. **Test real API endpoints:**
   ```typescript
   // Expect actual endpoint
   const req = httpMock.expectOne(`${apiUrl}/feature`);
   req.flush(realResponse);
   ```

4. **Verify state changes:**
   ```typescript
   service.loadFeature().subscribe(() => {
     expect(service.featureData()).toEqual(expectedData);
   });
   ```

### When Adding Non-Integrated UI

1. **Create placeholder test:**
   ```typescript
   // TODO: Feature not yet integrated with backend
   // This component currently handles only UI display
   // Real unit tests will be implemented after backend integration

   xdescribe('ComponentName', () => {
     it('should be implemented after backend integration', () => {
       expect(true).toBeTrue();
     });
   });
   ```

2. **Add TODO comment to test file** indicating what needs to be tested

3. **When backend is ready:**
   - Replace xdescribe with describe
   - Add real HTTP tests
   - Verify API endpoints

---

## Troubleshooting

### "Cannot find HttpTestingController"
```typescript
// Make sure to import
import { HttpClientTestingModule } from '@angular/common/http/testing';

// And add to TestBed
TestBed.configureTestingModule({
  imports: [HttpClientTestingModule],
  providers: [YourService]
});
```

### "No provider for AuthService"
```typescript
// Mock the service
const authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'logout']);
TestBed.configureTestingModule({
  providers: [{ provide: AuthService, useValue: authServiceSpy }]
});
```

### "Expected one matching request for URL"
```typescript
// Service might be making additional requests
// Check if there are multiple HTTP calls

// Use expectNone if request shouldn't be made
httpMock.expectNone(`${apiUrl}/other`);

// Or expect multiple requests
const req1 = httpMock.expectOne(`${apiUrl}/first`);
const req2 = httpMock.expectOne(`${apiUrl}/second`);
```

### "Signal read during change detection"
```typescript
// Use fakeAsync and tick() for async operations
it('should update signal', fakeAsync(() => {
  service.loadData().subscribe();
  tick();
  expect(service.data()).toBeTruthy();
}));
```

---

## Performance Notes

- Tests run in ~60 seconds
- Auth service tests are most comprehensive
- Non-integrated features use xdescribe (skipped)
- No fake data simulation = faster execution

---

## Contact & Questions

For questions about test implementation or structure, refer to:
- `TESTING_STRATEGY_IMPLEMENTED.md` - Full strategy document
- Individual test files - Inline comments and examples
- Angular Testing Guide: https://angular.io/guide/testing

