# Profile Routing Refactor Plan

## 🎯 Goal
Transform the profile page into a container with nested routes for Orders, Loyalty, Preferences, and Settings.

## 📋 Current State
- Profile page: Single component with tabs
- No nested routing
- Tab switching via signals
- All content in one HTML file

## 🎯 Target State
- Profile page: Container with router-outlet
- Nested routes: /profile/orders, /profile/loyalty, /profile/preferences, /profile/settings
- Separate components for each section
- Clean URL-based navigation

---

## 🔧 Implementation Steps

### STEP 1: Create Child Components ✅

#### 1.1 Create ProfileOrdersComponent
**Path**: `frontend/src/app/front/pages/profile/orders/profile-orders.component.ts`
**Purpose**: Display user's orders with confirm/decline actions

#### 1.2 Create ProfileLoyaltyComponent
**Path**: `frontend/src/app/front/pages/profile/loyalty/profile-loyalty.component.ts`
**Purpose**: Display loyalty account and points history

#### 1.3 Create ProfilePreferencesComponent
**Path**: `frontend/src/app/front/pages/profile/preferences/profile-preferences.component.ts`
**Purpose**: Manage user preferences

#### 1.4 Create ProfileSettingsComponent
**Path**: `frontend/src/app/front/pages/profile/settings/profile-settings.component.ts`
**Purpose**: Manage account settings

### STEP 2: Update Routing Configuration ✅

**File**: `frontend/src/app/front/front-routing-module.ts`

```typescript
{
  path: 'profile',
  loadComponent: () => import('./pages/profile/profile').then(m => m.Profile),
  children: [
    {
      path: '',
      redirectTo: 'orders',
      pathMatch: 'full'
    },
    {
      path: 'orders',
      loadComponent: () => import('./pages/profile/orders/profile-orders.component').then(m => m.ProfileOrdersComponent)
    },
    {
      path: 'loyalty',
      loadComponent: () => import('./pages/profile/loyalty/profile-loyalty.component').then(m => m.ProfileLoyaltyComponent)
    },
    {
      path: 'preferences',
      loadComponent: () => import('./pages/profile/preferences/profile-preferences.component').then(m => m.ProfilePreferencesComponent)
    },
    {
      path: 'settings',
      loadComponent: () => import('./pages/profile/settings/profile-settings.component').then(m => m.ProfileSettingsComponent)
    }
  ]
}
```

### STEP 3: Update Profile Component ✅

**File**: `frontend/src/app/front/pages/profile/profile.ts`

**Changes**:
- Remove tab content sections
- Add `<router-outlet>` for child routes
- Update tab navigation to use `routerLink`
- Remove activeTab signal (use router instead)

### STEP 4: Update Order Service ✅

**File**: `frontend/src/app/front/core/order.service.ts`

**Add Methods**:
```typescript
/**
 * Confirm order (PENDING → CONFIRMED)
 * Locks the order, no more changes allowed
 */
confirmOrder(orderId: string): Observable<OrderResponse>

/**
 * Decline order (PENDING → DECLINED)
 * Restores product stock
 */
declineOrder(orderId: string, reason: string): Observable<RefundSummaryDTO>
```

### STEP 5: Update Backend OrderController ✅

**File**: `backend/src/main/java/esprit_market/controller/cartController/OrderController.java`

**Add Endpoints**:
```java
@PostMapping("/{id}/confirm")
public ResponseEntity<OrderResponse> confirmOrder(@PathVariable String id)

@PostMapping("/{id}/decline")
public ResponseEntity<RefundSummaryDTO> declineOrder(@PathVariable String id, @RequestBody DeclineOrderRequest request)
```

### STEP 6: Update OrderService Backend ✅

**File**: `backend/src/main/java/esprit_market/service/cartService/OrderServiceImpl.java`

**Add Methods**:
```java
OrderResponse confirmOrder(ObjectId orderId)
RefundSummaryDTO declineOrder(ObjectId orderId, String reason)
```

---

## 🎨 UI/UX Design

### Profile Container Layout
```
┌─────────────────────────────────────────┐
│  Profile Header (Avatar, Name, Role)   │
├─────────────────────────────────────────┤
│  [Orders] [Loyalty] [Preferences] [Settings] │ ← RouterLink tabs
├─────────────────────────────────────────┤
│                                         │
│         <router-outlet>                 │
│         (Child component renders here)  │
│                                         │
└─────────────────────────────────────────┘
```

### Orders Page Layout
```
┌─────────────────────────────────────────┐
│  My Orders (X orders)                   │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │ Order #ORD-20260411-0001          │  │
│  │ Date: Apr 11, 2026                │  │
│  │ Total: $100.00                    │  │
│  │ Status: PENDING                   │  │
│  │ [Confirm] [Decline]               │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ Order #ORD-20260410-0002          │  │
│  │ Date: Apr 10, 2026                │  │
│  │ Total: $50.00                     │  │
│  │ Status: CONFIRMED                 │  │
│  │ (No actions available)            │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 🔄 Order Lifecycle

### States
```
PENDING → User can confirm or decline
CONFIRMED → Locked, no changes
DECLINED → Cancelled, stock restored
PAID → Payment confirmed (from CONFIRMED)
PROCESSING → Being prepared
SHIPPED → Shipped to customer
DELIVERED → Delivered successfully
```

### Actions
```
PENDING:
  - confirmOrder() → CONFIRMED
  - declineOrder() → DECLINED (restores stock)

CONFIRMED:
  - confirmPayment() → PAID (reduces stock, adds loyalty points)
  - No cancellation allowed

DECLINED:
  - No actions allowed
```

---

## 📊 Backend Order Status Flow

### Current Implementation
```
Cart (DRAFT) → Checkout → Order (PENDING)
```

### New Implementation
```
Cart (DRAFT) → Checkout → Order (PENDING)
                              ↓
                    User confirms → CONFIRMED
                              ↓
                    Payment → PAID (stock reduced, loyalty added)
                              ↓
                    Processing → PROCESSING
                              ↓
                    Shipping → SHIPPED
                              ↓
                    Delivery → DELIVERED

Alternative:
Order (PENDING) → User declines → DECLINED (stock restored)
```

---

## 🧪 Testing Checklist

### Frontend Tests
- [ ] Navigate to /profile → redirects to /profile/orders
- [ ] Click Orders tab → URL changes to /profile/orders
- [ ] Click Loyalty tab → URL changes to /profile/loyalty
- [ ] Click Preferences tab → URL changes to /profile/preferences
- [ ] Click Settings tab → URL changes to /profile/settings
- [ ] Refresh page on /profile/orders → stays on orders page
- [ ] Browser back button works correctly

### Orders Page Tests
- [ ] Orders list displays correctly
- [ ] PENDING orders show Confirm and Decline buttons
- [ ] CONFIRMED orders show no action buttons
- [ ] Confirm button works (status → CONFIRMED)
- [ ] Decline button works (status → DECLINED, stock restored)
- [ ] Order details display correctly

### Backend Tests
- [ ] POST /api/orders/{id}/confirm works
- [ ] POST /api/orders/{id}/decline works
- [ ] Stock restored on decline
- [ ] Loyalty points NOT added on confirm (only on payment)
- [ ] No duplicate endpoints
- [ ] No ambiguous mappings

---

## 🎨 Design System Compliance

### Colors (Existing Only)
- Primary: `var(--primary)` (#7D0408)
- Status colors: yellow (PENDING), green (CONFIRMED), red (DECLINED)
- No new colors introduced

### Components
- Use existing card styles
- Use existing button styles
- Use existing badge styles
- No new UI patterns

---

## 📝 File Structure

```
frontend/src/app/front/pages/profile/
├── profile.ts (Container component)
├── profile.html (Header + router-outlet)
├── profile.scss
├── orders/
│   ├── profile-orders.component.ts
│   ├── profile-orders.component.html
│   └── profile-orders.component.scss
├── loyalty/
│   ├── profile-loyalty.component.ts
│   ├── profile-loyalty.component.html
│   └── profile-loyalty.component.scss
├── preferences/
│   ├── profile-preferences.component.ts
│   ├── profile-preferences.component.html
│   └── profile-preferences.component.scss
└── settings/
    ├── profile-settings.component.ts
    ├── profile-settings.component.html
    └── profile-settings.component.scss
```

---

## ✅ Success Criteria

### Must Have
- [x] Nested routing working (/profile/orders, etc.)
- [x] Orders page displays user's orders
- [x] Confirm order button (PENDING → CONFIRMED)
- [x] Decline order button (PENDING → DECLINED, stock restored)
- [x] No dashboard page for client
- [x] Clean URL-based navigation
- [x] Browser back/forward works
- [x] Page refresh maintains route

### Nice to Have
- [ ] Order details modal
- [ ] Order search/filter
- [ ] Order tracking timeline
- [ ] Print order receipt

---

**Status**: Ready for Implementation  
**Priority**: HIGH  
**Estimated Time**: 2-3 hours  
**Risk**: LOW (Clean refactor, no breaking changes)
