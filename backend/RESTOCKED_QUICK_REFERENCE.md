# RESTOCKED Status - Quick Reference

## Status Flow
```
PENDING → CONFIRMED → PREPARING → IN_TRANSIT → DELIVERED ✅
                                              ↓
                                          RETURNED → RESTOCKED ✅
```

## Stock Logic
```
CONFIRMED  → Stock REDUCED
RETURNED   → Stock NOT CHANGED
RESTOCKED  → Stock RESTORED ✅
CANCELLED  → Stock RESTORED (if was CONFIRMED)
```

## API Endpoints

### Get Returned Orders
```bash
GET /api/provider/orders/returned
Authorization: Bearer {token}

# Returns orders with status = RETURNED
```

### Restock Order
```bash
POST /api/provider/orders/{orderId}/pickup
Authorization: Bearer {token}

# Changes status: RETURNED → RESTOCKED
# Restores stock automatically
```

## Status Transitions

| From | To | Actor | Allowed |
|------|-----|-------|---------|
| RETURNED | RESTOCKED | Provider | ✅ |
| RETURNED | DELIVERED | Any | ❌ |
| RETURNED | CANCELLED | Any | ❌ |
| RESTOCKED | Any | Any | ❌ |

## Files Changed
1. `OrderStatus.java` - Added RESTOCKED enum
2. `Order.java` - Added restockedAt field
3. `OrderStatusValidator.java` - Added RETURNED → RESTOCKED validation
4. `OrderServiceImpl.java` - Stock restoration in RESTOCKED case
5. `ProviderOrderController.java` - Updated endpoint logic

## Database Migration
```javascript
// Mark existing RETURNED orders as RESTOCKED
db.orders.updateMany(
  { status: "RETURNED" },
  { $set: { status: "RESTOCKED", restockedAt: new Date() } }
)
```

## Frontend Changes
```typescript
// 1. Add to enum
RESTOCKED = 'RESTOCKED'

// 2. Add label
'RESTOCKED': 'Restocked'

// 3. Add color
'RESTOCKED': 'badge-secondary'

// 4. Create "Returned Orders" section in provider dashboard
```

## Testing
```bash
# 1. Mark order as RETURNED
curl -X PUT http://localhost:8090/api/orders/{id}/status?status=RETURNED

# 2. Get returned orders
curl -X GET http://localhost:8090/api/provider/orders/returned \
  -H "Authorization: Bearer {token}"

# 3. Restock order
curl -X POST http://localhost:8090/api/provider/orders/{id}/pickup \
  -H "Authorization: Bearer {token}"

# 4. Verify status = RESTOCKED and stock restored
```

## Key Points
- ✅ RETURNED = waiting for provider verification
- ✅ RESTOCKED = verified and stock restored
- ✅ Stock restoration ONLY happens at RESTOCKED
- ✅ Provider must manually verify before restocking
- ✅ RESTOCKED is a final state (cannot be changed)
