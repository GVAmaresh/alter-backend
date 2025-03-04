import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import path from "path";
import app from "../../app"; 
import DocumentModel from "../../models/documentModel";
import UserModel from "../../models/userModel";

let mongoServer: MongoMemoryServer;
let authToken: string;
let userId: mongoose.Types.ObjectId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  const user = new UserModel({
    userName: "Test User",
    email: "testuser@example.com",
    password: "password123",
    emailVerified: true,
  });

  await user.save();
  userId = user._id;
  authToken = "mock-auth-token"; 
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("Document API Integration Tests", () => {
  it("should return working response for /docs-working", async () => {
    const res = await request(app).get("/api/docs/docs-working");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Working Docs Successfully");
  });

  it("should store a document successfully", async () => {
    const filePath = path.join(__dirname, "testFile.txt");
    require("fs").writeFileSync(filePath, "Test content");

    const res = await request(app)
      .post("/api/docs/save-docs")
      .set("Authorization", `Bearer ${authToken}`)
      .field("date", new Date().toISOString())
      .attach("file", filePath);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("File stored successfully");
    expect(res.body).toHaveProperty("fileId");
    expect(res.body).toHaveProperty("encryptedFileId");

    require("fs").unlinkSync(filePath);
  });

  it("should return an error if no file is uploaded", async () => {
    const res = await request(app)
      .post("/api/docs/save-docs")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ date: new Date().toISOString() });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("No file uploaded");
  });

  it("should return an error if date is missing", async () => {
    const filePath = path.join(__dirname, "testFile.txt");
    require("fs").writeFileSync(filePath, "Test content");

    const res = await request(app)
      .post("/api/docs/save-docs")
      .set("Authorization", `Bearer ${authToken}`)
      .attach("file", filePath);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Date or userId is not defined");

    // Clean up
    require("fs").unlinkSync(filePath);
  });

  it("should return an error if user is not authenticated", async () => {
    const filePath = path.join(__dirname, "testFile.txt");
    require("fs").writeFileSync(filePath, "Test content");

    const res = await request(app)
      .post("/api/docs/save-docs")
      .attach("file", filePath)
      .field("date", new Date().toISOString());

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("User not LoggedIN");

    // Clean up
    require("fs").unlinkSync(filePath);
  });

  it("should fetch documents by date", async () => {
    const testDate = new Date().toISOString();

    // Store a document in the database
    await new DocumentModel({
      fileId: "test123",
      encryptedFileId: "encryptedTest123",
      fileName: "testFile.txt",
      fileType: "text/plain",
      fileSize: 1024,
      uploadedAt: new Date(testDate),
      userId,
    }).save();

    const res = await request(app)
      .post("/api/docs/get-docs")
      .send({ date: testDate });

    expect(res.status).toBe(200);
    expect(res.body.documents.length).toBeGreaterThan(0);
    expect(res.body.documents[0].fileName).toBe("testFile.txt");
  });

  it("should return empty array if no documents match the date", async () => {
    const res = await request(app)
      .post("/api/docs/get-docs")
      .send({ date: "2025-12-31" });

    expect(res.status).toBe(200);
    expect(res.body.documents).toEqual([]);
  });

  it("should return error if date is not provided", async () => {
    const res = await request(app).post("/api/docs/get-docs").send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Date not provided");
  });
});
