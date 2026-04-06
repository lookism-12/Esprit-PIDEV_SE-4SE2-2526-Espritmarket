const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://admin:admin@espritmarket.pm6cdbe.mongodb.net/esprit_market?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db('esprit_market');
    const cartsCollection = db.collection('carts');
    
    // Update statuses to valid Enum values in Spring Boot
    await cartsCollection.updateMany(
      { status: "COMPLETED" },
      { $set: { status: "CONFIRMED" } }
    );
    
    await cartsCollection.updateMany(
      { status: "CHECKED_OUT" },
      { $set: { status: "CONFIRMED" } }
    );
    
    console.log("Database statuses updated to CONFIRMED.");
  } catch (err) {
    console.log("Error updating carts:", err.message);
  } finally {
    await client.close();
  }
}

run();
