# Automated VS Code Find & Replace Fixes

Use **VS Code Find and Replace** (Ctrl+H) with these patterns to batch-fix most common errors.

## 🔧 Find & Replace Commands (In Order)

### 1️⃣ Replace Jest `expect.any()` with Jasmine (2 instances)
**Find:**
```regex
expect\.any\(
```

**Replace with:**
```
jasmine.any(
```

**Files affected:** auth.service.comprehensive.spec.ts, auth.service.advanced.spec.ts

---

### 2️⃣ Replace Jest `expect.objectContaining()` with Jasmine (2 instances)
**Find:**
```regex
expect\.objectContaining\(
```

**Replace with:**
```
jasmine.objectContaining(
```

---

### 3️⃣ Remove Vitest imports
**Find:**
```regex
import\s+\{\s*vi\s*\}\s+from\s+['"]vitest['"];?\n?
```

**Replace with:**
```
(leave empty - delete the line)
```

**Affected files:**
- auth.service.spec.ts
- auth.service.comprehensive.spec.ts
- login.advanced.spec.ts
- login.component.spec.ts

---

### 4️⃣ Replace vi.fn() with jasmine.createSpyObj()
**Find:**
```regex
vi\.fn\(\)
```

**Replace with:**
```
jasmine.createSpy()
```

---

### 5️⃣ Fix Input Signal .set() calls (AlertComponent)
**Find:**
```regex
component\.(\w+)\.set\(([^)]+)\)
```

**Replace with:**
```
fixture.componentRef.setInput('$1', $2)
```

**Note:** Manually verify - this replaces patterns like:
```ts
component.autoDismiss.set(true)
↓
fixture.componentRef.setInput('autoDismiss', true)
```

---

### 6️⃣ Safe cast for private property access
**Find:**
```regex
service\.(\w+Subject|privateField)
```

**Replace with (manually for each occurrence):**
```ts
// Before
service.notificationSubject.next(notification);

// After  
(service as any).notificationSubject.next(notification);
```

---

### 7️⃣ Fix broken done() callbacks - Add DoneFn type
**Find:**
```regex
it\(['"]([^'"]+)['"]\,\s*\(\)\s*=>\s*\{
```

**Replace with:**
```
it('$1', (done: DoneFn) => {
```

**Manual fix required** - Verify context before replacing.

---

## 📋 Type Mismatch Fixes (Requires Manual Work)

These cannot be automated but follow the same pattern:

### Pattern for Cart Mock (appears in multiple files)

**Currently:**
```typescript
const mockCart: Cart = {
  id: 'cart_1',
  userId: 'user_1',
  items: [],
  total: 0
};
```

**Must be:**
```typescript
const mockCart: Cart = {
  id: 'cart_1',
  userId: 'user_1',
  items: [],
  total: 0,
  subtotal: 0,
  tax: 0,
  discount: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};
```

**Files to update:**
- cart.service.advanced.spec.ts (8 instances)

---

### Pattern for Order Mock

**Missing fields:**
- totalAmount → total
- shippingAddress → proper ShippingAddress object
- paymentMethod → proper PaymentMethod enum

**Files to update:**
- order.service.advanced.spec.ts (10+ instances)

---

## 🧹 Cleanup: Remove jasmine.createSignal References

These CANNOT be batch replaced - they must be removed manually.

**Find:**
```regex
jasmine\.createSignal\([^)]+\)
```

**Action:** Remove these lines entirely. They don't exist in Jasmine.

**Examples:**
```typescript
// ❌ Remove this:
adminAuthService.currentUser = jasmine.createSignal(mockUser);

// ✅ Solution: Create proper mock in beforeEach
const mockAuthService = {
  currentUser: signal(mockUser),
  logout: jasmine.createSpy('logout')
};
```

**Files:** 
- header.component.spec.ts (11+ instances)
- Various service specs (5+ instances)

---

## 🔍 One-by-One Manual Fixes (Where Automation Won't Work)

### Fix 1: Delete lines with jasmine.createSignal
```bash
# Search for:
jasmine\.createSignal

# Delete each occurrence (can't automate - context dependent)
```

### Fix 2: Remove/Update vitest console.spy()
**Find:**
```
vi.spyOn(console, 'log').mockImplementation()
```

**Replace with:**
```typescript
spyOn(console, 'log').and.returnValue(undefined);
```

### Fix 3: Update notify type enums
**Find:**
```
NotificationType.ORDER
```

**Check:** What are the actual enum values? (Check notification.service.ts)

---

## ✅ Verification Checklist After Fixes

Run these checks in VS Code:

### 1. Search for remaining Jasmine errors
```
jasmine\.createSignal
```
Expected: 0 results

### 2. Search for remaining Vitest imports
```
import.*vitest
```
Expected: 0 results

### 3. Search for Jest matchers
```
expect\.(any|objectContaining)
```
Expected: 0 results after global replace

### 4. Search for broken done()
```
it\(['"](.*)['"]\s*,\s*\(\)\s*=>
```
Expected: 0 results (all should have `(done: DoneFn)`)

### 5. Search for .set( on components
```
component\.\w+\.set\(
```
Expected: 0 results (all should use `fixture.componentRef.setInput()`)

---

## 🚀 How to Apply These Fixes

### Step 1: Open Find & Replace
- VS Code: `Ctrl+H`
- Find field → Regex icon (.*) 
- Check "Use Regular Expression"

### Step 2: Apply each fix in order
1. Replace jest expect.any → jasmine.any
2. Replace jest objectContaining → jasmine.objectContaining
3. Remove vitest imports
4. Replace vi.fn → jasmine.createSpy
5. Replace .set() → fixture.componentRef.setInput()

### Step 3: Manual fixes (can't automate)
1. Remove jasmine.createSignal() lines
2. Update mock data to include required fields
3. Add (done: DoneFn) to test signatures
4. Fix type mismatches

### Step 4: Verify
```bash
npm test 2>&1 | grep -c "error TS"
# Should decrease significantly after each batch
```

---

## 📊 Expected Results After Fixes

| Stage | Jest Errors | Type Errors | Total |
|-------|-------------|------------|-------|
| Current | ~15 | ~150+ | ~265 |
| After automated fixes | 0 | ~150+ | ~150+ |
| After manual type fixes | 0 | 0 | 0 ✅ |

---

## 🎯 Priority Order

1. **AUTOMATED (10 mins)**
   - Jest → Jasmine matchers
   - Remove vitest imports
   - Replace vi.fn()

2. **SEMI-AUTOMATED (10 mins)**
   - .set() → fixture.componentRef.setInput()
   - done() signature fixes

3. **MANUAL (2-3 hours)**
   - Remove jasmine.createSignal()
   - Fix type mismatches in mocks
   - Update service method calls

---

## 💡 Pro Tips

- **Backup first:** Git commit before bulk replacing
- **Test incrementally:** After each replace batch, run `npm test` to verify
- **Use regex carefully:** Always test replacement on a few files first
- **Check diffs:** Review changes before committing
- **Use word boundaries:** `\b` prevents partial matches

---

## 🔗 Reference Files

For type definitions, check:
- Models: `src/app/front/models/*.ts`
- Services: `src/app/front/core/*.service.ts`
- Components: `src/app/front/**/*.component.ts`

