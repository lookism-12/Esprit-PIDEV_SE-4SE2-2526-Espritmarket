# Quick Fix Guide - Service Test Type Corrections

This guide helps you quickly fix the remaining ~100 service test type errors.

## Pattern: Service Mock Creation

### Step 1: Create Spy Object
```ts
const serviceSpy = jasmine.createSpyObj('ServiceName', ['method1', 'method2']);
```

### Step 2: Configure in TestBed
```ts
await TestBed.configureTestingModule({
  providers: [
    { provide: ServiceName, useValue: serviceSpy }
  ]
}).compileComponents();
```

### Step 3: Inject and Type Cast
```ts
service = TestBed.inject(ServiceName) as jasmine.SpyObj<ServiceName>;
```

### Step 4: Set Mock Returns with Correct Types
```ts
service.login.and.returnValue(of(mockUser));  // Must be Observable<User>, not Observable<{token, userId}>
```

---

## Common Errors & Fixes

### Error Type 1: Wrong Response Type
```
Error: Argument of type '{ token: string; userId: string; }' is not assignable to parameter of type 'Expected<User>'.
```

**Fix**: Create proper User object
```ts
// BEFORE (WRONG)
authService.login.and.returnValue(of({ token: 'jwt_token', userId: 'user_123' }));

// AFTER (RIGHT)
const mockUser: User = {
  id: 'user_123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  phone: '',
  role: UserRole.CLIENT,
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
};
authService.login.and.returnValue(of(mockUser));
```

### Error Type 2: Missing Required Properties
```
Error: Type '{ id: string; }[]' is missing the following properties from type 'Coupon': isPublic, isSingleUse, code, ...
```

**Fix**: Include all required properties
```ts
// BEFORE (INCOMPLETE)
const coupons = [{ id: 'coupon_1' }];

// AFTER (COMPLETE)
const coupons: Coupon[] = [
  {
    id: 'coupon_1',
    code: 'SAVE10',
    isPublic: true,
    isSingleUse: false,
    name: 'Save 10%',
    discount: 10,
    // ... all other required fields
  }
];
```

### Error Type 3: Wrong Enum Value
```
Error: Argument of type '"LIKE"' is not assignable to parameter of type 'ReactionType'.
```

**Fix**: Use correct enum
```ts
// BEFORE (WRONG STRING)
service.addReaction('post_123', 'post', 'LIKE').subscribe(...);

// AFTER (CORRECT ENUM)
import { ReactionType } from '../models/forum.model';
service.addReaction('post_123', 'post', ReactionType.LIKE).subscribe(...);
```

### Error Type 4: Wrong Property Name
```
Error: Property 'sendInvoice' does not exist on type 'InvoiceService'.
```

**Fix**: Check service interface and use correct method name
```ts
// BEFORE (WRONG METHOD)
service.sendInvoice('invoice_123', 'email@example.com').subscribe(...);

// AFTER (CHECK ACTUAL METHOD)
// Look in invoice.service.ts and use the real method name
service.updateInvoiceStatus('invoice_123', InvoiceStatus.PAID).subscribe(...);
```

### Error Type 5: Private Field Access
```
Error: Property 'notificationSubject' is private and only accessible within class 'NotificationService'.
```

**Fix**: Use public methods instead
```ts
// BEFORE (ACCESSING PRIVATE)
service.notificationSubject.next({...});

// AFTER (USE PUBLIC METHOD)
// Check for a public method like updateNotification() or postNotification()
service.updateNotification(notification).subscribe(...);
```

### Error Type 6: InputSignal .set() Error
```
Error: Property 'set' does not exist on type 'InputSignal<boolean>'.
```

**Fix**: Use setInput() instead
```ts
// BEFORE (WRONG - on input)
component.autoDismiss.set(true);

// AFTER (RIGHT - use setInput for inputs only)
fixture.componentRef.setInput('autoDismiss', true);

// But you CAN use .set() on regular signals:
component.isVisible.set(true);  // This works if isVisible is a regular signal()
```

---

## Quick Fix Workflow

For each failing test:

1. **Read the error message** - It usually tells you exactly what's wrong
2. **Identify the pattern** - Which type of error is it?
3. **Look at the service interface** - Check what the actual return type should be
4. **Find a fixed example** - Look at login.component.spec.ts or other fixed files
5. **Apply the pattern** - Update your mock data to match the interface
6. **Verify types** - Ensure imports and types match

---

## Checklist for Each Service Test File

- [ ] Create proper spy objects with correct method names
- [ ] Import all required models/enums
- [ ] Create mock objects with ALL required properties
- [ ] Use correct enum values (not strings)
- [ ] Match Observable return types exactly
- [ ] Use only public methods (never private)
- [ ] Use setInput() for component inputs
- [ ] Import DoneFn for async tests
- [ ] Run tests to verify no more type errors

---

## File-by-File Hints

### auth.service.spec.ts
- AuthService.login() returns Observable<User>, not {token, userId}
- User requires: id, email, firstName, lastName, phone, role, isVerified, createdAt, updatedAt

### carpooling.service.spec.ts
- SearchRideRequest requires: from, to, date (not startLocation, endLocation)
- CreateRideRequest requires: departure, destination, availableSeats, preferences
- Use BookingStatus enum, not string 'status'

### cart.service.advanced.spec.ts
- Cart requires: subtotal, tax, discount, createdAt, updatedAt (not just id, userId, items, total)

### delivery.service.spec.ts
- ComplaintType is an enum, not a string
- Check actual service methods - many might not exist

### forum.service.spec.ts
- ReactionType.LIKE (not "LIKE" string)
- CreateGroupRequest requires: type, privacy (not just name, description)

### invoice.service.spec.ts
- InvoiceStatus is enum, not string
- Check if sendInvoice() actually exists - may have different name

### notification.service.spec.ts
- NotificationType values might be different than test assumes
- Use public methods, never access private subjects

### order.service.advanced.spec.ts
- ShippingAddress is a complex type, not a string
- PaymentMethod is enum, not string
- OrderItem doesn't have 'price' property

---

## Copy-Paste Templates

### Service Spy Setup
```ts
const serviceSpy = jasmine.createSpyObj('ServiceName', [
  'method1',
  'method2',
  'method3'
]);

TestBed.configureTestingModule({
  providers: [
    { provide: ServiceName, useValue: serviceSpy }
  ]
});

service = TestBed.inject(ServiceName) as jasmine.SpyObj<ServiceName>;
```

### Mock Object Setup
```ts
const mockObject: InterfaceName = {
  id: 'id_1',
  name: 'Name',
  email: 'email@example.com',
  createdAt: new Date(),
  updatedAt: new Date()
  // Add ALL required properties
};
```

### Observable Return Setup
```ts
serviceSpy.methodName.and.returnValue(of(mockObject));

// Or with error
serviceSpy.methodName.and.returnValue(
  throwError(() => ({ status: 400, message: 'Error' }))
);
```

### Async Test Setup
```ts
it('test name', (done: DoneFn) => {
  serviceSpy.method.and.returnValue(of(data));
  
  component.action();
  
  setTimeout(() => {
    expect(component.result).toBe(expected);
    done();
  }, 50);
});
```

---

## Script: Find All Errors Quickly

```bash
# In frontend directory
npm test 2>&1 | grep "error TS" | head -20
```

This shows the first 20 type errors. Fix them one by one using this guide.

---

## Support Resources

- **For type info**: Check `frontend/src/app/front/models/*.model.ts`
- **For method names**: Check `frontend/src/app/front/core/*.service.ts`
- **For examples**: Check files already fixed (login.component.spec.ts)
- **For syntax**: See JASMINE_TESTING_GUIDE.md

---

**Last Updated**: 2026-03-26  
**Framework**: Jasmine + Karma  
**Status**: Ready for systematic fixes
