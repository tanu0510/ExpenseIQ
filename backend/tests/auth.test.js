const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Authentication API Endpoints', () => {
  const testUser = {
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    password: 'password123',
    currency: 'INR',
    monthlyIncome: 65000,
    savingsGoal: 15000
  };

  test('POST /api/auth/register should create a user and return JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.name).toBe(testUser.name);
    expect(res.body.user.currency).toBe('INR');
  });

  test('POST /api/auth/register should fail on duplicate email', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const duplicateRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(duplicateRes.statusCode).toBe(400);
    expect(duplicateRes.body.success).toBe(false);
    expect(duplicateRes.body.error).toMatch(/already exists/i);
  });

  test('POST /api/auth/login should authenticate valid user', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  test('POST /api/auth/login should reject invalid credentials', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/auth/me should return 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/auth/me should return current user with valid token', async () => {
    const regRes = await request(app).post('/api/auth/register').send(testUser);
    const token = regRes.body.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(testUser.email);
  });

  test('PUT /api/auth/profile should update user preferences and currency', async () => {
    const regRes = await request(app).post('/api/auth/register').send(testUser);
    const token = regRes.body.token;

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Rahul S.',
        currency: 'USD',
        monthlyIncome: 75000
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.name).toBe('Rahul S.');
    expect(res.body.user.currency).toBe('USD');
    expect(res.body.user.monthlyIncome).toBe(75000);
  });

  test('Password change and reset flow', async () => {
    const regRes = await request(app).post('/api/auth/register').send(testUser);
    const token = regRes.body.token;

    // Change password
    const changeRes = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'password123',
        newPassword: 'newsecurepassword123'
      });

    expect(changeRes.statusCode).toBe(200);

    // Verify login with new password
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'newsecurepassword123'
      });

    expect(loginRes.statusCode).toBe(200);

    // Forgot password flow
    const forgotRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testUser.email });

    expect(forgotRes.statusCode).toBe(200);
    const resetToken = forgotRes.body.resetToken;
    expect(resetToken).toBeDefined();

    // Reset password with token
    const resetRes = await request(app)
      .post(`/api/auth/reset-password/${resetToken}`)
      .send({ password: 'finalresetpassword999' });

    expect(resetRes.statusCode).toBe(200);
  });
});
