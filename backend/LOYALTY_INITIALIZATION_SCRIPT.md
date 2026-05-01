# 🚀 Loyalty System Initialization Script

## Quick Setup Guide

### **Step 1: Start the Application**
```bash
cd backend
mvn spring-boot:run
```

### **Step 2: Login as Admin**
```bash
POST http://localhost:8090/api/auth/login
Content-Type: application/json

{
  "email": "admin@espritmarket.com",
  "password": "admin123"
}

# Save the token from response
```

### **Step 3: Create Default Rewards**

#### **Bronze Tier (1000 points = 5% off)**
```bash
POST http://localhost:8090/api/admin/loyalty/rewards
Authorization: Bearer {YOUR_ADMIN_TOKEN}
Content-Type: application/json

{
  "name": "Bronze Discount",
  "description": "Get 5% off your next order! Perfect for regular shoppers.",
  "pointsRequired": 1000,
  "rewardType": "PERCENTAGE_DISCOUNT",
  "rewardValue": 5.0,
  "maxDiscountAmount": 20.0,
  "minOrderAmount": 50.0,
  "validityDays": 30,
  "active": true,
  "displayOrder": 1
}
```

#### **Silver Tier (5000 points = 10% off)**
```bash
POST http://localhost:8090/api/admin/loyalty/rewards
Authorization: Bearer {YOUR_ADMIN_TOKEN}
Content-Type: application/json

{
  "name": "Silver Discount",
  "description": "Enjoy 10% off your next order! For our valued customers.",
  "pointsRequired": 5000,
  "rewardType": "PERCENTAGE_DISCOUNT",
  "rewardValue": 10.0,
  "maxDiscountAmount": 50.0,
  "minOrderAmount": 100.0,
  "validityDays": 30,
  "active": true,
  "displayOrder": 2
}
```

#### **Gold Tier (10000 points = 15% off)**
```bash
POST http://localhost:8090/api/admin/loyalty/rewards
Authorization: Bearer {YOUR_ADMIN_TOKEN}
Content-Type: application/json

{
  "name": "Gold Discount",
  "description": "Premium 15% off your next order! For our VIP customers.",
  "pointsRequired": 10000,
  "rewardType": "PERCENTAGE_DISCOUNT",
  "rewardValue": 15.0,
  "maxDiscountAmount": 100.0,
  "minOrderAmount": 150.0,
  "validityDays": 30,
  "active": true,
  "displayOrder": 3
}
```

#### **Platinum Tier (20000 points = 20% off)**
```bash
POST http://localhost:8090/api/admin/loyalty/rewards
Authorization: Bearer {YOUR_ADMIN_TOKEN}
Content-Type: application/json

{
  "name": "Platinum Discount",
  "description": "Exclusive 20% off your next order! For our elite customers.",
  "pointsRequired": 20000,
  "rewardType": "PERCENTAGE_DISCOUNT",
  "rewardValue": 20.0,
  "maxDiscountAmount": 150.0,
  "minOrderAmount": 200.0,
  "validityDays": 45,
  "active": true,
  "displayOrder": 4
}
```

#### **Fixed Amount Reward (3000 points = 25 TND off)**
```bash
POST http://localhost:8090/api/admin/loyalty/rewards
Authorization: Bearer {YOUR_ADMIN_TOKEN}
Content-Type: application/json

{
  "name": "25 TND Voucher",
  "description": "Get 25 TND off your next order! Great for medium purchases.",
  "pointsRequired": 3000,
  "rewardType": "FIXED_AMOUNT",
  "rewardValue": 25.0,
  "maxDiscountAmount": 25.0,
  "minOrderAmount": 75.0,
  "validityDays": 30,
  "active": true,
  "displayOrder": 5
}
```

### **Step 4: Verify Rewards Created**
```bash
GET http://localhost:8090/api/loyalty/rewards
```

Expected response:
```json
[
  {
    "id": "...",
    "name": "Bronze Discount",
    "pointsRequired": 1000,
    "rewardValue": 5.0,
    ...
  },
  ...
]
```

### **Step 5: Test User Flow**

#### **5.1 Login as Regular User**
```bash
POST http://localhost:8090/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### **5.2 Check Dashboard**
```bash
GET http://localhost:8090/api/loyalty/dashboard
Authorization: Bearer {USER_TOKEN}
```

#### **5.3 Make Test Orders**
```bash
# Create orders to accumulate points
POST http://localhost:8090/api/orders
Authorization: Bearer {USER_TOKEN}
Content-Type: application/json

{
  "shippingAddress": "123 Test St",
  "paymentMethod": "CARD",
  ...
}
```

#### **5.4 Convert Points to Reward**
```bash
# Once you have 1000+ points
POST http://localhost:8090/api/loyalty/rewards/convert
Authorization: Bearer {USER_TOKEN}
Content-Type: application/json

{
  "rewardId": "{BRONZE_REWARD_ID}"
}
```

Response:
```json
{
  "id": "...",
  "couponCode": "LOYALTY-A3B4C5D6",
  "rewardName": "Bronze Discount",
  "rewardValue": 5.0,
  "status": "ACTIVE",
  "expiresAt": "2026-06-01T00:00:00",
  "allowedShops": [...]
}
```

#### **5.5 Use Coupon at Checkout**
```bash
POST http://localhost:8090/api/orders
Authorization: Bearer {USER_TOKEN}
Content-Type: application/json

{
  "couponCode": "LOYALTY-A3B4C5D6",
  "shippingAddress": "123 Test St",
  "paymentMethod": "CARD",
  ...
}
```

---

## 🎯 **Postman Collection**

Import this collection for easy testing:

```json
{
  "info": {
    "name": "Advanced Loyalty System",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Admin - Create Bronze Reward",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{admin_token}}"
          }
        ],
        "url": "{{base_url}}/api/admin/loyalty/rewards",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Bronze Discount\",\n  \"description\": \"Get 5% off your next order!\",\n  \"pointsRequired\": 1000,\n  \"rewardType\": \"PERCENTAGE_DISCOUNT\",\n  \"rewardValue\": 5.0,\n  \"maxDiscountAmount\": 20.0,\n  \"minOrderAmount\": 50.0,\n  \"validityDays\": 30,\n  \"active\": true,\n  \"displayOrder\": 1\n}"
        }
      }
    },
    {
      "name": "User - Get Dashboard",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{user_token}}"
          }
        ],
        "url": "{{base_url}}/api/loyalty/dashboard"
      }
    },
    {
      "name": "User - Convert Points",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{user_token}}"
          }
        ],
        "url": "{{base_url}}/api/loyalty/rewards/convert",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"rewardId\": \"{{reward_id}}\"\n}"
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8090"
    },
    {
      "key": "admin_token",
      "value": ""
    },
    {
      "key": "user_token",
      "value": ""
    }
  ]
}
```

---

## ✅ **Verification Checklist**

- [ ] Application starts successfully
- [ ] Admin can login
- [ ] 5 default rewards created
- [ ] User can view rewards
- [ ] User can accumulate points from orders
- [ ] User can convert points to rewards
- [ ] User receives coupon code
- [ ] Coupon works at checkout
- [ ] Shop restrictions enforced
- [ ] Dynamic boost calculated correctly

---

## 🐛 **Troubleshooting**

### **Issue: "Could not resolve placeholder 'jwt.secret'"**
**Solution:** Check `application.properties` - remove any asterisk (*) at the beginning

### **Issue: "Reward not found"**
**Solution:** Verify reward was created successfully with GET /api/admin/loyalty/rewards

### **Issue: "Insufficient points"**
**Solution:** Make more test orders or manually add points via admin

### **Issue: "This reward can only be used in your top 3 shops"**
**Solution:** Make orders in the same shop to establish it as a top shop

---

## 🎉 **Success!**

Once all steps are complete, your Advanced Dynamic Loyalty System is ready to use! 🚀
