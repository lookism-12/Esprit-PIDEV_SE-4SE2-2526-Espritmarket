# Delivery Workflow Audit & Analysis

## Executive Summary

**Your reasoning is 100% CORRECT.** The backend fully supports `IN_TRANSIT → RETURNED` transition, but the driver UI is missing the "Mark as Returned" button.

---

## Current Workflow Analysis

### Backend Status Flow (FULLY IMPLEMENTED ✅)

```
Order Lifecycle:
PENDING → CONFIRMED → PREPARING → IN_TRANSIT → DELIVERED ✅
                                              → RETURNED ✅

RETURNED → RESTOCKED (provider verifies)
```

### Backend Support for RETURNED

#### 1. OrderStatus Enum ✅
**File:** `backend/src/main/java/esprit_market/Enum/cartEnum/OrderStatus.java`

```java
public enum OrderStatus {
    PENDING,
    CONFIRMED,
    PREPARING,
    IN_TRANSIT,
    DELIVERED,
    RETURNED,      // ✅ EXISTS - Package returned after failed delivery
    RESTOCKED,     // ✅ EXISTS - Provider verified and stock restored
    CANCELLED
}
```

**Documentation in enum:**
```
DELIVERY WORKFLOW:
- IN_TRANSIT → DELIVERED (successful delivery)
- IN_TRANSIT → RETURNED (failed delivery, package returned to shop)

RETURNED vs RESTOCKED:
- RETURNED: Package returned by delivery, waiting for provider verification
- RESTOCKED: Provider verified returned item and stock has been restored
```

#### 2. OrderStatusValidator ✅
**File:** `backend/src/main/java/esprit_market/service/cartService/OrderStatusValidator.java`

```java
private void validateFromInTransit(OrderStatus newStatus, String actor) {
    switch (newStatus) {
        case DELIVERED:
            if (!"DELIVERY".equals(actor) && !"ADMIN".equals(actor)) {
                throw new IllegalStateException("Only delivery or admin can mark orders as delivered");
            }
            break;
        case RETURNED:  // ✅ FULLY SUPPORTED
            if (!"DELIVERY".equals(actor) && !"ADMIN".equals(actor)) {
                throw new IllegalStateException("Only delivery or admin can mark orders as returned");
            }
            break;
        default:
            throw new IllegalStateException(
                String.format("Invalid transition from IN_TRANSIT to %s. Only DELIVERED or RETURNED allowed.", newStatus)
            );
    }
}
```

**Validation Rules:**
- ✅ `IN_TRANSIT → RETURNED` is ALLOWED
- ✅ Only DELIVERY or ADMIN actors can perform this transition
- ✅ Validation is enforced at service layer

#### 3. OrderServiceImpl ✅
**File:** `backend/src/main/java/esprit_market/service/cartService/OrderServiceImpl.java`

```java
case RETURNED:
    order.setReturnedAt(LocalDateTime.now());
    
    // ❌ DO NOT restore stock here - provider must verify and restock first
    // Stock will be restored when status changes to RESTOCKED
    
    // Deduct loyalty points if they were granted
    if (order.getPaymentStatus() == PaymentStatus.PAID) {
        deductLoyaltyPointsForOrder(order);
        log.info("🏆 Loyalty points deducted for returned order {}", order.getOrderNumber());
    }
    
    log.info("📦 Order {} marked as RETURNED, waiting for provider verification", 
            order.getOrderNumber());
    break;
```

**Business Logic:**
- ✅ Sets `returnedAt` timestamp
- ✅ Does NOT restore stock (waits for provider verification)
- ✅ Deducts loyalty points if order was paid
- ✅ Logs the action

#### 4. Order Entity ✅
**File:** `backend/src/main/java/esprit_market/entity/cart/Order.java`

```java
private LocalDateTime returnedAt;    // ✅ When returned to shop (failed delivery)
private LocalDateTime restockedAt;   // ✅ When provider verified return and stock restored
```

---

## Current Driver UI (INCOMPLETE ❌)

### What Exists

**File:** `frontend/src/app/front/pages/driver-deliveries/driver-deliveries.component.ts`

```typescript
// ✅ Driver can accept delivery
acceptDelivery(delivery: Delivery) {
    this.savService.respondToDelivery(delivery.id, this.myUserId(), true).subscribe({
        next: () => {
            this.toastService.success('Delivery Accepted! Added to your active list.');
            this.loadAllData();
        }
    });
}

// ✅ Driver can decline BEFORE accepting (not the same as RETURNED)
declineDelivery(delivery: Delivery) {
    // This sets status to DRIVER_REFUSED
    // This is NOT the same as RETURNED
}

// ✅ Driver can mark as delivered
confirmMarkDelivered() {
    const delivery = this.selectedDelivery();
    if (!delivery) return;

    this.savService.markAsDelivered(delivery.id, this.myUserId()).subscribe({
        next: () => {
            this.toastService.success('Great job! Delivery marked as completed.');
            this.closeDeliverModal();
            this.loadAllData();
        }
    });
}

// ❌ MISSING: Driver CANNOT mark as returned
```

### What's Missing

**In Active Rides section:**
```html
<!-- Current: Only one button -->
<button (click)="openMarkDeliveredModal(d)">
    Mark as Delivered
</button>

<!-- Missing: Second button for failed delivery -->
<button (click)="openMarkReturnedModal(d)">
    Mark as Returned
</button>
```

---

## Decline vs Returned - Critical Distinction

### DECLINE (Already Implemented)
- **When:** BEFORE accepting the ride
- **Status:** `DRIVER_REFUSED`
- **Meaning:** Driver rejects the assignment
- **Stock:** Not affected (order never left shop)
- **Workflow:** Admin must reassign to another driver

### RETURNED (Missing in UI)
- **When:** AFTER accepting the ride, during delivery attempt
- **Status:** `RETURNED`
- **Meaning:** Delivery failed, package physically returned to shop
- **Stock:** NOT restored yet (waits for provider verification)
- **Workflow:** Provider must verify and restock
- **Examples:**
  - Customer absent
  - Customer refuses package
  - Wrong address
  - Access denied to building
  - Customer not reachable by phone

---

## Backend API Support

### Existing Endpoints

#### ✅ Mark as Delivered (Already Used)
```
PATCH /api/deliveries/{id}/mark-delivered?driverId={driverId}
```

#### ❌ Mark as Returned (NOT EXPOSED YET)
**Backend supports it via:**
```
PATCH /api/deliveries/{id}/status?status=RETURNED
```

**But this is a generic status update endpoint, not driver-specific.**

**We need a dedicated driver endpoint:**
```
PATCH /api/deliveries/{id}/mark-returned?driverId={driverId}&reason={reason}
```

---

## Integration with Provider RESTOCKED Workflow

### Current Flow (Already Implemented)

1. **Driver marks as RETURNED** (missing UI)
   - Order status: `IN_TRANSIT → RETURNED`
   - Stock: NOT restored yet
   - Provider sees in "Returned Orders" tab

2. **Provider verifies physical item** (already implemented)
   - Provider checks returned package
   - Provider clicks "Verify & Restock" button
   - Endpoint: `POST /api/provider/orders/{orderId}/pickup`

3. **System restocks** (already implemented)
   - Order status: `RETURNED → RESTOCKED`
   - Stock: RESTORED automatically
   - Loyalty points: Already deducted when marked RETURNED

**This workflow is FULLY IMPLEMENTED on backend and provider UI.**
**Only missing piece: Driver UI to mark as RETURNED.**

---

## Required Changes

### 1. Backend - Add Driver-Specific Endpoint ✅

**File:** `backend/src/main/java/esprit_market/controller/SAVController/DeliveryController.java`

Add new endpoint:
```java
@Operation(
    summary = "Driver marks delivery as returned (failed delivery)",
    description = "Sets status to RETURNED when delivery fails. Package must be returned to shop."
)
@PatchMapping("/{id}/mark-returned")
public ResponseEntity<DeliveryResponseDTO> markAsReturned(
        @PathVariable String id,
        @RequestParam String driverId,
        @RequestParam(required = false, defaultValue = "Delivery failed") String reason) {
    return ResponseEntity.ok(deliveryService.markAsReturned(id, driverId, reason));
}
```

**File:** `backend/src/main/java/esprit_market/service/SAVService/IDeliveryService.java`

Add interface method:
```java
DeliveryResponseDTO markAsReturned(String deliveryId, String driverId, String reason);
```

**File:** `backend/src/main/java/esprit_market/service/SAVService/DeliveryService.java`

Add implementation:
```java
@Override
public DeliveryResponseDTO markAsReturned(String deliveryId, String driverId, String reason) {
    Delivery delivery = deliveryRepository.findById(new ObjectId(deliveryId))
            .orElseThrow(() -> new RuntimeException("Livraison introuvable: " + deliveryId));

    User driver = userRepository.findById(new ObjectId(driverId))
            .orElseThrow(() -> new RuntimeException("Livreur introuvable: " + driverId));

    // Verify this driver is assigned to this delivery
    if (delivery.getUserId() == null || !delivery.getUserId().toHexString().equals(driverId)) {
        throw new RuntimeException("Ce livreur n'est pas assigné à cette livraison.");
    }

    delivery.setStatus("RETURNED");
    deliveryRepository.save(delivery);

    String orderNumber = formatOrderNumber(delivery);
    String driverName = getDriverFullName(driver).trim();

    // Notify all admins and provider
    notificationService.notifyAllAdmins(
        "📦 Delivery Returned — " + orderNumber,
        "Order " + orderNumber + " was returned by " + driverName + ". Reason: " + reason + " — Provider must verify and restock.",
        NotificationType.INTERNAL_NOTIFICATION,
        deliveryId
    );

    return savMapper.toDeliveryResponse(delivery);
}
```

### 2. Frontend Service - Add Method ✅

**File:** `frontend/src/app/back/core/services/sav.service.ts`

Add method:
```typescript
/** Driver marks delivery as returned (failed delivery) */
markAsReturned(deliveryId: string, driverId: string, reason: string = 'Delivery failed'): Observable<Delivery> {
  return this.http.patch<Delivery>(`${this.deliveryUrl}/${deliveryId}/mark-returned`, null, {
    params: { driverId, reason }
  });
}
```

### 3. Frontend Component - Add UI ✅

**File:** `frontend/src/app/front/pages/driver-deliveries/driver-deliveries.component.ts`

Add state and methods:
```typescript
// Add modal state
readonly isReturnModalOpen = signal<boolean>(false);
readonly selectedReturnReason = signal<string>('');

// Add method to open modal
openMarkReturnedModal(delivery: Delivery) {
  this.selectedDelivery.set(delivery);
  this.selectedReturnReason.set('');
  this.isReturnModalOpen.set(true);
}

// Add method to close modal
closeReturnModal() {
  this.isReturnModalOpen.set(false);
  this.selectedDelivery.set(null);
}

// Add method to confirm return
confirmMarkReturned() {
  const delivery = this.selectedDelivery();
  if (!delivery) return;
  if (!this.selectedReturnReason()) {
    this.toastService.warning('Please select a reason.');
    return;
  }

  this.savService.markAsReturned(delivery.id, this.myUserId(), this.selectedReturnReason()).subscribe({
    next: () => {
      this.toastService.success('Delivery marked as returned. Package must be returned to shop.');
      this.closeReturnModal();
      this.loadAllData();
    },
    error: () => this.toastService.error('Failed to mark delivery as returned.')
  });
}
```

**File:** `frontend/src/app/front/pages/driver-deliveries/driver-deliveries.component.html`

Update active rides section:
```html
<!-- Replace single button with two buttons -->
<div class="flex gap-3">
  <button (click)="openMarkReturnedModal(d)" 
          class="flex-1 py-4 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition border border-red-200">
    ↩️ Mark as Returned
  </button>
  <button (click)="openMarkDeliveredModal(d)" 
          class="flex-1 py-4 bg-primary/10 text-primary font-extrabold rounded-2xl hover:bg-primary hover:text-white transition">
    ✓ Mark as Delivered
  </button>
</div>
```

Add return modal:
```html
<!-- Mark Returned Modal -->
@if (isReturnModalOpen() && selectedDelivery()) {
<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-dark/60 backdrop-blur-sm" (click)="closeReturnModal()"></div>
    <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-8 text-center">
        
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
        </div>
        
        <h3 class="text-xl font-bold text-dark mb-2">Mark as Returned</h3>
        <p class="text-sm text-gray-500 mb-6">
            Delivery failed for <strong>{{ formatOrderNumber(selectedDelivery()!.cartId, selectedDelivery()!.deliveryDate) }}</strong>. 
            Package must be returned to shop.
        </p>
        
        <div class="text-left mb-6">
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Reason for Return</label>
            <select class="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-dark font-medium focus:ring-2 focus:ring-red-500"
                    [value]="selectedReturnReason()" (change)="selectedReturnReason.set($any($event.target).value)">
                <option value="" disabled>-- Please select --</option>
                <option value="Customer absent">Customer absent</option>
                <option value="Customer refused package">Customer refused package</option>
                <option value="Wrong address">Wrong address</option>
                <option value="Access denied">Access denied to building</option>
                <option value="Customer not reachable">Customer not reachable by phone</option>
                <option value="Other">Other</option>
            </select>
        </div>
        
        <div class="flex gap-3">
            <button (click)="closeReturnModal()" class="flex-1 py-3.5 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition">Cancel</button>
            <button (click)="confirmMarkReturned()" class="flex-[1.5] py-3.5 bg-red-600 shadow-lg shadow-red-600/30 text-white font-bold rounded-xl hover:bg-red-700 transition">Confirm Return</button>
        </div>
    </div>
</div>
}
```

---

## Files to Modify

### Backend (3 files)
1. ✅ `backend/src/main/java/esprit_market/controller/SAVController/DeliveryController.java`
   - Add `markAsReturned()` endpoint

2. ✅ `backend/src/main/java/esprit_market/service/SAVService/IDeliveryService.java`
   - Add interface method

3. ✅ `backend/src/main/java/esprit_market/service/SAVService/DeliveryService.java`
   - Add implementation with notification

### Frontend (3 files)
1. ✅ `frontend/src/app/back/core/services/sav.service.ts`
   - Add `markAsReturned()` method

2. ✅ `frontend/src/app/front/pages/driver-deliveries/driver-deliveries.component.ts`
   - Add modal state
   - Add open/close/confirm methods

3. ✅ `frontend/src/app/front/pages/driver-deliveries/driver-deliveries.component.html`
   - Add "Mark as Returned" button
   - Add return modal

---

## Validation & Testing

### Test Scenarios

1. **Happy Path - Successful Delivery**
   - Driver accepts ride
   - Driver clicks "Mark as Delivered"
   - Order status: `IN_TRANSIT → DELIVERED`
   - Stock: Unchanged
   - Payment: If COD, marked as PAID

2. **Failed Delivery - Customer Absent**
   - Driver accepts ride
   - Driver arrives, customer absent
   - Driver clicks "Mark as Returned"
   - Selects reason: "Customer absent"
   - Order status: `IN_TRANSIT → RETURNED`
   - Stock: NOT restored yet
   - Provider sees in "Returned Orders" tab
   - Provider verifies and clicks "Restock"
   - Order status: `RETURNED → RESTOCKED`
   - Stock: RESTORED

3. **Failed Delivery - Wrong Address**
   - Driver accepts ride
   - Driver arrives, address doesn't exist
   - Driver clicks "Mark as Returned"
   - Selects reason: "Wrong address"
   - Same flow as above

### Edge Cases

1. **Driver tries to mark as returned without selecting reason**
   - UI shows warning: "Please select a reason"

2. **Driver tries to mark as returned for delivery not assigned to them**
   - Backend throws error: "Ce livreur n'est pas assigné à cette livraison"

3. **Admin tries to mark as returned**
   - Should work (admin has DELIVERY permissions)

---

## Conclusion

### Summary

✅ **Backend is FULLY READY** - All status transitions, validations, and business logic exist
✅ **Provider UI is READY** - Returned orders tab and restock workflow implemented
❌ **Driver UI is INCOMPLETE** - Missing "Mark as Returned" button and modal

### Your Analysis is Correct

> "Decline is NOT the same as Returned"
> "Decline happens before accepting the ride"
> "Returned happens after accepting the ride and failing to deliver"

**100% ACCURATE.** This is exactly how the system is designed.

### Recommendation

**Implement the missing driver UI immediately.** The backend is ready, the provider workflow is ready, only the driver button is missing. This is a critical gap in the delivery workflow.

### Estimated Effort

- Backend: 1-2 hours (add endpoint + service method)
- Frontend: 2-3 hours (add button + modal + service method)
- Testing: 1 hour
- **Total: 4-6 hours**

### Priority

**HIGH** - This is a fundamental delivery workflow feature. Without it, drivers cannot properly handle failed deliveries, leading to:
- Incorrect order statuses
- Stock management issues
- Poor customer experience
- Provider confusion
