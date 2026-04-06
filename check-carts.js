const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://admin:admin@espritmarket.pm6cdbe.mongodb.net/esprit_market?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db('esprit_market');
    const cartsCollection = db.collection('carts');
    
    const carts = await cartsCollection.find({}).toArray();
    console.log(`Found ${carts.length} carts in database.`);
    
    const statuses = {};
    carts.forEach(c => {
      statuses[c.status] = (statuses[c.status] || 0) + 1;
      console.log(`Cart ID: ${c._id}, Status: ${c.status}`);
    });
    
    console.log('Status distribution:', statuses);
  } catch (err) {
    console.log("Error checking carts:", err.message);
  } finally {
    await client.close();
  }
}

run();
