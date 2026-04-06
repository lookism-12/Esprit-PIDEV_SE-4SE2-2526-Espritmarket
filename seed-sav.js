const { MongoClient, ObjectId } = require('mongodb');

const uri = "mongodb+srv://admin:admin@espritmarket.pm6cdbe.mongodb.net/esprit_market?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected correctly to server");

    const db = client.db('esprit_market');
    
    // Create collections if they don't exist by inserting a dummy document then optionally deleting it
    // Or just inserting a mock one for the user to see!
    
    const deliveriesCollection = db.collection('deliveries');
    const feedbacksCollection = db.collection('sav_feedbacks');

    const dummyDeliveryId = new ObjectId();
    const mockDelivery = {
      _id: dummyDeliveryId,
      address: "123 Rue de l'Exemple, Tunis",
      deliveryDate: new Date(),
      status: "PREPARING",
      userId: new ObjectId("65d000000000000000000001"),
      cartId: new ObjectId("65f0a0000000000000000001"),
      _class: "esprit_market.entity.SAV.Delivery"
    };

    const dummyFeedbackId = new ObjectId();
    const mockFeedback = {
      _id: dummyFeedbackId,
      cartItemId: new ObjectId("65f0a0000000000000000101"),
      type: "SAV",
      rating: 5,
      reason: "Produit arrivé en parfait état",
      message: "Ceci est une évaluation de test pour initialiser la table !",
      status: "PENDING",
      creationDate: new Date(),
      _class: "esprit_market.entity.SAV.SavFeedback"
    };

    await deliveriesCollection.insertOne(mockDelivery);
    await feedbacksCollection.insertOne(mockFeedback);

    console.log("Les tables 'deliveries' et 'sav_feedbacks' ont été créées et initialisées avec succès !");

  } catch (err) {
    console.log("Error seating DB:", err.message);
  } finally {
    await client.close();
  }
}

run();
