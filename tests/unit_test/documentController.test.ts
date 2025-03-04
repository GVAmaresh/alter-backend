import request from "supertest";
import mongoose from "mongoose";
import express, { Express } from "express";
import { MongoMemoryServer } from "mongodb-memory-server";
import fs from "fs";
import path from "path";
import app from "../../app";
import DocumentModel from "../../models/documentModel";
import UserModel from "../../models/userModel";
import { signToken } from "../../controllers/authController";
import multer from "multer";

const upload = multer({ dest: "uploads/" });
import cookieParser from "cookie-parser";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

let mongoServer: MongoMemoryServer;
let authToken: string;
let server;
let userId: mongoose.Types.ObjectId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  server = app.listen(6010);

  const user = new UserModel({
    userName: "Test User",
    email: "testuser@example.com",
    password: "password123",
    emailVerified: true,
  });

  await user.save();
  userId = user._id;
  authToken = signToken(user._id.toString());

  // app.use(express.json());
  // app.use(express.urlencoded({ extended: true }));
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("Document Controller Tests", () => {
  // it("should store a document successfully", async () => {
  //   const filePath = path.join(__dirname, "testFile.txt");
  //   fs.writeFileSync(filePath, "Test content");

  //   const res = await request(app)
  //     .post("/v1/docs/save-docs?date=2025-03-02T12:00:00Z")
  //     .set("Authorization", `Bearer ${authToken}`)
  //     .attach("file", filePath);

  //   expect(["No file uploaded", "File stored successfully"]).toContain(
  //     res.body.message
  //   );
  //   expect(res.status).toBe(201);
  //   expect(res.body).toHaveProperty("fileId");
  //   expect(res.body).toHaveProperty("encryptedFileId");

  //   fs.unlinkSync(filePath);
  // });

  it("should return error if no file is uploaded", async () => {
    const res = await request(app)
      .post("/v1/docs/save-docs")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ date: new Date().toISOString() });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("No file uploaded");
  });

  it("should return error if date is missing", async () => {
    const filePath = path.join(__dirname, "testFile.txt");
    fs.writeFileSync(filePath, "Test content");

    const res = await request(app)
      .post("/v1/docs/save-docs")
      .set("Authorization", `Bearer ${authToken}`)
      .attach("file", filePath);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Date or userId is not defined");

    fs.unlinkSync(filePath);
  });

  it("should return error if user is not authenticated", async () => {
    const filePath = path.join(__dirname, "testFile.txt");
    fs.writeFileSync(filePath, "Test content");

    const res = await request(app)
      .post("/v1/docs/save-docs?date=2025-03-02T12:00:00Z")
      .attach("file", filePath);
    // .field("date", new Date().toISOString());

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized access");

    fs.unlinkSync(filePath);
  });

  it("should fetch documents by date", async () => {
    const testDate = new Date().toISOString();

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
      .post("/v1/docs/get-docs")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ date: testDate });

    expect(res.status).toBe(200);
    expect(res.body.documents.length).toBeGreaterThan(0);
    expect(res.body.documents[0].fileName).toBe("testFile.txt");
  });

  it("should return empty array if no documents match the date", async () => {
    const res = await request(app)
      .post("/v1/docs/get-docs")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ date: "2025-12-31" });

    expect(res.status).toBe(200);
    expect(res.body.documents).toEqual([]);
  });

  it("should return error if date is not provided", async () => {
    const res = await request(app)
      .post("/v1/docs/get-docs")
      .set("Authorization", `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Date not provided");
  });
});
