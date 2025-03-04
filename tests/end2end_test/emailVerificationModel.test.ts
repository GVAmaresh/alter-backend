import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app"; // Ensure this points to your Express app instance
import EmailVerification from "../models/emailVerificationModel";

let mongoServer: MongoMemoryServer;

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

describe("Email Verification API End-to-End Tests", () => {
  it("should create an email verification entry", async () => {
    const emailVerificationData = {
      email: "testuser@example.com",
      secret: 123456,
    };

    const res = await request(app)
      .post("/api/email/verify-request")
      .send(emailVerificationData);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Verification email sent successfully");

    const savedVerification = await EmailVerification.findOne({
      email: "testuser@example.com",
    });

    expect(savedVerification).toBeTruthy();
    expect(savedVerification?.secret).toBe(123456);
    expect(savedVerification?.expiresAt).toBeDefined();
  });

  it("should return an error when the same email tries to verify again", async () => {
    const emailVerificationData = {
      email: "testuser@example.com",
      secret: 654321,
    };

    const res = await request(app)
      .post("/api/email/verify-request")
      .send(emailVerificationData);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Email verification request already exists");
  });

  it("should delete expired email verification entries after 600 seconds", async () => {
    const emailVerificationData = {
      email: "expired@example.com",
      secret: 987654,
      expiresAt: new Date(Date.now() - 601 * 1000), // Set to past
    };

    await EmailVerification.create(emailVerificationData);

    // Wait for the TTL index to remove the expired document
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const expiredVerification = await EmailVerification.findOne({
      email: "expired@example.com",
    });

    expect(expiredVerification).toBeNull();
  });

  it("should verify the secret and delete the entry after successful verification", async () => {
    const emailVerificationData = {
      email: "testverify@example.com",
      secret: 123789,
    };

    await EmailVerification.create(emailVerificationData);

    const res = await request(app)
      .post("/api/email/verify")
      .send({ email: "testverify@example.com", secret: 123789 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Email successfully verified");

    const deletedEntry = await EmailVerification.findOne({
      email: "testverify@example.com",
    });

    expect(deletedEntry).toBeNull();
  });

  it("should return an error if the secret is incorrect", async () => {
    const emailVerificationData = {
      email: "wrongsecret@example.com",
      secret: 567890,
    };

    await EmailVerification.create(emailVerificationData);

    const res = await request(app)
      .post("/api/email/verify")
      .send({ email: "wrongsecret@example.com", secret: 111222 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid verification code");

    const existingEntry = await EmailVerification.findOne({
      email: "wrongsecret@example.com",
    });

    expect(existingEntry).not.toBeNull();
  });
});
