import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import app from '../../app'; 
import UserModel from '../../models/userModel';
import { signToken, emailPasswordVerify, protect } from '../../controllers/authController';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('Auth Controller Tests', () => {
  let mongoServer: MongoMemoryServer;
  let server: any;
  
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  
    mongoose.connection.once('open', () => console.log('MongoDB Memory Server connected'));
  
    server = app.listen(7000);
  });
  

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoose.connection.close();
    await mongoServer.stop();
    server.close();
  });

  beforeEach(async () => {
    await UserModel.deleteMany();
  });

  describe('signToken', () => {
    it('should generate a valid JWT token', () => {
      process.env.JWT_SECRET = 'testsecret';
      const token = signToken('12345');
      expect(typeof token).toBe('string');
      const decoded = jwt.verify(token, 'testsecret');
      expect(decoded).toHaveProperty('id', '12345');
    });
  });

  describe('emailPasswordVerify', () => {
    it('should create a new user and send verification email', async () => {
        const response = await request(app)
          .post('/v1/user/login-signup')
          .send({ email: 'test@example.com', password: 'password123' });
      
        console.log('Response Status:', response.status);
        console.log('Response Body:', response.body);
      
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('verifyEmail', false);
        expect(response.body).toHaveProperty('message', 'Email verification has been sent');
      });
      

    it('should return an error for incorrect password', async () => {
      const hashedPassword = await bcrypt.hash('password123', 12);
      const user = await UserModel.create({ email: 'test@example.com', password: hashedPassword, emailVerified: true });
      const token = signToken(user._id.toString());
      
      const response = await request(app)
        .post('/v1/user/login-signup')
        .send({ email: 'test@example.com', password: 'wrongpassword' }).set('Authorization', `Bearer ${token}`);;
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Incorrect password');
    });
  });

  describe('protect', () => {
    it('should block access if token is missing', async () => {
      const response = await request(app).get('/v1/user/verify-token');
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Unauthorized access');
    });

    it('should allow access with a valid token', async () => {
      const user = await UserModel.create({ email: 'test@example.com', password: 'password123' });
      const token = signToken(user._id.toString());
      
      const response = await request(app)
        .get('/api/protected-route')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).not.toBe(401);
    });
  });
});