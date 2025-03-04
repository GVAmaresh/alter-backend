import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../app";
import NotificationModel from "../../models/notificationModel";
import UserModel from "../../models/userModel";
import { signToken } from "../../controllers/authController";

let mongoServer: MongoMemoryServer;
let server;
let authToken: string;
let fakeAuthToken: string
let userId: mongoose.Types.ObjectId;
let fakeUserId: mongoose.Types.ObjectId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  server = app.listen(7000);
  const user = new UserModel({
    userName: "Test User",
    email: "testuser22@example.com",
    password: "password123",
    emailVerified: true,
  });

  await user.save();
  userId = user._id;
  authToken = signToken(user._id.toString());


  const fakeUser = new UserModel({
    userName: "Test Fake User",
    email: "fake22@example.com",
    password: "password123",
    emailVerified: true,
  });

  await fakeUser.save();
  fakeUserId = fakeUser._id;
  fakeAuthToken = signToken(fakeUser._id.toString());
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("Notification Controller Tests", () => {
  it("should create a notification successfully", async () => {
    const notificationData = {
      heading: "System Maintenance",
      description: "Scheduled system maintenance at midnight.",
      alertLevel: "red",
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600 * 1000),
    };

    const res = await request(app)
      .post("/v1/notification/create-notification")
      .set("Authorization", `Bearer ${authToken}`)
      .send(notificationData);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Successfully Message has been saved");

    const savedNotification = await NotificationModel.findOne({
      heading: "System Maintenance",
    });
    expect(savedNotification).toBeTruthy();
    expect(savedNotification?.description).toBe(
      "Scheduled system maintenance at midnight."
    );
  });

  it("should return an error when heading or description is missing", async () => {
    const res = await request(app)
      .post("/v1/notification/create-notification")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ alertLevel: "low" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Heading or description is not given");
  });

  it("should return all notifications for a user", async () => {
    await new NotificationModel({
      heading: "Meeting Reminder",
      description: "Project meeting at 2 PM",
      alertLevel: "normal",
      startTime: new Date(),
      userId,
    }).save();

    const res = await request(app)
      .get("/v1/notification/get-notifications")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.notifications.length).toBeGreaterThan(0);
    expect(res.body.data.notifications[0].heading).toBe("System Maintenance");
  });

  it("should return an empty array if user has no notifications", async () => {
    const res = await request(app)
      .get("/v1/notification/get-notifications")
      .set("Authorization", `Bearer ${fakeAuthToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.notifications).toEqual([]);
  });

  it("should return error when user is not authenticated", async () => {
    const res = await request(app)
      .post("/v1/notification/create-notification")
      .send({
        heading: "Test Alert",
        description: "This is a test notification",
      });

    expect(res.body.message).toBe("Unauthorized access");
    expect(res.status).toBe(401);
  });
});
