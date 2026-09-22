const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const Budget = require('../models/Budget');
const { Transaction } = require('../models/Transaction');

let mongoServer;
let token;
let userId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Vikram Seth', email: 'vikram@budget.com', password: 'password123' });
  token = res.body.token;
  userId = res.body.user.id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Budget.deleteMany({});
  await Transaction.deleteMany({});
});

describe('Budget API Endpoints & Progress Tracking', () => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  test('POST /api/budgets should create budget with valid limits', async () => {
    const res = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'Food',
        amount: 10000,
        month: currentMonth,
        year: currentYear
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(10000);
    expect(res.body.data.category).toBe('Food');
  });

  test('POST /api/budgets should prevent duplicate budget for same month/category', async () => {
    await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'Food', amount: 10000, month: currentMonth, year: currentYear });

    const duplicateRes = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'Food', amount: 12000, month: currentMonth, year: currentYear });

    expect(duplicateRes.statusCode).toBe(400);
    expect(duplicateRes.body.error).toMatch(/already exists/i);
  });

  test('GET /api/budgets should accurately calculate spent, percentage, and 70%/90%/100% alerts', async () => {
    // Create Budget: ₹10,000 for Food
    await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'Food', amount: 10000, month: currentMonth, year: currentYear });

    // 1. Spent 5,000 (50% -> normal)
    await Transaction.create({
      user: userId,
      type: 'expense',
      amount: 5000,
      category: 'Food',
      description: 'Dining out',
      date: new Date()
    });

    let res = await request(app)
      .get(`/api/budgets?month=${currentMonth}&year=${currentYear}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data[0].spent).toBe(5000);
    expect(res.body.data[0].percentage).toBe(50);
    expect(res.body.data[0].alertLevel).toBe('normal');

    // 2. Spend another 2,500 (total 7,500 -> 75% -> warning threshold 70%)
    await Transaction.create({
      user: userId,
      type: 'expense',
      amount: 2500,
      category: 'Food',
      description: 'Groceries store',
      date: new Date()
    });

    res = await request(app)
      .get(`/api/budgets?month=${currentMonth}&year=${currentYear}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data[0].spent).toBe(7500);
    expect(res.body.data[0].percentage).toBe(75);
    expect(res.body.data[0].alertLevel).toBe('warning');

    // 3. Spend another 2,000 (total 9,500 -> 95% -> danger threshold 90%)
    await Transaction.create({
      user: userId,
      type: 'expense',
      amount: 2000,
      category: 'Food',
      description: 'Food delivery',
      date: new Date()
    });

    res = await request(app)
      .get(`/api/budgets?month=${currentMonth}&year=${currentYear}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data[0].percentage).toBe(95);
    expect(res.body.data[0].alertLevel).toBe('danger');

    // 4. Spend another 1,000 (total 10,500 -> 105% -> exceeded threshold 100%)
    await Transaction.create({
      user: userId,
      type: 'expense',
      amount: 1000,
      category: 'Food',
      description: 'Snacks',
      date: new Date()
    });

    res = await request(app)
      .get(`/api/budgets?month=${currentMonth}&year=${currentYear}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data[0].percentage).toBe(105);
    expect(res.body.data[0].alertLevel).toBe('exceeded');
  });
});
