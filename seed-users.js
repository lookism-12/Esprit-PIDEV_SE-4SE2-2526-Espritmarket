const { MongoClient, ObjectId } = require('mongodb');

const uri = "mongodb+srv://admin:admin@espritmarket.pm6cdbe.mongodb.net/esprit_market?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected correctly to server");

    const db = client.db('esprit_market');
    const usersCollection = db.collection('users');

    // Make sure we have a delivery user
    const driver1Id = new ObjectId("65d000000000000000000001");
    const driver2Id = new ObjectId("65d000000000000000000002");

    // Clear existing for clean run if wanted (optional)
    await usersCollection.deleteMany({ _id: { $in: [driver1Id, driver2Id] } });

    // Seed Driver Users
    const users = [
      {
        _id: driver1Id,
        username: "john_transporter",
        email: "john@esprit.tn",
        password: "hashed_password_mock",
        roles: ["DELIVERY"],
        status: "ACTIVE",
        _class: "esprit_market.entity.user.User"
      },
      {
        _id: driver2Id,
        username: "alice_express",
        email: "alice@esprit.tn",
        password: "hashed_password_mock",
        roles: ["DELIVERY"],
        status: "ACTIVE",
        _class: "esprit_market.entity.user.User"
      }
    ];

    await usersCollection.insertMany(users);
    console.log("Inserted 2 mock delivery drivers!");

  } catch (err) {
    console.log("Error seating DB:", err.message);
  } finally {
    await client.close();
  }
}

run();
