import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../app"; 
import UserModel from "../../models/userModel";
import { signToken } from "../../controllers/authController";

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
    emailVerified: false,
  });

  await user.save();
  userId = user._id;
  authToken = signToken(user._id.toString());; 
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("User Authentication & Profile API Integration Tests", () => {
  it("should return working response for /user-working", async () => {
    const res = await request(app).get("/api/users/user-working");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Working User Successfully");
  });

  it("should log in or sign up a user", async () => {
    const res = await request(app).post("/api/users/login-signup").send({
      email: "testuser@example.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("Login or Signup Successful");
    expect(res.body).toHaveProperty("token");
  });

  it("should return an error when login details are incorrect", async () => {
    const res = await request(app).post("/api/users/login-signup").send({
      email: "wronguser@example.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });

  it("should verify authentication token", async () => {
    const res = await request(app)
      .get("/api/users/verify-token")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.isValid).toBe(true);
    expect(res.body.message).toBe("User logged in successfully");
  });

  it("should return error for unauthorized token verification", async () => {
    const res = await request(app).get("/api/users/verify-token");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("User not logged in");
  });

  it("should verify user email", async () => {
    const res = await request(app)
      .post("/api/users/verify-email")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Email verification successful");
  });

  it("should return an error for unauthorized email verification", async () => {
    const res = await request(app).post("/api/users/verify-email");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  it("should update user details", async () => {
    const updatedUserData = {
      userName: "Updated User",
      emergencyContact: "9876543210",
      emergencyName: "John Doe",
      gender: "Male",
      dob: "1990-01-01",
      age: 34,
      idType: "Aadhar",
      idNumber: "123456789012",
      nameCard: "John Card",
      namePhysician: "Dr. Smith",
      pincode: "560001",
      state: "Karnataka",
    };

    const res = await request(app)
      .post("/api/users/update-user")
      .set("Authorization", `Bearer ${authToken}`)
      .send(updatedUserData);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User details updated successfully");
    expect(res.body.updatedUser.userName).toBe("Updated User");
  });

  it("should return error if required user details are missing", async () => {
    const res = await request(app)
      .post("/api/users/update-user")
      .set("Authorization", `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Request body cannot be empty");
  });

  it("should return an error when updating user details without authentication", async () => {
    const res = await request(app).post("/api/users/update-user").send({
      userName: "Unauthorized Update",
      emergencyContact: "1234567890",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });
});
