const { MongoClient, ObjectId } = require('mongodb');

const uri = "mongodb+srv://admin:admin@espritmarket.pm6cdbe.mongodb.net/esprit_market?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db('esprit_market');
    const cartsCollection = db.collection('carts');

    const newCartId = new ObjectId();
    const reference = "CMD-USER-" + Math.floor(1000 + Math.random() * 9000); // e.g., CMD-USER-4582
    
    // Create a new Cart document mimicking Spring Data format
    const newCart = {
      _id: newCartId,
      user: {
          $ref: "users",
          $id: new ObjectId("69ca64a982d8601c56f1a09e")
      },
      reference: reference,
      creationDate: new Date(),
      lastUpdated: new Date(),
      subtotal: 100.0,
      discountAmount: 0.0,
      taxAmount: 18.0,
      total: 118.0,
      status: "CONFIRMED", // Let's use CONFIRMED so it's a valid order
      cartItemIds: [],
      _class: "esprit_market.entity.cart.Cart"
    };

    const result = await cartsCollection.insertOne(newCart);
    console.log(`Cart successfully inserted with ID: ${newCartId}`);
    console.log(`The Reference is: ${reference}`);
    console.log(`User mapped: 69ca64a982d8601c56f1a09e`);
    
  } catch (err) {
    console.log("Error inserting cart:", err.message);
  } finally {
    await client.close();
  }
}

run();
