import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app"; // Ensure this points to your Express app instance
import MasterHealthModel from "../models/masterHealthModel";
import UserModel from "../models/userModel";

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
  authToken = "mock-auth-token"; // Replace with real token logic if necessary
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("Master Health API Integration Tests", () => {
  it("should return an error if user is not authenticated", async () => {
    const res = await request(app).get("/api/master-health/get-master-health");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("User not found");
  });

  it("should create a new master health report", async () => {
    const healthData = {
      tests: [
        {
          categories: "Blood Test",
          parameters: {
            hemoglobin: 13.5,
            cholesterol: 200,
          },
        },
      ],
    };

    const res = await request(app)
      .post("/api/master-health/update-master-health")
      .set("Authorization", `Bearer ${authToken}`)
      .send(healthData);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("New lab report created");
    expect(res.body.report.tests.length).toBe(1);
    expect(res.body.report.tests[0].categories).toBe("Blood Test");
  });

  it("should update an existing master health report", async () => {
    const updatedHealthData = {
      tests: [
        {
          categories: "Blood Test",
          parameters: {
            hemoglobin: 14.0, // Updated value
            cholesterol: 180, // Updated value
          },
        },
        {
          categories: "Liver Function Test",
          parameters: {
            bilirubin: 1.2,
          },
        },
      ],
    };

    const res = await request(app)
      .post("/api/master-health/update-master-health")
      .set("Authorization", `Bearer ${authToken}`)
      .send(updatedHealthData);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Lab report updated");
    expect(res.body.report.tests.length).toBe(2); // New category should be added
    expect(res.body.report.tests[0].parameters.hemoglobin).toBe(14.0);
    expect(res.body.report.tests[1].categories).toBe("Liver Function Test");
  });

  it("should return an error if no tests data is provided", async () => {
    const res = await request(app)
      .post("/api/master-health/update-master-health")
      .set("Authorization", `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid or missing tests data");
  });

  it("should fetch the master health report", async () => {
    const res = await request(app)
      .get("/api/master-health/get-master-health")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Master Health data is Found");
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].tests.length).toBe(2); 
  });

  it("should return empty data if no master health report is found", async () => {
    await MasterHealthModel.deleteMany(); 

    const res = await request(app)
      .get("/api/master-health/get-master-health")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("There is no Master Health is not Found");
  });
});
