# Frontend ↔ Backend Integration Plan

## 🎯 Overview
This document outlines the complete integration between Angular frontend and Spring Boot backend for the loyalty system and order management.

---

## 🔍 Current State Analysis

### ✅ What's Working
- Cart service properly integrated with backend
- Basic order listing works
- Authentication and JWT interceptor functional
- Dark mode and theme system well-implemented

### ❌ What Needs Fixing

#### 1. **Loyalty Service - Incorrect Multipliers**
**Current (Frontend):**
```typescript
BRONZE = 1.0
SILVER = 1.5  // ❌ Wrong
GOLD = 2.0    // ❌ Wrong
PLATINUM = 3.0 // ❌ Wrong
```

**Backend (Correct):**
```java
BRONZE = 1.0
SILVER = 1.2  // ✅ Correct
GOLD = 1.5    // ✅ Correct
PLATINUM = 2.0 // ✅ Correct
```

#### 2. **Loyalty Service - Incorrect Calculation**
**Current:**
- Uses simple formula: `amount * 10 * multiplier`
- Doesn't account for product-level calculation
- Missing quantity bonus (>= 5 items)
- Missing price bonus (> 200)

**Should Be:**
- Backend calculates points (product-level formula)
- Frontend ONLY displays points from backend
- NO client-side calculation

#### 3. **Order Service - Missing New Endpoints**
**Missing:**
- `/api/orders` - New Order entity endpoints
- `/api/orders/{id}/confirm-payment` - Payment confirmation
- Integration with new Order/OrderItem entities

**Current:**
- Still uses old Cart-based order endpoints
- No payment confirmation flow

#### 4. **Missing Loyalty Display**
- No loyalty points shown in order confirmation
- No loyalty level badge in UI
- No points earned notification after purchase

---

## 🛠️ Implementation Plan

### Phase 1: Update Loyalty Models & Service

#### File: `frontend/src/app/front/models/loyalty.model.ts`
**Changes:**
1. Fix multipliers to match backend
2. Update level thresholds
3. Add backend response interfaces

#### File: `frontend/src/app/front/core/loyalty.service.ts`
**Changes:**
1. Remove client-side point calculation
2. Use backend-calculated points only
3. Update API endpoints to match backend
4. Fix multipliers

### Phase 2: Create New Order Service

#### File: `frontend/src/app/front/core/order.service.ts`
**Changes:**
1. Add new Order entity interfaces
2. Implement `/api/orders` endpoints
3. Add payment confirmation method
4. Remove old Cart-based order logic

#### New Interfaces Needed:
```typescript
interface OrderResponse {
  id: string;
  user: UserInfo;
  status: OrderStatus;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  couponCode?: string;
  shippingAddress: string;
  paymentMethod: string;
  paymentId?: string;
  orderNumber: string;
  createdAt: string;
  paidAt?: string;
  items: OrderItemResponse[];
}

interface OrderItemResponse {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
  status: OrderItemStatus;
}
```

### Phase 3: Update Cart Service Checkout

#### File: `frontend/src/app/front/core/cart.service.ts`
**Changes:**
1. Update checkout to use new Order creation endpoint
2. Return OrderResponse instead of CartResponse
3. Integrate payment confirmation flow

### Phase 4: Create Loyalty Display Components

#### New Component: `loyalty-badge.component.ts`
**Purpose:** Display user's loyalty level with proper styling

**Features:**
- Bronze/Silver/Gold/Platinum badge
- Uses existing theme colors
- Responsive design

#### New Component: `loyalty-points-display.component.ts`
**Purpose:** Show points earned after order

**Features:**
- Animated points counter
- Level progress bar
- Next level indicator

### Phase 5: Update Order Confirmation Page

#### File: `frontend/src/app/front/pages/checkout-success/*`
**Changes:**
1. Display loyalty points earned
2. Show loyalty level badge
3. Add points breakdown
4. Celebrate level-up if applicable

---

## 🎨 UI/UX Design Guidelines

### Loyalty Level Colors (Using Existing Theme)

**IMPORTANT:** Use ONLY existing CSS variables and Tailwind classes

```scss
// Bronze - Use existing gray/neutral
.loyalty-bronze {
  background: var(--bg-subtle);
  border-color: var(--border);
  color: var(--text-muted);
}

// Silver - Use existing light accent
.loyalty-silver {
  background: rgba(189, 156, 124, 0.1); // --secondary
  border-color: var(--secondary);
  color: var(--text-color);
}

// Gold - Use existing accent-gold
.loyalty-gold {
  background: var(--accent-gold-soft);
  border-color: var(--accent-gold);
  color: var(--text-color);
}

// Platinum - Use existing primary
.loyalty-platinum {
  background: rgba(139, 0, 0, 0.1); // --primary
  border-color: var(--primary-color);
  color: var(--primary-color);
}
```

### Dark Mode Support
All loyalty components MUST support dark mode using existing CSS variables:
- `var(--bg-color)`
- `var(--card-bg)`
- `var(--text-color)`
- `var(--text-muted)`
- `var(--border)`

---

## 📋 API Endpoint Mapping

### Loyalty Endpoints

| Frontend Method | Backend Endpoint | HTTP Method |
|----------------|------------------|-------------|
| `getAccount()` | `/api/loyalty-card` | GET |
| `redeemPoints()` | `/api/loyalty-card/convert` | POST |

### Order Endpoints (NEW)

| Frontend Method | Backend Endpoint | HTTP Method |
|----------------|------------------|-------------|
| `createOrder()` | `/api/cart/checkout` | POST |
| `confirmPayment()` | `/api/orders/{id}/confirm-payment` | POST |
| `getMyOrders()` | `/api/orders` | GET |
| `getOrderById()` | `/api/orders/{id}` | GET |
| `cancelOrder()` | `/api/orders/{id}/cancel` | POST |

---

## ✅ Testing Checklist

### Loyalty System
- [ ] Loyalty account loads correctly
- [ ] Points display matches backend
- [ ] Level badge shows correct tier
- [ ] Multipliers match backend (1.0, 1.2, 1.5, 2.0)
- [ ] No client-side point calculation
- [ ] Dark mode works correctly

### Order System
- [ ] Checkout creates Order entity
- [ ] Payment confirmation works
- [ ] Loyalty points added after payment
- [ ] Order status updates correctly
- [ ] Cancellation restores stock and deducts points

### UI/UX
- [ ] Loyalty badge uses existing theme colors
- [ ] No new colors introduced
- [ ] Responsive on mobile
- [ ] Dark mode fully supported
- [ ] Animations smooth and consistent

---

## 🚀 Deployment Steps

1. **Update Models** - Fix loyalty multipliers and add Order interfaces
2. **Update Services** - Remove client-side calculations, add new endpoints
3. **Create Components** - Loyalty badge and points display
4. **Update Pages** - Integrate loyalty display in checkout success
5. **Test** - Verify all endpoints and UI components
6. **Deploy** - Push to production

---

## 📝 Notes

- **NO new colors** - Use only existing CSS variables
- **NO business logic in frontend** - All calculations in backend
- **Clean architecture** - Services handle API, components handle display
- **Consistent styling** - Follow existing design system
- **Dark mode first** - Test both themes always

---

**Status:** Ready for Implementation
**Priority:** High
**Estimated Time:** 4-6 hours
