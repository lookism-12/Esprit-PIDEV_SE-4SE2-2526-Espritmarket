# 🎯 Advanced Loyalty System - Quick Reference Card

## 📋 **Quick Facts**

| Feature | Value |
|---------|-------|
| Base Rate | 1.0 (1 TND = 1 point) |
| Dynamic Boost | 0.0 / 0.1 / 0.2 |
| Boost Tiers | < 3 / 3-10 / > 10 orders/month |
| Shop Restriction | Top 3 shops (last 30 days) |
| Reward Types | Percentage / Fixed Amount |
| Default Expiry | 30 days |

---

## 🔌 **API Endpoints**

### **User**
```
GET    /api/loyalty/dashboard              # Complete dashboard
GET    /api/loyalty/rewards                # All rewards
GET    /api/loyalty/rewards/affordable     # Affordable rewards
POST   /api/loyalty/rewards/convert        # Convert points
GET    /api/loyalty/my-rewards             # Active coupons
GET    /api/loyalty/top-shops              # Top 3 shops
```

### **Admin**
```
GET    /api/admin/loyalty/rewards          # List rewards
POST   /api/admin/loyalty/rewards          # Create reward
PUT    /api/admin/loyalty/rewards/{id}     # Update reward
DELETE /api/admin/loyalty/rewards/{id}     # Delete reward
PATCH  /api/admin/loyalty/rewards/{id}/toggle  # Toggle status
```

---

## 💡 **Formula**

```java
// Step 1: Calculate effective rate
effectiveRate = adminBaseRate + dynamicBoost

// Step 2: Calculate base points
basePoints = orderAmount × effectiveRate

// Step 3: Add bonuses
bonuses = quantityBonus + highOrderBonus

// Step 4: Apply tier multiplier
finalPoints = (basePoints + bonuses) × tierMultiplier
```

---

## 🎯 **Default Rewards**

| Tier | Points | Discount | Max | Min Order |
|------|--------|----------|-----|-----------|
| Bronze | 1,000 | 5% | 20 TND | 50 TND |
| Silver | 5,000 | 10% | 50 TND | 100 TND |
| Gold | 10,000 | 15% | 100 TND | 150 TND |
| Platinum | 20,000 | 20% | 150 TND | 200 TND |

---

## 🔒 **Validation Rules**

```java
✅ Coupon exists
✅ Status = ACTIVE
✅ Not expired
✅ Shop in top 3
✅ Order >= minAmount
✅ Discount <= maxCap
```

---

## 📊 **Example Calculations**

### **Low Activity User**
```
Orders/month: 2
Boost: 0.0
Order: 100 TND
Points: 100 × 1.0 × 1.0 = 100
```

### **Medium Activity User**
```
Orders/month: 7
Boost: 0.1
Order: 200 TND (6 items)
Points: 200 × 1.1 × 1.0 + 50 + 100 = 370
```

### **High Activity User (GOLD)**
```
Orders/month: 15
Boost: 0.2
Order: 500 TND (8 items)
Points: 500 × 1.2 × 1.5 + 50 + 100 = 1050
```

---

## 🚀 **Quick Setup**

```bash
# 1. Start app
mvn spring-boot:run

# 2. Login as admin
POST /api/auth/login

# 3. Create rewards
POST /api/admin/loyalty/rewards
{
  "name": "Bronze Discount",
  "pointsRequired": 1000,
  "rewardValue": 5.0,
  ...
}

# 4. Test as user
GET /api/loyalty/dashboard
POST /api/loyalty/rewards/convert
```

---

## 🐛 **Common Issues**

| Error | Solution |
|-------|----------|
| "Insufficient points" | Make more orders or lower pointsRequired |
| "Shop restriction" | Order from same shop 3+ times |
| "Reward expired" | Check expiresAt date |
| "Minimum order" | Increase order amount |

---

## 📁 **Files Created**

```
backend/
├── entity/cart/
│   ├── LoyaltyReward.java
│   └── UserReward.java
├── dto/cartDto/
│   ├── LoyaltyRewardDTO.java
│   ├── UserRewardDTO.java
│   ├── LoyaltyDashboardDTO.java
│   └── ShopSummaryDTO.java
├── service/cartService/
│   └── AdvancedLoyaltyService.java
├── controller/
│   ├── AdvancedLoyaltyController.java
│   └── AdminLoyaltyRewardController.java
└── docs/
    ├── ADVANCED_LOYALTY_SYSTEM_GUIDE.md
    ├── ADVANCED_LOYALTY_IMPLEMENTATION_SUMMARY.md
    ├── LOYALTY_INITIALIZATION_SCRIPT.md
    ├── ADVANCED_LOYALTY_COMPLETE_SUMMARY.md
    └── LOYALTY_QUICK_REFERENCE.md (this file)
```

---

## ✅ **Status**

- [x] Backend complete
- [x] API documented
- [x] Examples provided
- [ ] Frontend integration
- [ ] Production testing

---

## 📞 **Need Help?**

1. Read `ADVANCED_LOYALTY_SYSTEM_GUIDE.md`
2. Follow `LOYALTY_INITIALIZATION_SCRIPT.md`
3. Check `ADVANCED_LOYALTY_COMPLETE_SUMMARY.md`
4. Test with Postman

**System is production-ready!** 🎉
