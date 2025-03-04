import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app"; // Ensure this points to your Express app instance
import BlogModel from "../models/blogModel";
import UserModel from "../models/userModel";
import { protect } from "../controllers/authController";

let mongoServer: MongoMemoryServer;
let authToken: string;
let userId: mongoose.Types.ObjectId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Create a test user for authentication
  const user = new UserModel({
    userName: "Test User",
    email: "testuser@example.com",
    password: "password123",
    emailVerified: true,
  });

  await user.save();
  userId = user._id;
  authToken = "mock-auth-token"; // Replace with real token logic if necessary
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("Blogs API Integration Tests", () => {
  beforeEach(async () => {
    // Insert test blogs into the database
    await BlogModel.insertMany([
      {
        title: "First Blog",
        content: "This is the first test blog",
        author: userId,
        createdAt: new Date(),
      },
      {
        title: "Second Blog",
        content: "This is the second test blog",
        author: userId,
        createdAt: new Date(),
      },
    ]);
  });

  afterEach(async () => {
    await BlogModel.deleteMany(); // Clear blogs after each test
  });

  it("should retrieve all blogs when authenticated", async () => {
    const res = await request(app)
      .get("/api/blogs/who-blogs")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].title).toBe("First Blog");
    expect(res.body.data[1].title).toBe("Second Blog");
  });

  it("should return an error when user is not authenticated", async () => {
    const res = await request(app).get("/api/blogs/who-blogs");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  it("should return empty array when no blogs exist", async () => {
    await BlogModel.deleteMany(); // Remove all blogs

    const res = await request(app)
      .get("/api/blogs/who-blogs")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});
