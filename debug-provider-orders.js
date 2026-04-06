// Debug script to check provider orders data
// Run this in MongoDB Compass or mongo shell

// 1. Check if we have a provider user
db.users.find({email: "provider@test.com"});

// 2. Check if provider has a shop
db.shops.find({ownerId: ObjectId("PROVIDER_USER_ID_HERE")});

// 3. Check products in that shop
db.products.find({shopId: ObjectId("SHOP_ID_HERE")});

// 4. Check cart items that reference those products
db.cart_items.find({productId: {$in: [ObjectId("PRODUCT_ID_1"), ObjectId("PRODUCT_ID_2")]}});

// 5. Check carts that contain those cart items
db.carts.find({status: {$in: ["PENDING", "CONFIRMED", "CANCELLED"]}});

// Alternative: Check all cart items
db.cart_items.find({});

// Check if cart_items collection exists
db.getCollectionNames().filter(name => name.includes("cart"));