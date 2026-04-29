# Provider Returned Orders - Visual Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                  PROVIDER RETURNED ORDERS SYSTEM                     │
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
│  │ Driver Component │  │Provider Dashboard│  │ Admin Component  │ │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘ │
│           │                     │                      │            │
│           │         ┌───────────▼───────────┐          │            │
│           │         │  Provider Service     │          │            │
│           │         │  - getReturnedOrders()│          │            │
│           │         │  - restockOrder()     │          │            │
│           │         │  - Transform Data     │          │            │
│           │         └───────────┬───────────┘          │            │
└───────────┼─────────────────────┼──────────────────────┼────────────┘
            │                     │                      │
            │                     │ HTTP/REST            │
            │                     │                      │
┌───────────▼─────────────────────▼──────────────────────▼────────────┐
│                      BACKEND (Spring Boot)                           │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │         ProviderOrderController                               │  │
│  │  GET /api/provider/orders/returned                           │  │
│  │  POST /api/provider/orders/{id}/pickup                       │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                           │                                         │
│  ┌────────────────────────▼─────────────────────────────────────┐  │
│  │  1. Query DeliveryRepository.findByStatus("RETURNED")        │  │
│  │  2. Extract orderId from each Delivery                       │  │
│  │  3. Query OrderRepository.findById(orderId)                  │  │
│  │  4. Filter orders with provider's products                   │  │
│  │  5. Transform Order → OrderResponse                          │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
                            │ MongoDB Driver
                            │
┌───────────────────────────▼─────────────────────────────────────────┐
│                      DATABASE (MongoDB)                              │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Collection: deliveries                                       │  │
│  │  Query: { status: "RETURNED" }                               │  │
│  │  Result: [                                                    │  │
│  │    { _id: ..., orderId: "507f...", status: "RETURNED" }     │  │
│  │  ]                                                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Collection: orders                                           │  │
│  │  Query: { _id: { $in: [orderIds] } }                        │  │
│  │  Result: [                                                    │  │
│  │    { _id: "507f...", status: "RETURNED", items: [...] }     │  │
│  │  ]                                                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Sequence Diagram: View Returned Orders

```
Provider        Frontend        Backend         DeliveryRepo    OrderRepo
  │                │               │                 │              │
  │ Click          │               │                 │              │
  │ "Returned      │               │                 │              │
  │ Orders" tab    │               │                 │              │
  ├───────────────>│               │                 │              │
  │                │               │                 │              │
  │                │ GET /api/     │                 │              │
  │                │ provider/     │                 │              │
  │                │ orders/       │                 │              │
  │                │ returned      │                 │              │
  │                ├──────────────>│                 │              │
  │                │               │                 │              │
  │                │               │ findByStatus    │              │
  │                │               │ ("RETURNED")    │              │
  │                │               ├────────────────>│              │
  │                │               │                 │              │
  │                │               │ List<Delivery>  │              │
  │                │               │<────────────────┤              │
  │                │               │                 │              │
  │                │               │ Extract         │              │
  │                │               │ orderIds        │              │
  │                │               │                 │              │
  │                │               │ findById        │              │
  │                │               │ (orderIds)      │              │
  │                │               ├─────────────────┼─────────────>│
  │                │               │                 │              │
  │                │               │ List<Order>     │              │
  │                │               │<────────────────┼──────────────┤
  │                │               │                 │              │
  │                │               │ Filter by       │              │
  │                │               │ provider's      │              │
  │                │               │ products        │              │
  │                │               │                 │              │
  │                │               │ Transform       │              │
  │                │               │ Order →         │              │
  │                │               │ OrderResponse   │              │
  │                │               │                 │              │
  │                │ 200 OK        │                 │              │
  │                │ OrderResponse[]│                │              │
  │                │<──────────────┤                 │              │
  │                │               │                 │              │
  │                │ Transform     │                 │              │
  │                │ OrderResponse[]│                │              │
  │                │ →             │                 │              │
  │                │ ProviderOrder[]│                │              │
  │                │               │                 │              │
  │ Display        │               │                 │              │
  │ Returned       │               │                 │              │
  │ Orders         │               │                 │              │
  │<───────────────┤               │                 │              │
  │                │               │                 │              │
```

## Data Transformation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DATA TRANSFORMATION                               │
└─────────────────────────────────────────────────────────────────────┘

STEP 1: QUERY DELIVERIES
┌──────────────────────────┐
│ MongoDB: deliveries      │
│ Query: {                 │
│   status: "RETURNED"     │
│ }                        │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Result: Delivery[]       │
│ [                        │
│   {                      │
│     _id: "...",          │
│     orderId: "507f...",  │
│     status: "RETURNED",  │
│     cartId: "...",       │
│     userId: "..."        │
│   }                      │
│ ]                        │
└────────┬─────────────────┘
         │
         ▼
STEP 2: EXTRACT ORDER IDS
┌──────────────────────────┐
│ Extract orderId          │
│ Filter null values       │
│ Remove duplicates        │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Result: ObjectId[]       │
│ [                        │
│   "507f1f77bcf86cd...",  │
│   "507f1f77bcf86cd...",  │
│   "507f1f77bcf86cd..."   │
│ ]                        │
└────────┬─────────────────┘
         │
         ▼
STEP 3: QUERY ORDERS
┌──────────────────────────┐
│ MongoDB: orders          │
│ Query: {                 │
│   _id: { $in: orderIds } │
│ }                        │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Result: Order[]          │
│ [                        │
│   {                      │
│     _id: "507f...",      │
│     status: "RETURNED",  │
│     user: {...},         │
│     items: [...]         │
│   }                      │
│ ]                        │
└────────┬─────────────────┘
         │
         ▼
STEP 4: FILTER BY PROVIDER
┌──────────────────────────┐
│ For each order:          │
│ - Get OrderItems         │
│ - Check if shopId        │
│   matches provider       │
│ - Keep if match          │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Result: Order[]          │
│ (filtered)               │
└────────┬─────────────────┘
         │
         ▼
STEP 5: TRANSFORM TO DTO
┌──────────────────────────┐
│ Order → OrderResponse    │
│ {                        │
│   id: order.id,          │
│   status: order.status,  │
│   items: [               │
│     {                    │
│       id: item.id,       │
│       productName: ...,  │
│       quantity: ...,     │
│       subtotal: ...      │
│     }                    │
│   ]                      │
│ }                        │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Backend Response:        │
│ OrderResponse[]          │
└────────┬─────────────────┘
         │
         ▼
STEP 6: FRONTEND TRANSFORM
┌──────────────────────────┐
│ OrderResponse[] →        │
│ ProviderOrder[]          │
│                          │
│ For each OrderResponse:  │
│   For each item:         │
│     Create ProviderOrder │
│     {                    │
│       orderId: order.id, │
│       productName: ...,  │
│       quantity: ...,     │
│       ...                │
│     }                    │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Frontend Display:        │
│ ProviderOrder[]          │
│ (flattened items)        │
└──────────────────────────┘
```

## Before vs After Comparison

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ❌ BEFORE (Broken)                                │
└─────────────────────────────────────────────────────────────────────┘

Provider Dashboard
    ↓
GET /api/provider/orders/returned
    ↓
Query: orderRepository.findByStatus(OrderStatus.RETURNED)
    ↓
Problem: Orders don't have status=RETURNED
         (Delivery has status=RETURNED, not Order)
    ↓
Result: Empty array []
    ↓
UI: "No Returned Orders" ❌


┌─────────────────────────────────────────────────────────────────────┐
│                    ✅ AFTER (Fixed)                                  │
└─────────────────────────────────────────────────────────────────────┘

Provider Dashboard
    ↓
GET /api/provider/orders/returned
    ↓
Query 1: deliveryRepository.findByStatus("RETURNED")
    ↓
Extract: delivery.orderId for each
    ↓
Query 2: orderRepository.findById(orderIds)
    ↓
Filter: Orders with provider's products
    ↓
Transform: Order → OrderResponse
    ↓
Result: OrderResponse[] with data ✅
    ↓
Frontend: Transform OrderResponse[] → ProviderOrder[]
    ↓
UI: Display returned orders ✅
```

## Entity Relationship

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ENTITY RELATIONSHIPS                              │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│    Delivery      │
├──────────────────┤
│ id: ObjectId     │
│ status: String   │ ← "RETURNED" (filter by this)
│ orderId: ObjectId│ ─┐
│ cartId: ObjectId │  │
│ userId: ObjectId │  │
└──────────────────┘  │
                      │
                      │ References
                      │
                      ▼
              ┌──────────────┐
              │    Order     │
              ├──────────────┤
              │ id: ObjectId │ ← Get by this
              │ status: Enum │
              │ user: User   │
              │ items: []    │ ─┐
              └──────────────┘  │
                                │
                                │ Contains
                                │
                                ▼
                        ┌──────────────┐
                        │  OrderItem   │
                        ├──────────────┤
                        │ id: ObjectId │
                        │ productId    │
                        │ productName  │
                        │ quantity     │
                        │ subtotal     │
                        │ shopId       │ ← Filter by provider's shop
                        └──────────────┘

WORKFLOW:
1. Query Delivery where status = "RETURNED"
2. Extract orderId from each Delivery
3. Query Order where id IN (orderIds)
4. Filter Order where items.shopId = provider.shopId
5. Transform Order → OrderResponse
6. Return OrderResponse[]
```

## Key Architectural Decision

```
┌─────────────────────────────────────────────────────────────────────┐
│              WHY FILTER BY DELIVERY.STATUS?                          │
└─────────────────────────────────────────────────────────────────────┘

BUSINESS LOGIC:
- Driver marks Delivery as RETURNED (delivery failed)
- Delivery.status = "RETURNED"
- Order.status may still be IN_TRANSIT or other status
- Provider needs to see deliveries that were returned
- Provider verifies physical item
- Provider restocks → Order.status = RESTOCKED

THEREFORE:
✅ Filter by Delivery.status = "RETURNED"
❌ NOT by Order.status = "RETURNED"

REASON:
- Delivery entity tracks physical delivery status
- Order entity tracks business order status
- They are independent but related
- Return workflow is driven by Delivery, not Order
```

---

## Summary

### Key Components

1. **Delivery Entity:** Tracks physical delivery status
2. **Order Entity:** Tracks business order status
3. **OrderItem Entity:** Links orders to products and shops
4. **Provider Filter:** Shows only orders with provider's products

### Data Flow

```
Delivery (status=RETURNED)
    ↓
Extract orderId
    ↓
Get Order by ID
    ↓
Filter by provider's shop
    ↓
Transform to DTO
    ↓
Display in UI
```

### Success Metrics

- ✅ Correct filtering by Delivery.status
- ✅ Proper Order extraction
- ✅ Provider-specific filtering
- ✅ Clean data transformation
- ✅ Production-ready implementation

---

**Last Updated:** 2026-04-29  
**Status:** ✅ PRODUCTION READY
