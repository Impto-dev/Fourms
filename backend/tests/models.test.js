const { expect } = require('chai');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Thread = require('../src/models/Thread');
const Post = require('../src/models/Post');
const Payment = require('../src/models/Payment');

describe('Model Methods', () => {
  before(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  after(async () => {
    // Clean up and disconnect
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  describe('User Model', () => {
    it('should create a new user', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!'
      });
      expect(user).to.have.property('_id');
      expect(user.username).to.equal('testuser');
    });

    it('should validate password', async () => {
      const user = await User.create({
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'Password123!'
      });
      expect(await user.validatePassword('Password123!')).to.be.true;
      expect(await user.validatePassword('wrongpassword')).to.be.false;
    });

    it('should update last login', async () => {
      const user = await User.create({
        username: 'testuser3',
        email: 'test3@example.com',
        password: 'Password123!'
      });
      await user.updateLastLogin();
      expect(user.lastLogin).to.be.a('date');
    });
  });

  describe('Thread Model', () => {
    it('should create a new thread', async () => {
      const user = await User.create({
        username: 'threaduser',
        email: 'thread@example.com',
        password: 'Password123!'
      });

      const thread = await Thread.create({
        title: 'Test Thread',
        content: 'Test content',
        author: user._id,
        category: 'general'
      });

      expect(thread).to.have.property('_id');
      expect(thread.title).to.equal('Test Thread');
    });

    it('should update view count', async () => {
      const thread = await Thread.findOne({ title: 'Test Thread' });
      await thread.incrementViews();
      expect(thread.views).to.equal(1);
    });
  });

  describe('Post Model', () => {
    it('should create a new post', async () => {
      const user = await User.create({
        username: 'postuser',
        email: 'post@example.com',
        password: 'Password123!'
      });

      const thread = await Thread.create({
        title: 'Post Thread',
        content: 'Test content',
        author: user._id,
        category: 'general'
      });

      const post = await Post.create({
        content: 'Test post content',
        author: user._id,
        thread: thread._id
      });

      expect(post).to.have.property('_id');
      expect(post.content).to.equal('Test post content');
    });

    it('should update post content', async () => {
      const post = await Post.findOne({ content: 'Test post content' });
      await post.updateContent('Updated content');
      expect(post.content).to.equal('Updated content');
      expect(post.edited).to.be.true;
    });
  });

  describe('Payment Model', () => {
    it('should create a new payment', async () => {
      const user = await User.create({
        username: 'paymentuser',
        email: 'payment@example.com',
        password: 'Password123!'
      });

      const payment = await Payment.create({
        user: user._id,
        amount: 9.99,
        currency: 'usd',
        status: 'completed',
        paymentMethod: 'stripe',
        subscription: {
          type: 'monthly',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });

      expect(payment).to.have.property('_id');
      expect(payment.amount).to.equal(9.99);
    });

    it('should update payment status', async () => {
      const payment = await Payment.findOne({ amount: 9.99 });
      await payment.updateStatus('refunded', 'Customer request');
      expect(payment.status).to.equal('refunded');
      expect(payment.refundReason).to.equal('Customer request');
    });
  });
}); 