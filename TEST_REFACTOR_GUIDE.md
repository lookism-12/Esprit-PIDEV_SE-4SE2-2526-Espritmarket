# Angular + Jasmine Test Refactor Guide

## 🔴 CRITICAL BLOCKERS TO FIX (In Order)

### 1. Node Module Issue
**Problem:** `UnhandledSchemeError: Reading from "node:module"`
**Solution:** This is from karma.conf.js using require('path'). Switch to modern approach.

**Action:**
```bash
# In karma.conf.js, replace:
dir: require('path').join(__dirname, './coverage'),

# With:
const path = require('path');
// At top of module
```

### 2. Missing Test Dependencies
**Already fixed:**
- ✅ zone.js
- ✅ @angular/platform-browser-dynamic
- ✅ karma-jasmine-html-reporter

### 3. Remaining Test File Errors

#### Category A: `jasmine.createSignal` errors
- **Files:** header.component.spec.ts, various service specs
- **Pattern:** Replace ALL instances
  ```ts
  // ❌ WRONG
  adminAuthService.currentUser = jasmine.createSignal(null);
  
  // ✅ CORRECT
  // In beforeEach, use a real signal or mock object
  const mockAuthService = {
    currentUser: signal(mockUser),
    logout: jasmine.createSpy('logout')
  };
  ```

#### Category B: `done()` not callable errors
- **Files:** login.comprehensive.spec.ts, register.comprehensive.spec.ts
- **Pattern:** Use proper DoneFn typing
  ```ts
  // ✅ CORRECT
  it('should work', (done: DoneFn) => {
    observable.subscribe(() => done());
  });
  
  // OR use async/await
  it('should work', async () => {
    const result = await firstValueFrom(observable);
    expect(result).toBeTruthy();
  });
  ```

#### Category C: Type mismatches in test data
- **Files:** Many service specs with wrong mock data types
- **Pattern:** Always match service signatures exactly
  ```ts
  // ❌ WRONG - missing required fields
  const mockOrder = { totalAmount: 100 };
  
  // ✅ CORRECT - all required fields
  const mockOrder: Order = {
    id: 'order_1',
    total: 100,
    subtotal: 100,
    tax: 0,
    discount: 0,
    // ... all other required fields
  };
  ```

#### Category D: Jest matchers (expect.any, expect.objectContaining)
- **Files:** auth.service.comprehensive.spec.ts, auth.service.advanced.spec.ts
- **Pattern:** Replace with Jasmine equivalents
  ```ts
  // ❌ WRONG
  expect.any(Object)
  expect.objectContaining({ ... })
  
  // ✅ CORRECT
  jasmine.any(Object)
  jasmine.objectContaining({ ... })
  ```

#### Category E: Input signal assignment errors
- **Files:** alert.component.spec.ts
- **Pattern:** Use fixture.componentRef.setInput() instead
  ```ts
  // ❌ WRONG - InputSignal doesn't have .set()
  component.autoDismiss.set(true);
  
  // ✅ CORRECT
  fixture.componentRef.setInput('autoDismiss', true);
  ```

#### Category F: Private property access
- **Files:** notification.service.spec.ts
- **Pattern:** Safe cast or use public methods
  ```ts
  // ❌ WRONG
  service.notificationSubject.next(...);
  
  // ✅ CORRECT
  (service as any).notificationSubject.next(...);
  ```

## 📊 Error Summary by Priority

| Priority | Category | Count | Files |
|----------|----------|-------|-------|
| 🔴 CRITICAL | Missing signals/inputs | ~20 | header.component, alert.component |
| 🔴 CRITICAL | Invalid done() | ~30 | login.comprehensive, register.comprehensive |
| 🟡 HIGH | Type mismatches | ~100+ | Multiple service specs |
| 🟡 HIGH | Jest → Jasmine matchers | ~10 | auth service specs |
| 🟠 MEDIUM | Private access | ~5 | notification.service |
| 🟠 MEDIUM | Non-existent methods | ~40 | Various services |

## 🛠️ Batch Fix Strategy

### Step 1: Fix Critical Blocking Files (30 mins)
1. header.component.spec.ts - remove all jasmine.createSignal()
2. alert.component.spec.ts - replace .set() with fixture.componentRef.setInput()
3. login.comprehensive.spec.ts - fix done() signature
4. register.comprehensive.spec.ts - fix done() signature

### Step 2: Fix Jest Matchers (10 mins)
```bash
# Use search and replace:
expect\.any\( → jasmine.any(
expect\.objectContaining → jasmine.objectContaining
```

### Step 3: Fix Type Mismatches (2+ hours)
- Read service signatures
- Update test mock data to match

### Step 4: Remove Non-existent Methods
- Check each service implementation
- Remove test calls to undefined methods

## ✅ Validation Checklist

After fixes, verify:
- [ ] Zone.js loads without errors
- [ ] All *.spec.ts files compile
- [ ] No "Cannot find name 'require'" errors
- [ ] No "jasmine.createSignal" references
- [ ] No "Property 'set' does not exist on InputSignal"
- [ ] All mocks match service types
- [ ] Karma starts without webpack errors
- [ ] First test runs (even if it fails)

## 🎯 Success Criteria

```
✅ npm test runs
✅ Karma browser launches
✅ 0 compilation errors
✅ Tests can execute (may fail on logic, but not on setup)
```

## 📝 Notes

- DO NOT modify app source code
- DO NOT change service signatures  
- DO modify test files ONLY
- Focus on compilation first, logic second
