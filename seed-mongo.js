const { MongoClient, ObjectId } = require('mongodb');

const uri = "mongodb+srv://admin:admin@espritmarket.pm6cdbe.mongodb.net/esprit_market?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected correctly to server");

    const db = client.db('esprit_market');
    const cartsCollection = db.collection('carts');
    const cartItemsCollection = db.collection('cart_items');

    // Make sure we have a user (we use a generic objectId or existing one)
    const userId = new ObjectId("65e0a0000000000000000999");
    const cartId = new ObjectId("65f0a0000000000000000001");

    // The cartItemIds from the frontend mock
    const item1Id = new ObjectId("65f0a0000000000000000101");
    const item2Id = new ObjectId("65f0a0000000000000000102");
    const item3Id = new ObjectId("65f0a0000000000000000103");
    const item4Id = new ObjectId("65f0a0000000000000000104");

    // Clear existing for clean run if wanted (optional)
    await cartItemsCollection.deleteMany({ _id: { $in: [item1Id, item2Id, item3Id, item4Id] } });
    await cartsCollection.deleteOne({ _id: cartId });

    // Seed CartItems
    const cartItems = [
      {
        _id: item1Id,
        cartId: cartId,
        productId: new ObjectId(),
        productName: "MacBook Pro M3 Max",
        quantity: 1,
        unitPrice: 3200.00,
        subTotal: 3200.00,
        discountApplied: 0,
        status: "ACTIVE",
        _class: "esprit_market.entity.cart.CartItem"
      },
      {
        _id: item2Id,
        cartId: cartId,
        productId: new ObjectId(),
        productName: "AirPods Pro 2",
        quantity: 1,
        unitPrice: 250.00,
        subTotal: 250.00,
        discountApplied: 0,
        status: "ACTIVE",
        _class: "esprit_market.entity.cart.CartItem"
      },
      {
        _id: item3Id,
        cartId: cartId,
        productId: new ObjectId(),
        productName: "iPhone 15 Pro Max",
        quantity: 1,
        unitPrice: 1200.00,
        subTotal: 1200.00,
        discountApplied: 0,
        status: "ACTIVE",
        _class: "esprit_market.entity.cart.CartItem"
      },
      {
        _id: item4Id,
        cartId: cartId,
        productId: new ObjectId(),
        productName: "Logitech MX Master 3S",
        quantity: 1,
        unitPrice: 100.00,
        subTotal: 100.00,
        discountApplied: 0,
        status: "ACTIVE",
        _class: "esprit_market.entity.cart.CartItem"
      }
    ];

    await cartItemsCollection.insertMany(cartItems);
    console.log("Inserted 4 mock cart items");

    // Seed Cart
    const cart = {
      _id: cartId,
      user: {
        $ref: "users",
        $id: userId
      },
      creationDate: new Date(),
      lastUpdated: new Date(),
      subtotal: 4750.00,
      total: 4750.00,
      status: "COMPLETED",
      cartItemIds: [item1Id, item2Id, item3Id, item4Id],
      _class: "esprit_market.entity.cart.Cart"
    };

    await cartsCollection.insertOne(cart);
    console.log("Inserted 1 mock cart");

  } catch (err) {
    console.log("Error seating DB:", err.message);
  } finally {
    await client.close();
  }
}

run();
