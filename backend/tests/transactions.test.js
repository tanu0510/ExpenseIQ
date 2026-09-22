const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const { Transaction } = require('../models/Transaction');

let mongoServer;
let tokenA;
let userAId;
let tokenB;
let userBId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Register User A
  const resA = await request(app)
    .post('/api/auth/register')
    .send({ name: 'User A', email: 'usera@test.com', password: 'password123' });
  tokenA = resA.body.token;
  userAId = resA.body.user.id;

  // Register User B
  const resB = await request(app)
    .post('/api/auth/register')
    .send({ name: 'User B', email: 'userb@test.com', password: 'password123' });
  tokenB = resB.body.token;
  userBId = resB.body.user.id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Transaction.deleteMany({});
});

describe('Transaction API Endpoints & CRUD', () => {
  const sampleExpense = {
    type: 'expense',
    amount: 1450,
    category: 'Food',
    description: 'Dinner at Bistro',
    paymentMethod: 'UPI',
    date: '2026-03-10'
  };

  test('POST /api/transactions should create an expense transaction', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(sampleExpense);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(1450);
    expect(res.body.data.category).toBe('Food');
    expect(res.body.data.user.toString()).toBe(userAId);
  });

  test('POST /api/transactions should reject negative or zero amount', async () => {
    const negativeRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ ...sampleExpense, amount: -500 });

    expect(negativeRes.statusCode).toBe(400);
    expect(negativeRes.body.success).toBe(false);

    const zeroRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ ...sampleExpense, amount: 0 });

    expect(zeroRes.statusCode).toBe(400);
  });

  test('GET /api/transactions should list transactions with pagination and filter', async () => {
    // Create 3 expenses and 1 income for User A
    await request(app).post('/api/transactions').set('Authorization', `Bearer ${tokenA}`).send(sampleExpense);
    await request(app).post('/api/transactions').set('Authorization', `Bearer ${tokenA}`).send({
      type: 'expense',
      amount: 400,
      category: 'Transportation',
      description: 'Metro pass'
    });
    await request(app).post('/api/transactions').set('Authorization', `Bearer ${tokenA}`).send({
      type: 'income',
      amount: 50000,
      category: 'Salary',
      description: 'Monthly Salary'
    });

    // List all
    const allRes = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(allRes.statusCode).toBe(200);
    expect(allRes.body.total).toBe(3);

    // Filter by type=expense
    const expenseRes = await request(app)
      .get('/api/transactions?type=expense')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(expenseRes.statusCode).toBe(200);
    expect(expenseRes.body.total).toBe(2);

    // Filter by category=Food
    const foodRes = await request(app)
      .get('/api/transactions?category=Food')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(foodRes.statusCode).toBe(200);
    expect(foodRes.body.total).toBe(1);
    expect(foodRes.body.data[0].category).toBe('Food');
  });

  test('PUT and DELETE /api/transactions/:id', async () => {
    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(sampleExpense);

    const txnId = createRes.body.data._id;

    // Update
    const updateRes = await request(app)
      .put(`/api/transactions/${txnId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ amount: 1800, description: 'Dinner with colleagues' });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.data.amount).toBe(1800);
    expect(updateRes.body.data.description).toBe('Dinner with colleagues');

    // Delete
    const deleteRes = await request(app)
      .delete(`/api/transactions/${txnId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(deleteRes.statusCode).toBe(200);

    // Verify deletion
    const getRes = await request(app)
      .get(`/api/transactions/${txnId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(getRes.statusCode).toBe(404);
  });

  test('Security & Data Isolation: User B cannot access or modify User A transactions', async () => {
    // Create transaction by User A
    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(sampleExpense);

    const txnId = createRes.body.data._id;

    // User B attempts to read User A's transaction
    const readRes = await request(app)
      .get(`/api/transactions/${txnId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(readRes.statusCode).toBe(403);

    // User B attempts to update User A's transaction
    const updateRes = await request(app)
      .put(`/api/transactions/${txnId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ amount: 99999 });

    expect(updateRes.statusCode).toBe(403);

    // User B attempts to delete User A's transaction
    const deleteRes = await request(app)
      .delete(`/api/transactions/${txnId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(deleteRes.statusCode).toBe(403);

    // Verify User A's transaction remains untouched
    const originalRes = await request(app)
      .get(`/api/transactions/${txnId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(originalRes.statusCode).toBe(200);
    expect(originalRes.body.data.amount).toBe(1450);
  });
});
