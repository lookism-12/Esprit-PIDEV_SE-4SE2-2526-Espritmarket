const { MongoClient, ObjectId } = require('mongodb');

async function run() {
    const uri = 'mongodb+srv://admin:admin@espritmarket.pm6cdbe.mongodb.net/esprit_market?retryWrites=true&w=majority';
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('esprit_market');
        const usersCol = db.collection('users');
        const cartsCol = db.collection('carts');

        // Find user by email
        const user = await usersCol.findOne({ email: 'clientM@gmail.com' });
        
        if (!user) {
            console.error('User clientM@gmail.com not found!');
            return;
        }

        console.log('User found:', user._id);

        const newCartId = new ObjectId();
        const reference = 'CMD-' + Math.floor(Math.random() * 9000 + 1000);
        
        const cart = {
            _id: newCartId,
            reference: reference,
            user: {
                $ref: 'users',
                $id: user._id
            },
            creationDate: new Date(),
            lastUpdated: new Date(),
            subtotal: 150.0,
            taxAmount: 15.0,
            total: 165.0,
            status: 'CONFIRMED',
            cartItemIds: [],
            shippingAddress: '15 Rue des Fleurs, Ariana, Tunis',
            notes: 'Generated for testing delivery'
        };

        const result = await cartsCol.insertOne(cart);
        console.log('Cart created successfully with ID:', result.insertedId, 'and Reference:', reference);

        // Update user cartIds array
        await usersCol.updateOne(
            { _id: user._id },
            { $push: { cartIds: newCartId } }
        );
        console.log('User profile updated with new cart ID.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.close();
    }
}

run();
