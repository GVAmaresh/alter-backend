import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../app"; 
import ChatModel from "../../models/chatModel";
import UserModel from "../../models/userModel";
import { signToken } from "../../controllers/authController";

let mongoServer: MongoMemoryServer;
let authToken: string;
let userId: mongoose.Types.ObjectId;
let server: any;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  mongoose.connection.once('open', () => console.log('MongoDB Memory Server connected'));
  server = app.listen(4100);

  const user = new UserModel({
    userName: "Test User",
    email: "testuser@example.com",
    password: "password123",
    emailVerified: true,
  });

  await user.save();
  userId = user._id;
  authToken = signToken(user._id.toString()); 
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("Chat Controller Tests", () => {
  let chatCreatedAt: Date;

  it("should create a chat successfully", async () => {
    const chatData = {
      sender: "chatbot",
      message: "Hello, this is a test message",
    };

    const res = await request(app)
      .post("/v1/chatBot/create-chat")
      .set("Authorization", `Bearer ${authToken}`)
      .send(chatData);

    expect(res.body.message).toBe("Chat stored successfully");
    expect(res.status).toBe(201);
    expect(res.body.data.sender).toBe(chatData.sender);
    expect(res.body.data.message).toBe(chatData.message);

    chatCreatedAt = res.body.data.createdAt;
  });

  it("should return an error if sender or message is missing", async () => {
    const res = await request(app)
      .post("/v1/chatBot/create-chat")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ sender: "chatbot" });

    expect(res.body.message).toBe("Sender or Message is not provided");
    expect(res.status).toBe(400);
  });

  it("should return an error if user is not authenticated", async () => {
    const res = await request(app)
      .post("/v1/chatBot/create-chat")
      .send({ sender: "Test", message: "Unauthenticated request" });

    expect(res.body.message).toBe("Unauthorized access");
    expect(res.status).toBe(401);
  });

  it("should retrieve all chats", async () => {
    const res = await request(app)
      .get("/v1/chatBot/get-chat")
      .set("Authorization", `Bearer ${authToken}`)
      .query({ page: 1 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Chats retrieved");
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("should return empty array when no chats exist", async () => {
    await ChatModel.deleteMany({}); 

    const res = await request(app)
      .get("/v1/chatBot/get-chat")
      .set("Authorization", `Bearer ${authToken}`)
      .query({ page: 1 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("No chats available");
    expect(res.body.data).toEqual([]);
  });

  it("should delete a chat successfully", async () => {
    const chat = new ChatModel({
      sender: "chatbot",
      message: "This chat will be deleted",
      userId,
      active: true,
      createdAt: new Date(),
    });
    await chat.save();

    const res = await request(app)
      .post("/v1/chatBot/delete-chat")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ createdAt: chat.createdAt });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Chat successfully deleted");

    const deletedChat = await ChatModel.findOne({ createdAt: chat.createdAt });
    expect(deletedChat?.active).toBe(false);
  });

  it("should return error when deleting a non-existent chat", async () => {
    const res = await request(app)
      .post("/v1/chatBot/delete-chat")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ createdAt: new Date() });

   expect(res.body.message).toBe("Chat is already deleted or not found");
    expect(res.status).toBe(200);
  });
});
