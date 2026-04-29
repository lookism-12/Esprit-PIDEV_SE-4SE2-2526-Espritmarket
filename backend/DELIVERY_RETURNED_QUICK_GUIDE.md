# Quick Guide: Mark as Returned Feature

## What Was Added

✅ **Driver can now mark deliveries as RETURNED when delivery fails**

---

## How It Works

### For Drivers

1. **Accept a delivery** → Order becomes IN_TRANSIT
2. **Attempt delivery** → Go to customer location
3. **If delivery fails:**
   - Click "Mark as Returned" button (red button)
   - Select reason from dropdown:
     - Customer absent
     - Customer refused package
     - Wrong address
     - Access denied
     - Customer not reachable
     - Other
   - Click "Confirm Return"
   - Return package to shop

### For Providers

1. **See returned order** in "Returned Orders" tab
2. **Receive physical package** from driver
3. **Click "Verify & Restock"**
4. **Stock restored automatically**

---

## UI Changes

### Before (Missing Feature)
```
Active Ride:
┌─────────────────────────┐
│ [Mark as Delivered]     │
└─────────────────────────┘
```

### After (Complete Feature)
```
Active Ride:
┌──────────────┬──────────────┐
│ [Mark as     │ [Mark as     │
│  Returned]   │  Delivered]  │
└──────────────┴──────────────┘
```

---

## API Endpoint

```http
PATCH /api/deliveries/{id}/mark-returned?driverId={driverId}&reason={reason}
```

**Example:**
```bash
curl -X PATCH "http://localhost:8090/api/deliveries/507f1f77bcf86cd799439011/mark-returned?driverId=507f191e810c19729de860ea&reason=Customer%20absent"
```

---

## Status Flow

```
IN_TRANSIT
    ↓
    ├─→ DELIVERED (success)
    └─→ RETURNED (failed) ← NEW
         ↓
       RESTOCKED (provider verified)
```

---

## Files Changed

### Backend (3 files)
- `IDeliveryService.java` - Added interface method
- `DeliveryService.java` - Added implementation
- `DeliveryController.java` - Added endpoint

### Frontend (3 files)
- `sav.service.ts` - Added service method
- `driver-deliveries.component.ts` - Added modal logic
- `driver-deliveries.component.html` - Added button + modal

---

## Testing

### Quick Test
1. Login as delivery driver
2. Accept a pending delivery
3. Go to "My Active Rides"
4. Click "Mark as Returned"
5. Select reason
6. Confirm
7. Verify order appears in history with RETURNED status
8. Login as provider
9. See order in "Returned Orders" tab
10. Click "Verify & Restock"
11. Verify stock is restored

---

## Status

🟢 **READY TO TEST**

All code changes complete. Backend and frontend integrated. Ready for end-to-end testing.
