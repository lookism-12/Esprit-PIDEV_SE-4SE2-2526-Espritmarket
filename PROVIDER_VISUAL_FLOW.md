# 🎨 Provider Dashboard - Visual Flow Diagram

## 📊 Overall Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Angular)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Provider Dashboard Component                    │  │
│  │  - Orders table with filters                             │  │
│  │  - Statistics cards                                      │  │
│  │  - Confirm/Cancel buttons                                │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │ HTTP Requests                             │
│                     │ (with JWT token)                          │
└─────────────────────┼───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Spring Boot)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │      ProviderDashboardController                          │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │ GET /api/provider/orders                            │ │  │
│  │  │ GET /api/provider/statistics                        │ │  │
│  │  │ PUT /api/provider/orders/{id}/status                │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │                                           │
│                     ▼                                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Repositories                                 │  │
│  │  - ShopRepository    → shops collection                  │  │
│  │  - ProductRepository → products collection               │  │
│  │  - CartRepository    → carts collection (orders)         │  │
│  │  - CartItemRepository → cart_items collection            │  │
│  │  - UserRepository    → users collection                  │  │
│  └──────────────────┬───────────────────────────────────────┘  │
└─────────────────────┼───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (MongoDB)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  users   │  │  shops   │  │ products │  │  carts   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                              ┌──────────┐       │
│                                              │cart_items│       │
│                                              └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 GET /api/provider/orders - Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│ 1. REQUEST ARRIVES                                             │
│    GET /api/provider/orders                                    │
│    Header: Authorization: Bearer JWT_TOKEN                     │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│ 2. AUTHENTICATE USER                                           │
│    Extract email from JWT → Find User → Verify PROVIDER role  │
│    Result: User provider (ObjectId, email, name, role)        │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│ 3. FIND PROVIDER'S SHOP                                        │
│    Query: db.shops.findOne({ ownerId: provider.id })          │
│    ┌─────────────────────────────────────────────────────┐    │
│    │ ✅ Shop Found?                    ❌ No Shop?        │    │
│    │ → Continue to step 4             → Return [] (200)  │    │
│    └─────────────────────────────────────────────────────┘    │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│ 4. FIND SHOP'S PRODUCTS                                        │
│    Query: db.products.find({ shopId: shop.id })               │
│    ┌─────────────────────────────────────────────────────┐    │
│    │ ✅ Products Found?                ❌ No Products?    │    │
│    │ → Continue to step 5             → Return [] (200)  │    │
│    └─────────────────────────────────────────────────────┘    │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│ 5. CREATE PRODUCT ID SET                                       │
│    Set<String> productIds = [                                  │
│      "product1_id", "product2_id", "product3_id", ...          │
│    ]                                                            │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│ 6. FIND ALL NON-DRAFT ORDERS                                   │
│    Query: db.carts.find({                                      │
│      status: { $in: [PENDING, CONFIRMED, CANCELLED, ...] }    │
│    })                                                           │
│    Result: List<Cart> allOrders                               │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│ 7. FILTER ORDERS (For each order in allOrders)                │
│    ┌──────────────────────────────────────────────────────┐   │
│    │ a. Get order items:                                   │   │
│    │    db.cart_items.find({ cartId: order.id })          │   │
│    │                                                        │   │
│    │ b. Filter items containing provider's products:       │   │
│    │    providerItems = items.filter(                      │   │
│    │      item.productId IN productIds                     │   │
│    │    )                                                   │   │
│    │                                                        │   │
│    │ c. If providerItems not empty:                        │   │
│    │    ┌────────────────────────────────────────────┐     │   │
│    │    │ Create ProviderOrderDTO:                   │     │   │
│    │    │ - orderId                                  │     │   │
│    │    │ - cartItemId                               │     │   │
│    │    │ - clientName (from User)                   │     │   │
│    │    │ - clientEmail                              │     │   │
│    │    │ - productName                              │     │   │
│    │    │ - quantity                                 │     │   │
│    │    │ - unitPrice                                │     │   │
│    │    │ - subTotal                                 │     │   │
│    │    │ - orderStatus                              │     │   │
│    │    │ - orderDate                                │     │   │
│    │    └────────────────────────────────────────────┘     │   │
│    └──────────────────────────────────────────────────────┘   │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│ 8. RETURN RESPONSE                                             │
│    200 OK                                                      │
│    [                                                            │
│      { orderId: "...", clientName: "...", ... },              │
│      { orderId: "...", clientName: "...", ... }               │
│    ]                                                            │
└────────────────────────────────────────────────────────────────┘
```

## 📈 GET /api/provider/statistics - Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│ 1-5. Same as Orders Flow                                       │
│      (Authenticate → Find Shop → Find Products → Create Set)   │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│ 6. INITIALIZE COUNTERS                                         │
│    Map<String, Integer> statusCounts = {}                      │
│    Double totalRevenue = 0.0                                   │
│    int providerOrderCount = 0                                  │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│ 7. PROCESS EACH ORDER                                          │
│    For each order in allOrders:                                │
│    ┌──────────────────────────────────────────────────────┐   │
│    │ a. Get order items                                    │   │
│    │ b. Filter provider's items                            │   │
│    │ c. If providerItems not empty:                        │   │
│    │    ┌────────────────────────────────────────────┐     │   │
│    │    │ providerOrderCount++                       │     │   │
│    │    │                                             │     │   │
│    │    │ statusCounts[order.status]++               │     │   │
│    │    │                                             │     │   │
│    │    │ if order.status is CONFIRMED/DELIVERED/    │     │   │
│    │    │    SHIPPED:                                │     │   │
│    │    │    totalRevenue += item.subTotal           │     │   │
│    │    └────────────────────────────────────────────┘     │   │
│    └──────────────────────────────────────────────────────┘   │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│ 8. BUILD RESPONSE                                              │
│    {                                                            │
│      "pendingOrders": statusCounts.get("PENDING"),            │
│      "confirmedOrders": statusCounts.get("CONFIRMED"),        │
│      "cancelledOrders": statusCounts.get("CANCELLED"),        │
│      "totalOrders": providerOrderCount,  ← NOT allOrders.size!│
│      "totalRevenue": totalRevenue                             │
│    }                                                            │
└────────────────────────────────────────────────────────────────┘
```

## ✏️ PUT /api/provider/orders/{id}/status - Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│ 1. REQUEST ARRIVES                                             │
│    PUT /api/provider/orders/ORDER_ID/status?newStatus=...     │
│    Header: Authorization: Bearer JWT_TOKEN                     │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│ 2. AUTHENTICATE USER                                           │
│    Result: User provider                                       │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│ 3. VALIDATE ORDER ID                                           │
│    Try: new ObjectId(orderId)                                  │
│    ┌─────────────────────────────────────────────────────┐    │
│    │ ✅ Valid?              ❌ Invalid?                   │    │
│    │ → Continue            → Return 400 Bad Request      │    │
│    └─────────────────────────────────────────────────────┘    │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│ 4. FIND ORDER                                                  │
│    Query: db.carts.findOne({ _id: orderId })                  │
│    ┌─────────────────────────────────────────────────────┐    │
│    │ ✅ Found?              ❌ Not Found?                 │    │
│    │ → Continue            → Return 404 Not Found        │    │
│    └─────────────────────────────────────────────────────┘    │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│ 5. VERIFY OWNERSHIP                                            │
│    Check: Does order contain provider's products?              │
│    ┌─────────────────────────────────────────────────────┐    │
│    │ ✅ Authorized?         ❌ Not Authorized?            │    │
│    │ → Continue            → Return 403 Forbidden        │    │
│    └─────────────────────────────────────────────────────┘    │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│ 6. PROCESS STATUS CHANGE                                       │
│    ┌──────────────────────────────────────────────────────┐   │
│    │ If newStatus == CONFIRMED:                            │   │
│    │   order.status = CONFIRMED                            │   │
│    │   save(order)                                         │   │
│    │                                                        │   │
│    │ If newStatus == CANCELLED:                            │   │
│    │   For each item in order:                             │   │
│    │     product = findProduct(item.productId)             │   │
│    │     product.quantity += item.quantity  ← Restore!     │   │
│    │     save(product)                                     │   │
│    │   order.status = CANCELLED                            │   │
│    │   save(order)                                         │   │
│    │                                                        │   │
│    │ Otherwise:                                            │   │
│    │   Return 400 Bad Request (unsupported status)        │   │
│    └──────────────────────────────────────────────────────┘   │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│ 7. BUILD RESPONSE                                              │
│    Get updated order details                                   │
│    Create ProviderOrderDTO with:                              │
│    - orderId, cartItemId                                      │
│    - clientName, clientEmail                                  │
│    - productName, quantity, prices                            │
│    - orderStatus (updated), orderDate                         │
│                                                                 │
│    Return 200 OK with DTO                                     │
└────────────────────────────────────────────────────────────────┘
```

## 🎯 Error Handling Matrix

```
┌──────────────────────┬─────────────┬────────────────────────────┐
│ Scenario             │ HTTP Code   │ Response Body               │
├──────────────────────┼─────────────┼────────────────────────────┤
│ Success              │ 200 OK      │ Data (array/object)         │
├──────────────────────┼─────────────┼────────────────────────────┤
│ No shop exists       │ 200 OK      │ [] (empty array)            │
├──────────────────────┼─────────────┼────────────────────────────┤
│ No products exist    │ 200 OK      │ [] (empty array)            │
├──────────────────────┼─────────────┼────────────────────────────┤
│ No orders exist      │ 200 OK      │ [] (empty array)            │
├──────────────────────┼─────────────┼────────────────────────────┤
│ Invalid order ID     │ 400 Bad Req │ (empty body)                │
├──────────────────────┼─────────────┼────────────────────────────┤
│ Unsupported status   │ 400 Bad Req │ (empty body)                │
├──────────────────────┼─────────────┼────────────────────────────┤
│ Not authorized       │ 403 Forbidden│ (empty body)               │
├──────────────────────┼─────────────┼────────────────────────────┤
│ Order not found      │ 404 Not Found│ (empty body)               │
├──────────────────────┼─────────────┼────────────────────────────┤
│ Unexpected error     │ 500 Error   │ (only for true failures)    │
└──────────────────────┴─────────────┴────────────────────────────┘
```

## 🔗 Data Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐              ┌──────────────┐
│    User      │              │     Shop     │
│  (Provider)  │──────owns───→│              │
│              │              │              │
│ - id         │              │ - id         │
│ - email      │              │ - ownerId ───┘
│ - firstName  │              │ - name       │
│ - lastName   │              │ - address    │
│ - role       │              └──────┬───────┘
└──────────────┘                     │
                                     │ has
                                     ▼
                              ┌──────────────┐
                              │   Product    │
                              │              │
                              │ - id         │
                              │ - shopId ────┘
                              │ - name       │
                              │ - price      │
                              │ - stock      │
                              └──────┬───────┘
                                     │
                           referenced by
                                     │
                                     ▼
┌──────────────┐              ┌──────────────┐
│     User     │              │  CartItem    │
│  (Customer)  │              │              │
│              │              │ - id         │
│ - id         │              │ - cartId     │
│ - email      │              │ - productId ─┘
│ - name       │              │ - quantity   │
└──────┬───────┘              │ - unitPrice  │
       │                      │ - subTotal   │
       │                      └──────┬───────┘
       │                             │
       │                      belongs to
       │                             │
       │                             ▼
       │                      ┌──────────────┐
       │                      │     Cart     │
       └──────places─────────→│   (Order)    │
                              │              │
                              │ - id         │
                              │ - userId ────┘
                              │ - status     │
                              │ - total      │
                              │ - creationDate│
                              └──────────────┘
```

## 🎬 Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Customer places order                                   │
│   Customer adds products → Checkout → Order created (PENDING)   │
│   Stock reduced from products                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Provider logs in                                        │
│   Login page → JWT token → Navigate to dashboard                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Dashboard loads orders                                  │
│   GET /api/provider/orders                                      │
│   → Backend filters orders containing provider's products       │
│   → Returns list of orders with customer info                   │
│   → Frontend displays in table                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Dashboard loads statistics                              │
│   GET /api/provider/statistics                                  │
│   → Backend counts provider's orders only                       │
│   → Calculates revenue from confirmed orders                    │
│   → Returns stats object                                        │
│   → Frontend displays in cards                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Provider confirms order                                 │
│   Click "Confirm" → Confirmation dialog → Yes                   │
│   PUT /api/provider/orders/{id}/status?newStatus=CONFIRMED      │
│   → Backend updates order status to CONFIRMED                   │
│   → Returns updated order                                       │
│   → Frontend shows success toast                                │
│   → Dashboard refreshes automatically                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ ALTERNATIVE: Provider cancels order                             │
│   Click "Cancel" → Confirmation dialog → Yes                    │
│   PUT /api/provider/orders/{id}/status?newStatus=CANCELLED      │
│   → Backend restores product stock                              │
│   → Backend updates order status to CANCELLED                   │
│   → Returns updated order                                       │
│   → Frontend shows success toast                                │
│   → Dashboard refreshes automatically                           │
└─────────────────────────────────────────────────────────────────┘
```

---

**Visual Summary:** All endpoints now handle edge cases gracefully, return appropriate HTTP codes, and provide clear error messages. No more 500 errors! 🎉
