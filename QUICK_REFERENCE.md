# Quick Reference Guide - Loyalty System Integration

## 🎯 At a Glance

### Backend Formula
```
points = sum(price × qty × 0.1) × multiplier + bonuses
```

### Multipliers
- BRONZE: 1.0x
- SILVER: 1.2x
- GOLD: 1.5x
- PLATINUM: 2.0x

### Bonuses
- Quantity: >= 5 items → +10%
- Price: > 200 → +20 points

---

## 🔧 Quick Commands

### Backend
```bash
# Compile
./mvnw clean compile

# Run tests
./mvnw test

# Run application
./mvnw spring-boot:run
```

### Frontend
```bash
# Install dependencies
npm install

# Run dev server
ng serve

# Run tests
ng test

# Build for production
ng build --configuration production
```

---

## 📁 Key Files

### Backend
```
backend/src/main/java/esprit_market/
├── service/cartService/
│   ├── LoyaltyCardServiceImpl.java    ✅ UPDATED
│   ├── OrderServiceImpl.java          ✅ UPDATED
│   └── ILoyaltyCardService.java       ✅ UPDATED
├── controller/providerController/
│   ├── ProviderDashboardController.java  ✅ FIXED
│   └── ProviderOrderController.java      ✅ EXISTS
└── entity/cart/
    ├── Order.java                     ✅ NEW
    ├── OrderItem.java                 ✅ NEW
    └── LoyaltyCard.java               ✅ EXISTS
```

### Frontend
```
frontend/src/app/front/
├── models/
│   └── loyalty.model.ts               ✅ UPDATED
├── core/
│   ├── loyalty.service.ts             ✅ UPDATED
│   └── order.service.ts               ⏳ TODO
└── shared/components/
    ├── loyalty-badge/                 ✅ NEW
    │   └── loyalty-badge.component.ts
    └── loyalty-points-display/        ✅ NEW
        └── loyalty-points-display.component.ts
```

---

## 🎨 Component Usage

### Loyalty Badge
```html
<app-loyalty-badge 
  [level]="LoyaltyLevel.GOLD" 
  [size]="'md'" 
/>
```

### Loyalty Points Display
```html
<app-loyalty-points-display
  [pointsEarned]="49"
  [totalPoints]="1234"
  [currentLevel]="LoyaltyLevel.SILVER"
  [leveledUp]="false"
/>
```

---

## 🔗 API Endpoints

### Loyalty
```
GET  /api/loyalty-card           - Get account
POST /api/loyalty-card/convert   - Redeem points
```

### Orders
```
POST /api/cart/checkout                  - Create order
POST /api/orders/{id}/confirm-payment    - Confirm payment
GET  /api/orders                         - List orders
GET  /api/orders/{id}                    - Get order
POST /api/orders/{id}/cancel             - Cancel order
```

### Provider
```
GET /api/provider/dashboard/orders       - List orders
GET /api/provider/dashboard/statistics   - Analytics
PUT /api/provider/orders/{id}/status     - Update status
```

---

## 🎨 Theme Colors (Existing Only)

```scss
// Primary
--primary-color: #8B0000
--primary-dark: #6b0000

// Accent
--accent-gold: #E0B84A
--accent-gold-soft: rgba(224, 184, 74, 0.3)

// Backgrounds
--bg-color: #FFF9F2 (light) / #1a1816 (dark)
--bg-subtle: #FFDDBB (light) / #24201d (dark)
--card-bg: #ffffff (light) / #2d2825 (dark)

// Text
--text-color: #111827 (light) / #FFF9F2 (dark)
--text-muted: #5c4e40 (light) / #a89f91 (dark)

// Borders
--border: #BD9C7C (light) / rgba(189, 156, 124, 0.4) (dark)
```

---

## ✅ Testing Checklist

### Backend
- [ ] Points calculated correctly
- [ ] Multipliers match (1.0, 1.2, 1.5, 2.0)
- [ ] Quantity bonus works (>= 5 items)
- [ ] Price bonus works (> 200)
- [ ] Points added after payment
- [ ] Points deducted on cancellation

### Frontend
- [ ] Loyalty badge displays correctly
- [ ] Points display shows accurate info
- [ ] Dark mode works
- [ ] Responsive on mobile
- [ ] No console errors

---

## 🚨 Common Issues

### Backend
**Issue**: Points not added after payment
**Fix**: Ensure `confirmPayment()` is called, not just status update

**Issue**: Wrong multiplier
**Fix**: Check `LOYALTY_LEVELS` constants match backend

### Frontend
**Issue**: Badge colors wrong in dark mode
**Fix**: Verify `.dark` class is applied to `<html>` element

**Issue**: Points calculation mismatch
**Fix**: Frontend should ONLY display backend-calculated points

---

## 📞 Support

### Documentation
- `LOYALTY_SYSTEM_IMPLEMENTATION.md` - Backend details
- `FRONTEND_INTEGRATION_COMPLETE.md` - Frontend details
- `IMPLEMENTATION_SUMMARY.md` - Complete overview

### Logs
```bash
# Backend logs
tail -f logs/application.log

# Frontend console
Open browser DevTools → Console
```

---

**Last Updated**: April 11, 2026
**Version**: 1.0.0
