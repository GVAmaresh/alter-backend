import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app"; // Ensure this points to your Express app instance
import NotificationModel from "../models/notificationModel";
import UserModel from "../models/userModel";

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

describe("Notification API End-to-End Tests", () => {
  it("should create a notification successfully", async () => {
    const notificationData = {
      heading: "Test Notification",
      description: "This is a test notification",
      alertLevel: "yellow",
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 60000).toISOString(), // 1 minute expiration
    };

    const res = await request(app)
      .post("/api/notifications/create-notification")
      .set("Authorization", `Bearer ${authToken}`)
      .send(notificationData);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Successfully Message has been saved");

    const savedNotification = await NotificationModel.findOne({
      heading: "Test Notification",
    });

    expect(savedNotification).toBeTruthy();
    expect(savedNotification?.description).toBe("This is a test notification");
    expect(savedNotification?.alertLevel).toBe("yellow");
  });

  it("should return active notifications", async () => {
    await NotificationModel.create({
      heading: "Active Notification",
      description: "This should be active",
      alertLevel: "green",
      startTime: new Date(),
      endTime: new Date(Date.now() + 60000), // 1 minute expiration
      userId,
    });

    const activeNotifications = await NotificationModel.getActiveNotifications();
    expect(activeNotifications.length).toBeGreaterThan(0);
    expect(activeNotifications[0].heading).toBe("Active Notification");
  });

  it("should return if a notification is expired", async () => {
    const expiredNotification = new NotificationModel({
      heading: "Expired Notification",
      description: "This notification should expire",
      alertLevel: "red",
      startTime: new Date(),
      endTime: new Date(Date.now() - 60000), // Expired 1 min ago
      userId,
    });

    await expiredNotification.save();
    expect(expiredNotification.isExpired()).toBe(true);
  });

  it("should automatically delete expired notifications", async () => {
    await NotificationModel.create({
      heading: "Temporary Notification",
      description: "This should be deleted automatically",
      alertLevel: "normal",
      startTime: new Date(),
      endTime: new Date(Date.now() - 60000), // Expired 1 min ago
      userId,
    });

    // Wait for TTL index to trigger deletion
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const expiredNotifications = await NotificationModel.find({
      heading: "Temporary Notification",
    });

    expect(expiredNotifications.length).toBe(0);
  });

  it("should return error when heading or description is missing", async () => {
    const res = await request(app)
      .post("/api/notifications/create-notification")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ alertLevel: "low" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Heading or description is not given");
  });

  it("should return error when user is not authenticated", async () => {
    const res = await request(app)
      .post("/api/notifications/create-notification")
      .send({
        heading: "Unauthorized Notification",
        description: "This should fail",
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  it("should retrieve all notifications", async () => {
    await NotificationModel.insertMany([
      {
        heading: "First Notification",
        description: "Test notification 1",
        alertLevel: "normal",
        startTime: new Date(),
        endTime: new Date(Date.now() + 60000), // 1 minute expiration
        userId,
      },
      {
        heading: "Second Notification",
        description: "Test notification 2",
        alertLevel: "high",
        startTime: new Date(),
        endTime: new Date(Date.now() + 120000), // 2 minutes expiration
        userId,
      },
    ]);

    const res = await request(app)
      .get("/api/notifications/get-notifications")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("There are");
    expect(res.body.data.notifications.length).toBeGreaterThan(0);
  });

  it("should return an empty array if no notifications exist", async () => {
    await NotificationModel.deleteMany(); // Clear all notifications

    const res = await request(app)
      .get("/api/notifications/get-notifications")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User do not have any notification");
    expect(res.body.data).toEqual({});
  });
});
