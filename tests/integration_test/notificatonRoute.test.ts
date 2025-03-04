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

describe("Notification API Integration Tests", () => {
  it("should return an error if user is not authenticated when fetching notifications", async () => {
    const res = await request(app).get("/api/notifications/get-notifications");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  it("should create a new notification", async () => {
    const notificationData = {
      heading: "Test Notification",
      description: "This is a test notification",
      alertLevel: "high",
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour later
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
  });

  it("should return an error when heading or description is missing", async () => {
    const res = await request(app)
      .post("/api/notifications/create-notification")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ alertLevel: "low" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Heading or description is not given");
  });

  it("should return an error when user is not authenticated for creating notification", async () => {
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
    // Insert test notifications
    await NotificationModel.insertMany([
      {
        heading: "First Notification",
        description: "Test notification 1",
        alertLevel: "normal",
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600 * 1000),
        userId,
      },
      {
        heading: "Second Notification",
        description: "Test notification 2",
        alertLevel: "high",
        startTime: new Date(),
        endTime: new Date(Date.now() + 7200 * 1000),
        userId,
      },
    ]);

    const res = await request(app)
      .get("/api/notifications/get-notifications")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("There are");
    expect(res.body.data.notifications.length).toBe(2);
    expect(res.body.data.notifications[0].heading).toBe("First Notification");
    expect(res.body.data.notifications[1].heading).toBe("Second Notification");
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
