const chai = require('chai');
const chaiHttp = require('chai-http');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Configure chai
chai.use(chaiHttp);
chai.should();

// Create MongoDB memory server
let mongod;

before(async () => {
    // Start MongoDB memory server
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    // Connect to MongoDB
    await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    // Set environment variables for testing
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret';
    process.env.STRIPE_SECRET_KEY = 'test-stripe-secret';
    process.env.STRIPE_WEBHOOK_SECRET = 'test-webhook-secret';
});

after(async () => {
    // Disconnect from MongoDB
    await mongoose.disconnect();

    // Stop MongoDB memory server
    await mongod.stop();
});

// Clean up database before each test
beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany();
    }
}); 