# 🚨 CRITICAL FIXES - ACTION ITEMS (Quick Reference)

## Priority 1: FIX PORT MISMATCH (5 MINUTES) 🔴

**File:** `frontend/src/environment.ts`

**Change:**
```typescript
// BEFORE (WRONG)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8090/api'  // ← WRONG PORT
};

// AFTER (CORRECT)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8089/api'  // ← CORRECT PORT
};
```

**Verify:**
```bash
curl http://localhost:8089/api/products
```

---

## Priority 2: FIX CART SERVICE (2 HOURS) 🔴

**File:** `frontend/src/app/front/core/cart.service.ts`

**What to do:** Replace all TODO methods with actual HTTP calls

```typescript
// BEFORE (BROKEN)
getCart(): Observable<Cart> {
  return of({} as Cart);  // Returns empty object
}

// AFTER (FIXED)
getCart(): Observable<Cart> {
  return this.http.get<Cart>(`${this.apiUrl}`);
}
```

**All methods to fix:**
- `getCart()` → GET `/api/cart`
- `addItem()` → POST `/api/cart/items`
- `removeItem()` → DELETE `/api/cart/items/{id}`
- `updateQuantity()` → PUT `/api/cart/items/{id}`
- `clearCart()` → DELETE `/api/cart/clear`
- `applyCoupon()` → POST `/api/cart/coupon`
- `removeCoupon()` → DELETE `/api/cart/coupon`

---

## Priority 3: IMPLEMENT ORDER SERVICE (2 HOURS) 🔴

**File:** `frontend/src/app/front/core/order.service.ts`

**Current Status:** All methods return mock data

**What to do:** Implement HTTP calls or create backend endpoint

### Option A: Backend Endpoint (Recommended)

**Create:** `backend/src/main/java/esprit_market/controller/cartController/OrderController.java`

```java
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<OrderResponse> createOrder(
            @Valid @RequestBody CheckoutRequest request,
            Authentication authentication) {
        // Convert cart to order, save, return order
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable String orderId) {
        // Get order by ID
    }

    @GetMapping
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<Page<OrderResponse>> getMyOrders(
            Pageable pageable,
            Authentication authentication) {
        // Get user's orders
    }
}
```

### Option B: Frontend HTTP Calls (If Backend Endpoint Exists)

```typescript
createOrder(data: CreateOrderRequest): Observable<Order> {
  return this.http.post<Order>(this.apiUrl, data);
}

getOrder(orderId: string): Observable<Order> {
  return this.http.get<Order>(`${this.apiUrl}/${orderId}`);
}

getMyOrders(page: number = 0, limit: number = 10): Observable<OrderListResponse> {
  return this.http.get<OrderListResponse>(this.apiUrl, {
    params: new HttpParams()
      .set('page', page)
      .set('limit', limit)
  });
}
```

---

## Priority 4: IMPLEMENT PAYMENT SERVICE (3 HOURS) 🔴

**File:** `frontend/src/app/front/core/payment.service.ts`

**Create:** `backend/src/main/java/esprit_market/controller/cartController/PaymentController.java`

```java
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLIENT')")
public class PaymentController {

    @PostMapping
    public ResponseEntity<PaymentResponse> createPayment(
            @Valid @RequestBody PaymentRequest request,
            Authentication authentication) {
        // Process payment via Stripe/PayPal
        // Return payment response with status
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentResponse> getPayment(@PathVariable String paymentId) {
        // Get payment details
    }

    @PostMapping("/{paymentId}/confirm")
    public ResponseEntity<PaymentResponse> confirmPayment(@PathVariable String paymentId) {
        // Confirm payment after 3D Secure
    }
}
```

**Frontend Implementation:**
```typescript
processPayment(request: PaymentRequest): Observable<PaymentResponse> {
  return this.http.post<PaymentResponse>(`${this.apiUrl}`, request);
}

getPaymentStatus(paymentId: string): Observable<PaymentResponse> {
  return this.http.get<PaymentResponse>(`${this.apiUrl}/${paymentId}`);
}

confirmPayment(paymentId: string): Observable<PaymentResponse> {
  return this.http.post<PaymentResponse>(`${this.apiUrl}/${paymentId}/confirm`, {});
}
```

---

## Priority 5: IMPLEMENT UPLOAD SERVICE (2 HOURS) 🔴

**File:** Create `frontend/src/app/front/core/upload.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private readonly apiUrl = `${environment.apiUrl}/uploads`;
  private http = inject(HttpClient);

  /**
   * Upload file (avatar, product image, etc)
   */
  uploadFile(file: File, type: 'avatar' | 'product' | 'document'): Observable<{ url: string; fileId: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.http.post<{ url: string; fileId: string }>(`${this.apiUrl}`, formData);
  }

  /**
   * Delete uploaded file
   */
  deleteFile(fileId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${fileId}`);
  }

  /**
   * Get file
   */
  getFile(fileId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${fileId}`, { responseType: 'blob' });
  }
}
```

**Backend:** `backend/src/main/java/esprit_market/controller/fileController/UploadController.java`

```java
@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class UploadController {

    private final FileStorageService fileStorageService;

    @PostMapping
    public ResponseEntity<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", defaultValue = "avatar") String type) {
        
        String fileName = fileStorageService.storeFile(file, type);
        
        return ResponseEntity.ok(Map.of(
            "fileId", fileName,
            "url", "/uploads/" + type + "/" + fileName
        ));
    }

    @DeleteMapping("/{fileId}")
    public ResponseEntity<Void> deleteFile(@PathVariable String fileId) {
        fileStorageService.deleteFile(fileId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{fileId}")
    public ResponseEntity<Resource> getFile(@PathVariable String fileId) {
        Resource resource = fileStorageService.loadFileAsResource(fileId);
        return ResponseEntity.ok().body(resource);
    }
}
```

---

## Priority 6: FIX COUPON SERVICE (1 HOUR) 🟠

**File:** `frontend/src/app/front/core/coupon.service.ts`

**Backend endpoint exists:** `POST /api/cart/coupon`, `GET /api/coupons`

Replace all mock data methods with HTTP calls:

```typescript
// Apply coupon
applyCoupon(couponCode: string): Observable<CartResponse> {
  return this.http.post<CartResponse>(`${this.apiUrl}/coupon`, { code: couponCode });
}

// Get available coupons
getAvailableCoupons(): Observable<Coupon[]> {
  return this.http.get<Coupon[]>(`${this.baseUrl}/coupons`);
}

// Validate coupon
validateCoupon(code: string): Observable<{ valid: boolean; discount: number }> {
  return this.http.post<{ valid: boolean; discount: number }>(`${this.baseUrl}/coupons/validate`, { code });
}
```

---

## Priority 7: FIX LOYALTY SERVICE (1 HOUR) 🟠

**File:** `frontend/src/app/front/core/loyalty.service.ts`

**Backend endpoint exists:** `GET /api/loyalty-cards`, `POST /api/loyalty-cards`

```typescript
// Get loyalty card
getLoyaltyCard(): Observable<LoyaltyCard> {
  return this.http.get<LoyaltyCard>(`${this.apiUrl}`);
}

// Add loyalty points
addPoints(points: number): Observable<LoyaltyCard> {
  return this.http.post<LoyaltyCard>(`${this.apiUrl}/points`, { points });
}

// Redeem points
redeemPoints(points: number): Observable<LoyaltyCard> {
  return this.http.post<LoyaltyCard>(`${this.apiUrl}/redeem`, { points });
}

// Convert points to discount
convertPointsToDiscount(points: number): Observable<Discount> {
  return this.http.post<Discount>(`${this.apiUrl}/convert`, { points });
}
```

---

## Priority 8: HOOK NOTIFICATION SERVICE (1 HOUR) 🟠

**File:** `frontend/src/app/front/core/notification.service.ts`

**Current Issue:** Service has HTTP calls but UI components don't use it

**What to do:**
1. Implement real-time notifications using WebSocket or polling
2. Hook notification service to UI components
3. Display toast/badge notifications

```typescript
// Subscribe to notifications
subscribeToNotifications(): Observable<Notification> {
  return this.http.get<Notification[]>(`${this.apiUrl}`)
    .pipe(
      switchMap(notifications => {
        // Emit new notifications
        return from(notifications);
      })
    );
}

// Mark as read
markAsRead(notificationId: string): Observable<void> {
  return this.http.put<void>(`${this.apiUrl}/${notificationId}/read`, {});
}

// Delete notification
deleteNotification(notificationId: string): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/${notificationId}`);
}
```

---

## Priority 9: FIX FORUM SERVICE (2 HOURS) 🟠

**File:** `frontend/src/app/front/core/forum.service.ts`

**Backend endpoints exist:** `/api/posts`, `/api/comments`, `/api/replies`

Replace mock data with HTTP calls for:
- `getPosts()`
- `createPost()`
- `getComments()`
- `addComment()`
- `addReply()`
- `addReaction()`

---

## Priority 10: TEST INTEGRATION (2 HOURS) 🟡

**Test Flow:**

```bash
# 1. Test authentication
curl -X POST http://localhost:8089/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password"}'

# 2. Test product retrieval
curl http://localhost:8089/api/products

# 3. Test cart operations
curl -X POST http://localhost:8089/api/cart/items \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":"123","quantity":1}'

# 4. Test checkout
curl -X POST http://localhost:8089/api/orders \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":"123","quantity":1}]}'

# 5. Test payment
curl -X POST http://localhost:8089/api/payments \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"order123","amount":100,"method":"credit_card"}'
```

---

## Testing Checklist

```bash
# 1. Frontend App
cd frontend
npm install
npm run build
npm run test

# 2. Backend App
cd backend
./mvnw clean compile
./mvnw test
./mvnw package

# 3. Docker Images (after all fixes)
docker build -t esprit-market-frontend:latest ./frontend
docker build -t esprit-market-backend:latest ./backend

# 4. Local Kubernetes (minikube)
minikube start
kubectl apply -f infra/k8s/
kubectl get pods
```

---

## IMPLEMENTATION ORDER

| # | Task | Time | Status |
|---|------|------|--------|
| 1 | Fix port mismatch | 5 min | 🔴 CRITICAL |
| 2 | Implement Cart Service | 2 hrs | 🔴 CRITICAL |
| 3 | Create Order Service | 2 hrs | 🔴 CRITICAL |
| 4 | Implement Payment Service | 3 hrs | 🔴 CRITICAL |
| 5 | Create Upload Service | 2 hrs | 🔴 CRITICAL |
| 6 | Fix Coupon Service | 1 hr | 🟠 HIGH |
| 7 | Fix Loyalty Service | 1 hr | 🟠 HIGH |
| 8 | Hook Notifications | 1 hr | 🟠 HIGH |
| 9 | Fix Forum Service | 2 hrs | 🟠 HIGH |
| 10 | Integration Testing | 2 hrs | 🟡 MEDIUM |
| **TOTAL** | | **~17 hours** | |

---

## COMMAND REFERENCE

```bash
# Frontend
npm install                    # Install dependencies
npm run build                  # Build for production
npm run test                   # Run tests
npm start                      # Dev server (port 4200)

# Backend
./mvnw clean install           # Compile and test
./mvnw spring-boot:run         # Run locally (port 8089)
./mvnw package                 # Create JAR

# Docker
docker build -t image:tag .    # Build image
docker push image:tag          # Push to registry
docker run -p 8089:8089 image  # Run container

# Kubernetes
kubectl apply -f file.yaml     # Deploy
kubectl get pods               # List pods
kubectl logs pod-name          # View logs
kubectl delete deployment name # Delete
```

---

## SUCCESS CRITERIA

After implementing all fixes:

✅ Frontend loads on `localhost:4200`  
✅ Login works and redirects by role  
✅ Cart can add/remove items (persisted in DB)  
✅ Checkout creates order in DB  
✅ Payment processing works  
✅ File uploads work  
✅ Coupons can be applied  
✅ Loyalty points are tracked  
✅ Notifications display in real-time  
✅ Forum features fully functional  
✅ All API calls use proper HTTP methods  
✅ Error handling and loading states work  
✅ Mobile responsiveness maintained  

---

**Estimated Total Implementation Time:** 17 hours (1 developer, 2 days)

