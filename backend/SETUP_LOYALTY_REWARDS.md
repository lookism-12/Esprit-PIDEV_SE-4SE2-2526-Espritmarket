# Setup Loyalty Rewards

## Problem
Users have points but cannot see:
1. **Top shops** where they can use rewards
2. **Available rewards** to convert points to

## Solution

### Step 1: Create Loyalty Rewards (Admin)

You need to create rewards in the `loyalty_rewards` collection. Here's how:

#### Option A: Using MongoDB Compass

Insert documents into `loyalty_rewards` collection:

```json
[
  {
    "name": "5% Discount Coupon",
    "description": "Get 5% off your next purchase",
    "pointsRequired": 50,
    "rewardType": "PERCENTAGE_DISCOUNT",
    "rewardValue": 5.0,
    "maxDiscountAmount": 20.0,
    "minOrderAmount": 50.0,
    "validityDays": 30,
    "active": true,
    "displayOrder": 1,
    "createdAt": { "$date": "2026-05-01T00:00:00.000Z" },
    "updatedAt": { "$date": "2026-05-01T00:00:00.000Z" },
    "createdBy": "admin"
  },
  {
    "name": "10% Discount Coupon",
    "description": "Get 10% off your next purchase",
    "pointsRequired": 100,
    "rewardType": "PERCENTAGE_DISCOUNT",
    "rewardValue": 10.0,
    "maxDiscountAmount": 50.0,
    "minOrderAmount": 100.0,
    "validityDays": 30,
    "active": true,
    "displayOrder": 2,
    "createdAt": { "$date": "2026-05-01T00:00:00.000Z" },
    "updatedAt": { "$date": "2026-05-01T00:00:00.000Z" },
    "createdBy": "admin"
  },
  {
    "name": "15% Discount Coupon",
    "description": "Get 15% off your next purchase",
    "pointsRequired": 200,
    "rewardType": "PERCENTAGE_DISCOUNT",
    "rewardValue": 15.0,
    "maxDiscountAmount": 100.0,
    "minOrderAmount": 200.0,
    "validityDays": 30,
    "active": true,
    "displayOrder": 3,
    "createdAt": { "$date": "2026-05-01T00:00:00.000Z" },
    "updatedAt": { "$date": "2026-05-01T00:00:00.000Z" },
    "createdBy": "admin"
  },
  {
    "name": "10 TND Off",
    "description": "Get 10 TND off your next purchase",
    "pointsRequired": 100,
    "rewardType": "FIXED_AMOUNT",
    "rewardValue": 10.0,
    "maxDiscountAmount": null,
    "minOrderAmount": 50.0,
    "validityDays": 30,
    "active": true,
    "displayOrder": 4,
    "createdAt": { "$date": "2026-05-01T00:00:00.000Z" },
    "updatedAt": { "$date": "2026-05-01T00:00:00.000Z" },
    "createdBy": "admin"
  },
  {
    "name": "25 TND Off",
    "description": "Get 25 TND off your next purchase",
    "pointsRequired": 250,
    "rewardType": "FIXED_AMOUNT",
    "rewardValue": 25.0,
    "maxDiscountAmount": null,
    "minOrderAmount": 100.0,
    "validityDays": 30,
    "active": true,
    "displayOrder": 5,
    "createdAt": { "$date": "2026-05-01T00:00:00.000Z" },
    "updatedAt": { "$date": "2026-05-01T00:00:00.000Z" },
    "createdBy": "admin"
  }
]
```

#### Option B: Using Admin API (Coming Soon)

The admin panel at `/admin/loyalty/rewards` will allow creating rewards through the UI.

### Step 2: Verify Top Shops Calculation

The top shops feature requires:

1. **Recent orders** (last 30 days)
2. **Order items with shopId** populated

#### Check if order items have shopId:

```javascript
// In MongoDB Compass, run this query on order_items collection:
db.order_items.find({ shopId: { $exists: true, $ne: null } }).limit(10)
```

If shopId is missing, you need to backfill it. See `BACKFILL_SHOP_IDS.md` for instructions.

### Step 3: Test the Feature

1. **Login as a user** who has:
   - Points (check `loyalty_cards` collection)
   - Recent orders (check `orders` collection)

2. **Navigate to** `/profile/loyalty`

3. **You should see**:
   - Your points and level
   - Dynamic boost badge (if you have 3+ orders this month)
   - **Top Shops section** (if you have orders with shopId)
   - **Available Rewards section** (if rewards are configured)

### Troubleshooting

#### No Top Shops Displayed

**Symptom**: Message says "Make purchases to unlock shops"

**Causes**:
1. No orders in last 30 days
2. Order items don't have `shopId` populated
3. All recent orders are CANCELLED

**Fix**:
```javascript
// Check if user has recent orders
db.orders.find({ 
  userId: ObjectId("YOUR_USER_ID"), 
  createdAt: { $gte: new Date(Date.now() - 30*24*60*60*1000) },
  status: { $ne: "CANCELLED" }
})

// Check if order items have shopId
db.order_items.find({ 
  orderId: { $in: [/* order IDs from above */] },
  shopId: { $exists: true, $ne: null }
})
```

#### No Rewards Displayed

**Symptom**: No "Available Rewards" section

**Causes**:
1. No rewards configured in database
2. All rewards are inactive (`active: false`)
3. User doesn't have enough points for any reward

**Fix**:
```javascript
// Check if rewards exist
db.loyalty_rewards.find({ active: true })

// Check user's points
db.loyalty_cards.findOne({ user: DBRef("users", ObjectId("YOUR_USER_ID")) })
```

### Expected Behavior

Once properly configured:

1. **User with 53 points** should see:
   - ✅ "5% Discount Coupon" (50 points) - Can convert
   - ❌ "10% Discount Coupon" (100 points) - Not enough points
   - ❌ "15% Discount Coupon" (200 points) - Not enough points

2. **User with 22 orders this month** should see:
   - 🚀 HIGH Activity Boost: +0.2
   - Top 3 shops where they've made purchases
   - Rewards can only be used in those top 3 shops

3. **After converting points**:
   - Points deducted from balance
   - New coupon appears in "Your Active Coupons"
   - Coupon code can be copied and used at checkout
   - Coupon expires after 30 days

## API Endpoints

- `GET /api/loyalty/dashboard` - Complete dashboard data
- `GET /api/loyalty/rewards` - All available rewards
- `GET /api/loyalty/rewards/affordable` - Rewards user can afford
- `POST /api/loyalty/rewards/convert` - Convert points to reward
- `GET /api/loyalty/my-rewards` - User's active coupons
- `GET /api/loyalty/top-shops` - User's top 3 shops

## Next Steps

1. Create initial rewards using the JSON above
2. Verify order items have shopId populated
3. Test with a user who has points and recent orders
4. Build admin panel for managing rewards
