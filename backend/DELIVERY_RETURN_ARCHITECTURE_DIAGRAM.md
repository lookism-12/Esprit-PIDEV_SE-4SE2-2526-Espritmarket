# Delivery Return Architecture - Visual Diagrams

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DELIVERY RETURN SYSTEM                       │
│                         (Clean Architecture)                         │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   DRIVER     │         │   PROVIDER   │         │    ADMIN     │
│   (Actor)    │         │   (Actor)    │         │   (Actor)    │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       │ Mark as Returned       │ View Returned          │ View All
       │                        │ Verify & Restock       │ Notifications
       │                        │                        │
       ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Angular)                           │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │ Driver Component │  │Provider Component│  │ Admin Component  │ │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘ │
│           │                     │                      │            │
│           └─────────────────────┼──────────────────────┘            │
│                                 │                                   │
│                    ┌────────────▼────────────┐                      │
│                    │    SAV Service          │                      │
│                    │  - markAsReturned()     │                      │
│                    │  - getByStatus()        │                      │
│                    └────────────┬────────────┘                      │
└─────────────────────────────────┼───────────────────────────────────┘
                                  │
                                  │ HTTP/REST
                                  │
┌─────────────────────────────────▼───────────────────────────────────┐
│                      BACKEND (Spring Boot)                           │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              DeliveryController (SAV Module)                  │  │
│  │  PATCH /api/deliveries/{id}/mark-returned                    │  │
│  │  GET   /api/deliveries/status/RETURNED                       │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                           │                                         │
│  ┌────────────────────────▼─────────────────────────────────────┐  │
│  │                   DeliveryService                             │  │
│  │  - markAsReturned(deliveryId, driverId, reason)              │  │
│  │  - getDeliveriesByStatus(status)                             │  │
│  │  - notifyAllAdmins()                                         │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                           │                                         │
│  ┌────────────────────────▼─────────────────────────────────────┐  │
│  │              DeliveryRepository (MongoDB)                     │  │
│  │  - findByStatus(String status)                               │  │
│  │  - findById(ObjectId id)                                     │  │
│  │  - save(Delivery delivery)                                   │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
                              │ MongoDB Driver
                              │
┌─────────────────────────────▼───────────────────────────────────────┐
│                      DATABASE (MongoDB)                              │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Collection: deliveries                                       │  │
│  │  {                                                            │  │
│  │    _id: ObjectId,                                            │  │
│  │    status: "RETURNED",  ← ONLY THIS FIELD IS UPDATED         │  │
│  │    address: String,                                          │  │
│  │    userId: ObjectId,                                         │  │
│  │    cartId: ObjectId,                                         │  │
│  │    orderId: ObjectId                                         │  │
│  │  }                                                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Sequence Diagram: Mark as Returned

```
Driver          Frontend        Backend         Database        Notification
  │                │               │               │                 │
  │ Click "Mark    │               │               │                 │
  │ as Returned"   │               │               │                 │
  ├───────────────>│               │               │                 │
  │                │               │               │                 │
  │                │ Select Reason │               │                 │
  │                │ & Confirm     │               │                 │
  │                │               │               │                 │
  │                │ PATCH /api/   │               │                 │
  │                │ deliveries/   │               │                 │
  │                │ {id}/mark-    │               │                 │
  │                │ returned      │               │                 │
  │                ├──────────────>│               │                 │
  │                │               │               │                 │
  │                │               │ Find Delivery │                 │
  │                │               ├──────────────>│                 │
  │                │               │               │                 │
  │                │               │ Delivery      │                 │
  │                │               │<──────────────┤                 │
  │                │               │               │                 │
  │                │               │ Verify Driver │                 │
  │                │               │               │                 │
  │                │               │ Update Status │                 │
  │                │               │ to "RETURNED" │                 │
  │                │               ├──────────────>│                 │
  │                │               │               │                 │
  │                │               │ Success       │                 │
  │                │               │<──────────────┤                 │
  │                │               │               │                 │
  │                │               │ Notify Admins │                 │
  │                │               ├───────────────┼────────────────>│
  │                │               │               │                 │
  │                │ 200 OK        │               │                 │
  │                │ DeliveryDTO   │               │                 │
  │                │<──────────────┤               │                 │
  │                │               │               │                 │
  │ Success Toast  │               │               │                 │
  │<───────────────┤               │               │                 │
  │                │               │               │                 │
  │ Reload List    │               │               │                 │
  │                │               │               │                 │
```

## Sequence Diagram: Provider Views Returned Deliveries

```
Provider        Frontend        Backend         Database
  │                │               │               │
  │ Open Dashboard │               │               │
  ├───────────────>│               │               │
  │                │               │               │
  │                │ GET /api/     │               │
  │                │ deliveries/   │               │
  │                │ status/       │               │
  │                │ RETURNED      │               │
  │                ├──────────────>│               │
  │                │               │               │
  │                │               │ Query:        │
  │                │               │ findByStatus  │
  │                │               │ ("RETURNED")  │
  │                │               ├──────────────>│
  │                │               │               │
  │                │               │ List of       │
  │                │               │ Deliveries    │
  │                │               │<──────────────┤
  │                │               │               │
  │                │ 200 OK        │               │
  │                │ List<         │               │
  │                │ DeliveryDTO>  │               │
  │                │<──────────────┤               │
  │                │               │               │
  │ Display List   │               │               │
  │<───────────────┤               │               │
  │                │               │               │
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW                                    │
└─────────────────────────────────────────────────────────────────────┘

1. MARK AS RETURNED FLOW
   ┌──────────┐
   │  Driver  │
   └────┬─────┘
        │ deliveryId, driverId, reason
        ▼
   ┌────────────────┐
   │   Frontend     │
   │   Component    │
   └────┬───────────┘
        │ HTTP PATCH
        ▼
   ┌────────────────┐
   │   Controller   │
   │   (Endpoint)   │
   └────┬───────────┘
        │ deliveryId, driverId, reason
        ▼
   ┌────────────────┐
   │    Service     │
   │    (Logic)     │
   └────┬───────────┘
        │ Find delivery
        │ Verify driver
        │ Update status
        ▼
   ┌────────────────┐
   │  Repository    │
   │   (Data)       │
   └────┬───────────┘
        │ MongoDB Query
        ▼
   ┌────────────────┐
   │   Database     │
   │   (Storage)    │
   └────────────────┘

2. QUERY RETURNED DELIVERIES FLOW
   ┌──────────┐
   │ Provider │
   └────┬─────┘
        │ status = "RETURNED"
        ▼
   ┌────────────────┐
   │   Frontend     │
   │   Component    │
   └────┬───────────┘
        │ HTTP GET
        ▼
   ┌────────────────┐
   │   Controller   │
   │   (Endpoint)   │
   └────┬───────────┘
        │ status
        ▼
   ┌────────────────┐
   │    Service     │
   │    (Logic)     │
   └────┬───────────┘
        │ Query by status
        ▼
   ┌────────────────┐
   │  Repository    │
   │   (Data)       │
   └────┬───────────┘
        │ MongoDB Query
        ▼
   ┌────────────────┐
   │   Database     │
   │   (Storage)    │
   └────┬───────────┘
        │ List<Delivery>
        ▼
   ┌────────────────┐
   │   Frontend     │
   │   (Display)    │
   └────────────────┘
```

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ENTITY RELATIONSHIPS                              │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│    Delivery      │
├──────────────────┤
│ id: ObjectId     │ ← PRIMARY KEY
│ status: String   │ ← UPDATED BY markAsReturned()
│ address: String  │
│ deliveryDate     │
│ userId: ObjectId │ ─┐
│ cartId: ObjectId │  │
│ orderId: ObjectId│  │
└──────────────────┘  │
                      │
                      │ References (Unidirectional)
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│   User   │  │   Cart   │  │  Order   │
├──────────┤  ├──────────┤  ├──────────┤
│ id       │  │ id       │  │ id       │
│ roles    │  │ items    │  │ status   │
│ name     │  │ total    │  │ cartId   │
└──────────┘  └──────────┘  └──────────┘

IMPORTANT NOTES:
1. Delivery → User: Driver assigned to delivery
2. Delivery → Cart: Cart being delivered
3. Delivery → Order: Order associated with delivery (optional)
4. Delivery.status is INDEPENDENT from Order.status
5. markAsReturned() ONLY updates Delivery.status
6. NO reverse lookup (Order → Delivery) in return logic
```

## Status Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DELIVERY STATUS FLOW                              │
└─────────────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │  PREPARING   │ ← Initial status
                    └──────┬───────┘
                           │ Admin assigns driver
                           │
                    ┌──────▼───────┐
                    │ PENDING      │ ← Waiting for driver response
                    └──────┬───────┘
                           │
                ┌──────────┴──────────┐
                │                     │
         Driver │                     │ Driver
         Accepts│                     │ Declines
                │                     │
        ┌───────▼────────┐   ┌────────▼─────────┐
        │  IN_TRANSIT    │   │ DRIVER_REFUSED   │
        └───────┬────────┘   └──────────────────┘
                │
        ┌───────┴────────┐
        │                │
        │ Success        │ Failed
        │                │
┌───────▼────────┐  ┌────▼──────────┐
│   DELIVERED    │  │   RETURNED    │ ← Mark as Returned
└────────────────┘  └────┬──────────┘
                         │
                         │ Provider verifies
                         │ (Order workflow)
                         │
                    ┌────▼──────────┐
                    │  RESTOCKED    │ ← Stock restored
                    └───────────────┘

CLEAN ARCHITECTURE PRINCIPLE:
- markAsReturned() changes: IN_TRANSIT → RETURNED
- ONLY updates Delivery.status
- Does NOT update Order.status
- Provider handles Order.status separately
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                  COMPONENT INTERACTIONS                              │
└─────────────────────────────────────────────────────────────────────┘

FRONTEND LAYER
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌──────────────────────┐         ┌──────────────────────┐         │
│  │ DriverComponent      │         │ ProviderComponent    │         │
│  │                      │         │                      │         │
│  │ - openReturnModal()  │         │ - loadReturned()     │         │
│  │ - confirmReturn()    │         │ - restockOrder()     │         │
│  └──────────┬───────────┘         └──────────┬───────────┘         │
│             │                                │                      │
│             └────────────┬───────────────────┘                      │
│                          │                                          │
│                ┌─────────▼──────────┐                               │
│                │   SavService       │                               │
│                │                    │                               │
│                │ - markAsReturned() │                               │
│                │ - getByStatus()    │                               │
│                └─────────┬──────────┘                               │
└──────────────────────────┼───────────────────────────────────────────┘
                           │
                           │ HTTP/REST API
                           │
BACKEND LAYER
┌──────────────────────────▼───────────────────────────────────────────┐
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              DeliveryController                               │   │
│  │                                                               │   │
│  │  @PatchMapping("/{id}/mark-returned")                        │   │
│  │  @GetMapping("/status/{status}")                             │   │
│  └────────────────────────┬─────────────────────────────────────┘   │
│                           │                                          │
│  ┌────────────────────────▼─────────────────────────────────────┐   │
│  │              DeliveryService                                  │   │
│  │                                                               │   │
│  │  - markAsReturned()      ← ONLY updates Delivery.status      │   │
│  │  - getByStatus()         ← Queries by status                 │   │
│  │  - notifyAllAdmins()     ← Sends notifications               │   │
│  └────────────────────────┬─────────────────────────────────────┘   │
│                           │                                          │
│  ┌────────────────────────▼─────────────────────────────────────┐   │
│  │              DeliveryRepository                               │   │
│  │                                                               │   │
│  │  - findByStatus(String)  ← MongoDB query                     │   │
│  │  - findById(ObjectId)    ← Find by ID                        │   │
│  │  - save(Delivery)        ← Update delivery                   │   │
│  └────────────────────────┬─────────────────────────────────────┘   │
└───────────────────────────┼──────────────────────────────────────────┘
                            │
                            │ MongoDB Driver
                            │
DATABASE LAYER
┌───────────────────────────▼──────────────────────────────────────────┐
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  MongoDB Collection: deliveries                               │   │
│  │                                                               │   │
│  │  Query: { status: "RETURNED" }                               │   │
│  │  Update: { $set: { status: "RETURNED" } }                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

## Clean vs Broken Architecture Comparison

```
┌─────────────────────────────────────────────────────────────────────┐
│              ✅ CLEAN ARCHITECTURE (Current)                         │
└─────────────────────────────────────────────────────────────────────┘

Driver → Frontend → DeliveryController → DeliveryService
                                              │
                                              ▼
                                    Update Delivery.status
                                              │
                                              ▼
                                         MongoDB
                                              │
                                              ▼
                                         Success ✅

CHARACTERISTICS:
✅ Simple, direct flow
✅ Single responsibility
✅ No complex lookups
✅ No 500 errors
✅ Easy to maintain


┌─────────────────────────────────────────────────────────────────────┐
│              ❌ BROKEN ARCHITECTURE (Old)                            │
└─────────────────────────────────────────────────────────────────────┘

Driver → Frontend → DeliveryOrderController → DeliveryOrderService
                                                      │
                                                      ▼
                                          Find Delivery by ID
                                                      │
                                                      ▼
                                          Try find Order by orderId
                                                      │
                                                      ▼
                                          If null, try cartId
                                                      │
                                                      ▼
                                          If null, throw error ❌
                                                      │
                                                      ▼
                                          500 Error: "Order not found"

PROBLEMS:
❌ Complex matching logic
❌ Fragile relationships
❌ 500 errors for old data
❌ Mixed concerns
❌ Hard to maintain
```

---

## Summary

### Key Architectural Principles

1. **Separation of Concerns**
   - Delivery entity manages delivery status
   - Order entity manages order status
   - No mixing of concerns

2. **Single Responsibility**
   - markAsReturned() only updates Delivery.status
   - No Order lookup or update
   - Simple, focused methods

3. **Clean Code**
   - Easy to read and understand
   - Minimal complexity
   - Proper error handling

4. **RESTful Design**
   - Proper HTTP methods (PATCH, GET)
   - Resource-based URLs
   - Standard status codes

5. **Maintainability**
   - Easy to modify and extend
   - Clear documentation
   - Testable components

---

**Last Updated:** 2026-04-29  
**Status:** ✅ Production Ready
