import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app"; // Ensure this points to your Express app instance
import ChatModel from "../models/chatModel";
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

describe("Chat API End-to-End Tests", () => {
  let chatCreatedAt: Date;

  it("should create a chat successfully", async () => {
    const chatData = {
      sender: "user",
      message: "Hello, chatbot!",
    };

    const res = await request(app)
      .post("/api/chat/create-chat")
      .set("Authorization", `Bearer ${authToken}`)
      .send(chatData);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Chat stored successfully");
    expect(res.body.data.sender).toBe(chatData.sender);
    expect(res.body.data.message).toBe(chatData.message);

    chatCreatedAt = res.body.data.createdAt;
  });

  it("should fetch all chats for the user", async () => {
    const res = await request(app)
      .get("/api/chat/get-chat")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Chats retrieved");
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].message).toBe("Hello, chatbot!");
  });

  it("should return error if user is not authenticated when fetching chats", async () => {
    const res = await request(app).get("/api/chat/get-chat");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  it("should delete a chat successfully", async () => {
    const chat = new ChatModel({
      sender: "user",
      message: "This chat will be deleted",
      userId,
      active: true,
      createdAt: new Date(),
    });
    await chat.save();

    const res = await request(app)
      .post("/api/chat/delete-chat")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ createdAt: chat.createdAt });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Chat successfully deleted");

    const deletedChat = await ChatModel.findOne({ createdAt: chat.createdAt });
    expect(deletedChat?.active).toBe(false);
  });

  it("should return error when deleting a non-existent chat", async () => {
    const res = await request(app)
      .post("/api/chat/delete-chat")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ createdAt: new Date() });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Chat is already deleted or not found");
  });

  it("should return an empty array if no chats exist for the user", async () => {
    await ChatModel.deleteMany(); // Clear all chats

    const res = await request(app)
      .get("/api/chat/get-chat")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("No chats available");
    expect(res.body.data).toEqual([]);
  });
});
