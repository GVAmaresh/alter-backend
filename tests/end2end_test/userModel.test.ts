import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import bcrypt from "bcryptjs";
import app from "../app"; // Ensure this points to your Express app instance
import UserModel from "../models/userModel";

let mongoServer: MongoMemoryServer;
let authToken: string;
let userId: mongoose.Types.ObjectId;
let hashedPassword: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("User Authentication and Profile API End-to-End Tests", () => {
  it("should register a new user", async () => {
    const userData = {
      email: "testuser@example.com",
      password: "password123",
    };

    const res = await request(app)
      .post("/api/users/register")
      .send(userData);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("User registered successfully");

    const savedUser = await UserModel.findOne({ email: "testuser@example.com" });

    expect(savedUser).toBeTruthy();
    expect(savedUser?.emailVerified).toBe(false);
    expect(savedUser?.password).not.toBe("password123"); // Ensure password is hashed

    userId = savedUser?._id!;
    hashedPassword = savedUser?.password!;
  });

  it("should hash passwords before saving", async () => {
    const isMatch = await bcrypt.compare("password123", hashedPassword);
    expect(isMatch).toBe(true);
  });

  it("should login successfully", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({ email: "testuser@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Login successful");
    expect(res.body).toHaveProperty("token");

    authToken = res.body.token;
  });

  it("should return error when logging in with wrong password", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({ email: "testuser@example.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Incorrect email or password");
  });

  it("should verify password using `correctPassword` method", async () => {
    const user = await UserModel.findOne({ email: "testuser@example.com" });
    const isCorrect = await user?.correctPassword("password123");
    expect(isCorrect).toBe(true);
  });

  it("should return user profile data", async () => {
    const res = await request(app)
      .get("/api/users/profile")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("testuser@example.com");
  });

  it("should return error for unauthorized profile access", async () => {
    const res = await request(app).get("/api/users/profile");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  it("should return error when registering with an existing email", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({ email: "testuser@example.com", password: "password456" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Email is already registered");
  });

  it("should return error when registering without a password", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({ email: "newuser@example.com" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Please provide a password");
  });
});
