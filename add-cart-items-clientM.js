const { MongoClient, ObjectId } = require('mongodb');

async function run() {
    const uri = 'mongodb+srv://admin:admin@espritmarket.pm6cdbe.mongodb.net/esprit_market?retryWrites=true&w=majority';
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('esprit_market');
        const cartItemsCol = db.collection('cart_items');
        const cartsCol = db.collection('carts');

        const cartId = new ObjectId('69cb72cfa5dfe1c8f5a3da5d');
        const items = [
            {
                _id: new ObjectId(),
                cartId: cartId,
                productId: new ObjectId('69c970acc3195f0f5f5912ca'),
                productName: 'Wireless Keyboard',
                quantity: 1,
                unitPrice: 85.0,
                subTotal: 85.0,
                status: 'ACTIVE'
            },
            {
                _id: new ObjectId(),
                cartId: cartId,
                productId: new ObjectId('69c970acc3195f0f5f5912cb'),
                productName: 'Gaming Mouse',
                quantity: 1,
                unitPrice: 60.0,
                subTotal: 60.0,
                status: 'ACTIVE'
            }
        ];

        // Insert items
        await cartItemsCol.insertMany(items);
        console.log('2 CartItems inserted.');

        // Update cart with item IDs and update totals
        const itemIds = items.map(it => it._id);
        const subtotal = 145.0;
        const tax = 14.5;
        const total = 159.5;

        await cartsCol.updateOne(
            { _id: cartId },
            { 
                $set: { 
                    cartItemIds: itemIds,
                    subtotal: subtotal,
                    taxAmount: tax,
                    total: total,
                    lastUpdated: new Date()
                } 
            }
        );
        console.log('Cart updated with new items and totals.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.close();
    }
}

run();
