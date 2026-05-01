// MongoDB Script to Insert Sample Loyalty Rewards
// Run this in MongoDB Compass or mongosh

// Connect to your database first:
// use esprit_market

// Insert sample rewards
db.loyalty_rewards.insertMany([
  {
    name: "5% Discount Coupon",
    description: "Get 5% off your next purchase in your favorite shops",
    pointsRequired: 50,
    rewardType: "PERCENTAGE_DISCOUNT",
    rewardValue: 5.0,
    maxDiscountAmount: 20.0,
    minOrderAmount: 50.0,
    validityDays: 30,
    active: true,
    displayOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "admin",
    _class: "esprit_market.entity.cart.LoyaltyReward"
  },
  {
    name: "10% Discount Coupon",
    description: "Get 10% off your next purchase in your favorite shops",
    pointsRequired: 100,
    rewardType: "PERCENTAGE_DISCOUNT",
    rewardValue: 10.0,
    maxDiscountAmount: 50.0,
    minOrderAmount: 100.0,
    validityDays: 30,
    active: true,
    displayOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "admin",
    _class: "esprit_market.entity.cart.LoyaltyReward"
  },
  {
    name: "15% Discount Coupon",
    description: "Get 15% off your next purchase in your favorite shops",
    pointsRequired: 200,
    rewardType: "PERCENTAGE_DISCOUNT",
    rewardValue: 15.0,
    maxDiscountAmount: 100.0,
    minOrderAmount: 200.0,
    validityDays: 30,
    active: true,
    displayOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "admin",
    _class: "esprit_market.entity.cart.LoyaltyReward"
  },
  {
    name: "10 TND Off",
    description: "Get 10 TND off your next purchase",
    pointsRequired: 100,
    rewardType: "FIXED_AMOUNT",
    rewardValue: 10.0,
    maxDiscountAmount: null,
    minOrderAmount: 50.0,
    validityDays: 30,
    active: true,
    displayOrder: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "admin",
    _class: "esprit_market.entity.cart.LoyaltyReward"
  },
  {
    name: "25 TND Off",
    description: "Get 25 TND off your next purchase",
    pointsRequired: 250,
    rewardType: "FIXED_AMOUNT",
    rewardValue: 25.0,
    maxDiscountAmount: null,
    minOrderAmount: 100.0,
    validityDays: 30,
    active: true,
    displayOrder: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "admin",
    _class: "esprit_market.entity.cart.LoyaltyReward"
  }
]);

print("✅ Sample rewards inserted successfully!");
print("Run this query to verify:");
print("db.loyalty_rewards.find({ active: true })");
