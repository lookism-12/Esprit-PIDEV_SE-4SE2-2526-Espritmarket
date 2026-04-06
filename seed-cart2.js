const { MongoClient, ObjectId } = require('mongodb');

const uri = "mongodb+srv://admin:admin@espritmarket.pm6cdbe.mongodb.net/esprit_market?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db('esprit_market');
    const cartsCollection = db.collection('carts');

    const newCartId = new ObjectId("65f0a0000000000000000002");
    
    // Insert a new Cart so the backend validation doesn't fail
    const newCart = {
      _id: newCartId,
      userId: new ObjectId("69c957e39e259227b3ff626c"), // Use the Test User we saw earlier
      totalPrice: 245.50,
      status: "CHECKED_OUT",
      _class: "esprit_market.entity.cart.Cart"
    };

    // Upsert so if it exists we don't crash
    await cartsCollection.updateOne(
      { _id: newCartId },
      { $set: newCart },
      { upsert: true }
    );

    console.log("Cart #002 successfully inserted into database!");
  } catch (err) {
    console.log("Error inserting cart:", err.message);
  } finally {
    await client.close();
  }
}

run();
