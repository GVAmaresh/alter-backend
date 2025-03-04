import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app'; 
import MasterHealthModel from '../../models/masterHealthModel';
import { MongoMemoryServer } from 'mongodb-memory-server';
import UserModel from '../../models/userModel';
import { signToken } from '../../controllers/authController';

let mongoServer;
let server;
let userId: mongoose.Types.ObjectId;
let authToken: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  server = app.listen(7000);
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
  await mongoose.disconnect();
  await mongoose.connection.close();
  await mongoServer.stop();
  server.close();
});

beforeEach(async () => {
  await MasterHealthModel.deleteMany();
});
describe('Master Health Controller Tests', () => {

  describe('POST /v1/master-health/update-master-health', () => {
    it('should create a new master health report', async () => {
      const user = { _id: new mongoose.Types.ObjectId() };
      
      const response = await request(app)
        .post('/v1/master-health/update-master-health')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tests: [
            { 
              categories: 'Blood Test', 
              parameters: { hemoglobin: 13.5, whiteBloodCell: 4000 }
            }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'New lab report created');
      expect(response.body.report.tests).toHaveLength(1);
    });

    it('should return an error if tests data is missing', async () => {
      const response = await request(app)
        .post('/v1/master-health/update-master-health')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid or missing tests data');
    });
  });

  describe('GET /v1/master-health/update-master-health', () => {
    it('should return master health data for a user', async () => {
      const userId = new mongoose.Types.ObjectId();
      await MasterHealthModel.create({
        userId,
        tests: [
          { 
            categories: 'Blood Test', 
            parameters: { hemoglobin: 14.2, whiteBloodCell: 4200 }
          }
        ]
      });

      const response = await request(app)
        .get('/v1/master-health/get-master-health')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Master Health data is Found');
      // expect(response.body.data).toHaveLength(1);
    });

    it('should return a message when no health data is found', async () => {
      const response = await request(app)
        .get('/v1/master-health/get-master-health')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Master Health data is Found');
    });
  });
});




describe("Master Health API Integration Tests", () => {
  it("should return an error if user is not authenticated", async () => {
    const res = await request(app).get("/v1/master-health/get-master-health");

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
      .post("/v1/master-health/update-master-healt")
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
      .post("/v1/master-health/update-master-healt")
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
      .post("/v1/master-health/update-master-healt")
      .set("Authorization", `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid or missing tests data");
  });

  it("should fetch the master health report", async () => {
    const res = await request(app)
      .get("/v1/master-health/get-master-health")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Master Health data is Found");
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].tests.length).toBe(2); 
  });

  it("should return empty data if no master health report is found", async () => {
    await MasterHealthModel.deleteMany(); 

    const res = await request(app)
      .get("/v1/master-health/get-master-health")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("There is no Master Health is not Found");
  });
});
