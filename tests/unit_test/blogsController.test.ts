import request from "supertest";
import express from "express";
import { getBlogs } from "../../controllers/blogsController";
import fs from "fs";

jest.mock("fs");

const app = express();
app.get("/blogs", getBlogs);

describe("GET /blogs", () => {
  it("should return blogs successfully", async () => {
    const mockData = JSON.stringify([
      {
        "photo_url": "https://example.com/image1.jpg",
        "heading": "Understanding AI in 2025",
        "description": "A deep dive into how artificial intelligence is evolving in 2025.",
        "date": "2025-02-15"
      }
    ]);

    (fs.readFile as any).mockImplementation((_filePath, _encoding, callback) => {
      callback(null, mockData);
    });

    const response = await request(app).get("/blogs");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Blogs retrieved successfully");
    expect(response.body).toHaveProperty("data");
    expect(response.body.data.length).toBe(1);
  });

  it("should return 500 if file reading fails", async () => {
    (fs.readFile as any).mockImplementation((_filePath, _encoding, callback) => {
      callback(new Error("File read error"), null);
    });

    const response = await request(app).get("/blogs");

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Internal server error");
  });

  it("should return 500 if JSON is invalid", async () => {
    (fs.readFile as any).mockImplementation((_filePath, _encoding, callback) => {
      callback(null, "Invalid JSON");
    });

    const response = await request(app).get("/blogs");

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message", "Invalid JSON format in blogs.json");
  });
});
