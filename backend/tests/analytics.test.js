const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
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
    .send({ name: 'Ananya Roy', email: 'ananya@analytics.com', password: 'password123' });
  token = res.body.token;
  userId = res.body.user.id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Transaction.deleteMany({});

  // Seed transactions
  await Transaction.create([
    {
      user: userId,
      type: 'income',
      amount: 70000,
      category: 'Salary',
      description: 'Monthly Salary',
      date: new Date()
    },
    {
      user: userId,
      type: 'expense',
      amount: 6000,
      category: 'Food',
      description: 'Restaurants',
      date: new Date()
    },
    {
      user: userId,
      type: 'expense',
      amount: 4000,
      category: 'Transportation',
      description: 'Fuel & cabs',
      date: new Date()
    }
  ]);
});

describe('Analytics API Endpoints', () => {
  test('GET /api/analytics/summary calculates exact real database numbers', async () => {
    const res = await request(app)
      .get('/api/analytics/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalIncome).toBe(70000);
    expect(res.body.data.totalExpenses).toBe(10000);
    expect(res.body.data.netBalance).toBe(60000);
    expect(res.body.data.currentMonthIncome).toBe(70000);
    expect(res.body.data.currentMonthExpense).toBe(10000);
    expect(res.body.data.savingsRate).toBe(85.7);
  });

  test('GET /api/analytics/categories groups and calculates percentages', async () => {
    const res = await request(app)
      .get('/api/analytics/categories')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBe(10000);
    expect(res.body.data.length).toBe(2);

    const food = res.body.data.find(c => c.category === 'Food');
    expect(food.amount).toBe(6000);
    expect(food.percentage).toBe(60);

    const transport = res.body.data.find(c => c.category === 'Transportation');
    expect(transport.amount).toBe(4000);
    expect(transport.percentage).toBe(40);
  });

  test('GET /api/analytics/monthly returns continuous array for selected timeframe', async () => {
    const res = await request(app)
      .get('/api/analytics/monthly?months=6')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(6);
  });

  test('GET /api/analytics/trends returns daily array for current month', async () => {
    const res = await request(app)
      .get('/api/analytics/trends')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/analytics/deep-metrics returns averages and top category', async () => {
    const res = await request(app)
      .get('/api/analytics/deep-metrics')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.topCategory.category).toBe('Food');
    expect(res.body.data.topCategory.amount).toBe(6000);
    expect(res.body.data.totalCurrentMonthExpense).toBe(10000);
  });
});
