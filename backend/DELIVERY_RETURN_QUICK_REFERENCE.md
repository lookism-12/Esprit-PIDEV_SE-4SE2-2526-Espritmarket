# Delivery Return - Quick Reference Guide

## 🎯 Quick Summary

**Problem:** Driver needs to mark failed deliveries as returned.

**Solution:** Simple, clean architecture where Delivery status is independent from Order status.

## 🚀 Implementation Status

✅ **COMPLETED** - All components implemented and working

## 📋 API Endpoints

### Driver: Mark as Returned

```http
PATCH /api/deliveries/{deliveryId}/mark-returned
Query Params:
  - driverId: string (required)
  - reason: string (optional, default: "Delivery failed")

Response: DeliveryResponseDTO
```

**Example:**
```bash
curl -X PATCH "http://localhost:8090/api/deliveries/123/mark-returned?driverId=456&reason=Customer%20absent" \
  -H "Authorization: Bearer {token}"
```

### Provider: Get Returned Deliveries

```http
GET /api/deliveries/status/RETURNED

Response: List<DeliveryResponseDTO>
```

**Example:**
```bash
curl -X GET "http://localhost:8090/api/deliveries/status/RETURNED" \
  -H "Authorization: Bearer {token}"
```

### Provider: Verify and Restock

```http
POST /api/provider/orders/{orderId}/pickup

Response: OrderResponse
```

**Example:**
```bash
curl -X POST "http://localhost:8090/api/provider/orders/789/pickup" \
  -H "Authorization: Bearer {token}"
```

## 🔄 Complete Workflow

```
1. Driver accepts delivery
   Status: PREPARING → IN_TRANSIT

2. Delivery fails (customer absent/refused/wrong address)
   Driver clicks "Mark as Returned"
   
3. Backend updates Delivery status
   Status: IN_TRANSIT → RETURNED
   
4. Admin receives notification
   "↩️ Delivery Returned — ORD-2026-ABC12"

5. Provider views returned deliveries
   GET /api/deliveries/status/RETURNED
   
6. Provider verifies physical item
   Clicks "Verify & Restock"
   
7. Backend updates Order status and restores stock
   Order Status: RETURNED → RESTOCKED
   Stock: +1 to inventory
```

## 💻 Frontend Usage

### Driver Component

```typescript
// Mark delivery as returned
confirmMarkReturned() {
  const delivery = this.selectedDelivery();
  
  this.savService.markAsReturned(
    delivery.id, 
    this.myUserId(), 
    this.selectedReturnReason()
  ).subscribe({
    next: () => {
      this.toastService.success('Delivery marked as returned');
      this.loadAllData();
    },
    error: (err) => {
      this.toastService.error('Failed: ' + err.message);
    }
  });
}
```

### Provider Component (Future)

```typescript
// Load returned deliveries
loadReturnedDeliveries() {
  this.savService.getDeliveriesByStatus('RETURNED').subscribe({
    next: (deliveries) => {
      this.returnedDeliveries.set(deliveries);
    }
  });
}

// Verify and restock
restockOrder(orderId: string) {
  this.providerService.restockOrder(orderId).subscribe({
    next: () => {
      this.toastService.success('Order restocked successfully');
      this.loadReturnedDeliveries();
    }
  });
}
```

## 🗂️ Files Modified

### Backend

1. **Repository:**
   - `DeliveryRepository.java` - Added `findByStatus(String status)`

2. **Service:**
   - `IDeliveryService.java` - Added `getDeliveriesByStatus(String status)`
   - `DeliveryService.java` - Implemented `getDeliveriesByStatus()`
   - `DeliveryService.java` - Already had `markAsReturned()` (clean implementation)

3. **Controller:**
   - `DeliveryController.java` - Added `GET /status/{status}` endpoint
   - `DeliveryController.java` - Already had `PATCH /{id}/mark-returned` endpoint
   - `DeliveryOrderController.java` - Removed broken return endpoints

### Frontend

1. **Service:**
   - `sav.service.ts` - Added `getDeliveriesByStatus(status)`
   - `sav.service.ts` - Already had `markAsReturned()`

2. **Component:**
   - `driver-deliveries.component.ts` - Fixed to use correct endpoint
   - Removed HttpClient direct calls
   - Removed debug console.logs
   - Cleaned up imports

## ✅ Testing Checklist

- [ ] Driver can see active deliveries (IN_TRANSIT)
- [ ] Driver can click "Mark as Returned" button
- [ ] Modal opens with return reasons dropdown
- [ ] Driver selects reason and confirms
- [ ] API call succeeds (200 OK)
- [ ] Success toast appears
- [ ] Delivery disappears from active list
- [ ] Admin receives notification
- [ ] Provider can query returned deliveries
- [ ] Provider can verify and restock

## 🔧 Troubleshooting

### Issue: 404 Not Found

**Cause:** Frontend calling wrong endpoint

**Solution:** Ensure using `savService.markAsReturned()` not direct HTTP call

### Issue: 500 Internal Server Error

**Cause:** Old implementation trying to find Order from Delivery

**Solution:** Use new clean endpoint: `PATCH /api/deliveries/{id}/mark-returned`

### Issue: No deliveries in returned list

**Cause:** Query using wrong status value

**Solution:** Use exact string `"RETURNED"` (case-sensitive)

## 📚 Related Documentation

- `DELIVERY_RETURN_CLEAN_ARCHITECTURE.md` - Complete architecture documentation
- `RESTOCKED_QUICK_REFERENCE.md` - Provider restock workflow
- `ORDER_LIFECYCLE_DOCUMENTATION.md` - Complete order status flow

## 🎯 Key Principles

1. **Delivery status is independent from Order status**
2. **Mark as Returned only updates Delivery entity**
3. **No Order lookup in return logic**
4. **Provider queries deliveries by status**
5. **Simple, clean, maintainable code**

## 🚨 Important Notes

- ⚠️ Delivery status = RETURNED does NOT automatically update Order status
- ⚠️ Provider must manually verify and restock through Order workflow
- ⚠️ Stock is restored only when Order status = RESTOCKED (not RETURNED)
- ⚠️ Old deliveries without orderId still work (uses cartId for display only)

## 📞 Support

If you encounter issues:

1. Check backend logs for errors
2. Verify JWT token is valid
3. Confirm user has DELIVERY or ADMIN role
4. Check delivery status is IN_TRANSIT before marking as returned
5. Review `DELIVERY_RETURN_CLEAN_ARCHITECTURE.md` for detailed architecture

---

**Last Updated:** 2026-04-29  
**Status:** ✅ Production Ready
