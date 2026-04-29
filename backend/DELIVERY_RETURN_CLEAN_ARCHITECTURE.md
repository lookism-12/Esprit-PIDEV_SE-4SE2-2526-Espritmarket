# Delivery Return Workflow - Clean Architecture Implementation

## Overview

This document describes the **clean and simplified** architecture for handling failed deliveries (returns) in the system.

## Business Requirement

When a delivery fails (customer absent, wrong address, refused package), the driver must be able to mark the delivery as RETURNED. The provider can then view all returned deliveries and verify the physical items.

## Architecture Principles

### ✅ CORRECT: Separation of Concerns

- **Delivery entity** manages delivery status (PREPARING, IN_TRANSIT, DELIVERED, RETURNED)
- **Order entity** manages order status (PENDING, CONFIRMED, PREPARING, IN_TRANSIT, DELIVERED, RETURNED, RESTOCKED, CANCELLED)
- **Return workflow** is driven by Delivery status, NOT Order status
- **Provider verification** happens through Order workflow (RETURNED → RESTOCKED)

### ❌ WRONG: Mixing Concerns

- ❌ Don't try to find Order from Delivery in return logic
- ❌ Don't update Order status when marking Delivery as returned
- ❌ Don't depend on cartId or orderId for return operation
- ❌ Don't create complex matching logic between Delivery and Order

## Implementation

### Backend Architecture

#### 1. Delivery Entity (`Delivery.java`)

```java
@Document(collection = "deliveries")
public class Delivery {
    @Id
    private ObjectId id;
    private String address;
    private LocalDateTime deliveryDate;
    private String status; // PREPARING, IN_TRANSIT, DELIVERED, RETURNED, DRIVER_REFUSED
    private ObjectId userId; // The confirmed delivery driver
    private ObjectId cartId; // The Cart containing items for delivery
    private ObjectId orderId; // The Order associated with this delivery (optional)
    // ... other fields
}
```

#### 2. Service Layer (`DeliveryService.java`)

**Clean Implementation:**

```java
@Override
public DeliveryResponseDTO markAsReturned(String deliveryId, String driverId, String reason) {
    // 1. Find delivery
    Delivery delivery = deliveryRepository.findById(new ObjectId(deliveryId))
            .orElseThrow(() -> new RuntimeException("Livraison introuvable: " + deliveryId));

    // 2. Verify driver
    User driver = userRepository.findById(new ObjectId(driverId))
            .orElseThrow(() -> new RuntimeException("Livreur introuvable: " + driverId));

    if (delivery.getUserId() == null || !delivery.getUserId().toHexString().equals(driverId)) {
        throw new RuntimeException("Ce livreur n'est pas assigné à cette livraison.");
    }

    // 3. Update ONLY Delivery status
    delivery.setStatus("RETURNED");
    deliveryRepository.save(delivery);

    // 4. Notify admins
    String orderNumber = formatOrderNumber(delivery);
    String driverName = getDriverFullName(driver).trim();
    String returnReason = (reason != null && !reason.isEmpty()) ? reason : "Delivery failed";

    notificationService.notifyAllAdmins(
        "↩️ Delivery Returned — " + orderNumber,
        "Order " + orderNumber + " was returned by " + driverName + ". Reason: " + returnReason + " — Provider must verify and restock.",
        NotificationType.INTERNAL_NOTIFICATION,
        deliveryId
    );

    return savMapper.toDeliveryResponse(delivery);
}
```

**Key Points:**
- ✅ Only updates `delivery.status = "RETURNED"`
- ✅ No Order lookup
- ✅ No Cart lookup
- ✅ Simple, clean, maintainable

#### 3. Controller Layer (`DeliveryController.java`)

```java
@PatchMapping("/{id}/mark-returned")
public ResponseEntity<DeliveryResponseDTO> markAsReturned(
        @PathVariable String id,
        @RequestParam String driverId,
        @RequestParam(required = false, defaultValue = "Delivery failed") String reason) {
    return ResponseEntity.ok(deliveryService.markAsReturned(id, driverId, reason));
}
```

**Endpoint:** `PATCH /api/deliveries/{id}/mark-returned`

#### 4. Provider View

**Repository Method:**

```java
List<Delivery> findByStatus(String status);
```

**Service Method:**

```java
@Override
public List<DeliveryResponseDTO> getDeliveriesByStatus(String status) {
    return deliveryRepository.findByStatus(status).stream()
            .map(savMapper::toDeliveryResponse)
            .collect(Collectors.toList());
}
```

**Controller Endpoint:**

```java
@GetMapping("/status/{status}")
public ResponseEntity<List<DeliveryResponseDTO>> getDeliveriesByStatus(@PathVariable String status) {
    return ResponseEntity.ok(deliveryService.getDeliveriesByStatus(status));
}
```

**Endpoint:** `GET /api/deliveries/status/RETURNED`

### Frontend Architecture

#### 1. Service Layer (`sav.service.ts`)

```typescript
markAsReturned(deliveryId: string, driverId: string, reason: string = 'Delivery failed'): Observable<Delivery> {
  return this.http.patch<Delivery>(`${this.deliveryUrl}/${deliveryId}/mark-returned`, null, {
    params: { driverId, reason }
  });
}

getDeliveriesByStatus(status: DeliveryStatus): Observable<Delivery[]> {
  return this.http.get<Delivery[]>(`${this.deliveryUrl}/status/${status}`);
}
```

#### 2. Driver Component (`driver-deliveries.component.ts`)

```typescript
confirmMarkReturned() {
  const delivery = this.selectedDelivery();
  
  if (!delivery || !this.selectedReturnReason()) {
    this.toastService.warning('Please select a reason.');
    return;
  }

  // Use the correct delivery service endpoint (clean architecture)
  this.savService.markAsReturned(delivery.id, this.myUserId(), this.selectedReturnReason()).subscribe({
    next: () => {
      this.toastService.success('Delivery marked as returned. Package must be returned to shop.');
      this.closeReturnModal();
      this.loadAllData();
    },
    error: (err) => {
      this.toastService.error('Failed to mark delivery as returned: ' + (err.error?.message || err.message));
    }
  });
}
```

#### 3. Provider Component (Future Implementation)

```typescript
loadReturnedDeliveries() {
  this.savService.getDeliveriesByStatus('RETURNED').subscribe({
    next: (deliveries) => {
      this.returnedDeliveries.set(deliveries);
    },
    error: (err) => {
      this.toastService.error('Failed to load returned deliveries');
    }
  });
}
```

## Complete Workflow

### 1. Driver Marks as Returned

```
Driver clicks "Mark as Returned"
    ↓
Frontend calls: PATCH /api/deliveries/{id}/mark-returned
    ↓
Backend updates: delivery.status = "RETURNED"
    ↓
Backend sends notification to admins
    ↓
Frontend shows success message
```

### 2. Provider Views Returned Deliveries

```
Provider opens dashboard
    ↓
Frontend calls: GET /api/deliveries/status/RETURNED
    ↓
Backend queries: deliveryRepository.findByStatus("RETURNED")
    ↓
Frontend displays list of returned deliveries
```

### 3. Provider Verifies and Restocks (Existing Workflow)

```
Provider clicks "Verify & Restock"
    ↓
Frontend calls: POST /api/provider/orders/{orderId}/pickup
    ↓
Backend updates: order.status = RESTOCKED
    ↓
Backend restores stock
    ↓
Frontend shows success message
```

## API Endpoints Summary

### Delivery Endpoints (SAV Module)

| Method | Endpoint | Description | Actor |
|--------|----------|-------------|-------|
| PATCH | `/api/deliveries/{id}/mark-returned` | Mark delivery as returned | Driver |
| GET | `/api/deliveries/status/RETURNED` | Get all returned deliveries | Provider/Admin |
| GET | `/api/deliveries/user/{userId}` | Get deliveries by driver | Driver |
| PATCH | `/api/deliveries/{id}/mark-delivered` | Mark delivery as completed | Driver |

### Order Endpoints (Cart Module)

| Method | Endpoint | Description | Actor |
|--------|----------|-------------|-------|
| POST | `/api/provider/orders/{orderId}/pickup` | Verify and restock returned order | Provider |
| GET | `/api/provider/orders/returned` | Get orders with status RETURNED | Provider |

## Benefits of Clean Architecture

### ✅ Advantages

1. **Simplicity**: Each entity manages its own status
2. **Maintainability**: No complex matching logic
3. **Reliability**: No 500 errors from missing relationships
4. **Scalability**: Easy to add new delivery statuses
5. **Testability**: Simple, focused methods
6. **Separation of Concerns**: Delivery workflow is independent from Order workflow

### ❌ Problems Avoided

1. ❌ No "Order not found for this delivery" errors
2. ❌ No complex cartId/orderId matching logic
3. ❌ No fragile relationships between entities
4. ❌ No mixing of Delivery and Order concerns
5. ❌ No backward compatibility issues with old data

## Migration Notes

### Old Implementation (Removed)

The following broken endpoints were removed from `DeliveryOrderController`:

- ❌ `POST /api/delivery/orders/{orderId}/return` - Tried to find Order directly
- ❌ `POST /api/delivery/orders/by-delivery/{deliveryId}/return` - Tried to find Order from Delivery

These endpoints mixed concerns and created fragile, error-prone code.

### New Implementation (Current)

- ✅ `PATCH /api/deliveries/{id}/mark-returned` - Updates only Delivery status
- ✅ `GET /api/deliveries/status/RETURNED` - Queries deliveries by status

## Testing

### Manual Testing Steps

1. **Driver marks delivery as returned:**
   ```bash
   curl -X PATCH "http://localhost:8090/api/deliveries/{deliveryId}/mark-returned?driverId={driverId}&reason=Customer%20absent" \
     -H "Authorization: Bearer {token}"
   ```

2. **Provider views returned deliveries:**
   ```bash
   curl -X GET "http://localhost:8090/api/deliveries/status/RETURNED" \
     -H "Authorization: Bearer {token}"
   ```

3. **Provider verifies and restocks:**
   ```bash
   curl -X POST "http://localhost:8090/api/provider/orders/{orderId}/pickup" \
     -H "Authorization: Bearer {token}"
   ```

### Expected Results

- ✅ Delivery status changes to RETURNED
- ✅ Admin receives notification
- ✅ Provider sees delivery in returned list
- ✅ Provider can verify and restock
- ✅ Order status changes to RESTOCKED
- ✅ Stock is restored

## Conclusion

This clean architecture implementation:

- ✅ Separates Delivery and Order concerns
- ✅ Simplifies the return workflow
- ✅ Eliminates complex matching logic
- ✅ Provides reliable, maintainable code
- ✅ Follows Spring Boot best practices
- ✅ Enables easy future enhancements

**Key Principle:** Delivery status drives the return workflow. Order system is NOT involved in the return process.
