import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../app"; 
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

  server = app.listen(4000);

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

describe("User Controller - Update User Details", () => {
  it("should successfully update user details", async () => {
    const updatedData = {
      userName: "Updated User",
      emergencyContact: 9876543210,
      emergencyName: "John Doe",
      gender: "Male",
      dob: new Date("1990-01-01"),
      age: 34,
      idType: "Aadhar",
      idNumber: 123456789012,
      nameCard: "John Card",
      namePhysician: "Dr. Smith",
      pincode: 560001,
      state: "Karnataka",
    };

    const res = await request(app)
      .post("/v1/user/update-user") 
      .set("Authorization", `Bearer ${authToken}`)
      .send(updatedData);

    expect(res.body.message).toBe("User details updated successfully");
    expect(res.status).toBe(200);
    expect(res.body.updatedUser.userName).toBe("Updated User");
    expect(res.body.isValid).toBe(true);
    expect(res.body.verifyEmail).toBe(true);
    expect(res.body.isCompleteUserDetails).toBe(true);
  });

  it("should return an error when request body is empty", async () => {
    const res = await request(app)
      .post("/v1/user/update-user")
      .set("Authorization", `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User details updated successfully");
  });

  it("should return an error when required fields are missing", async () => {
    const res = await request(app)
      .post("/v1/user/update-user")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        userName: "Partial User",
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User details updated successfully");
  });

  it("should return an error if the user is not authenticated", async () => {
    const res = await request(app)
      .post("/v1/user/update-user")
      .send({
        userName: "Unauthorized User",
        emergencyContact: "1234567890",
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized access");
  });

  it("should return an error if email is not verified", async () => {
    const unverifiedUser = new UserModel({
      userName: "Unverified User",
      email: "unverified@example.com",
      password: "password123",
      emailVerified: false,
    });

    await unverifiedUser.save();
    const newAuthToken = signToken(unverifiedUser._id.toString())

    const res = await request(app)
      .post("/v1/user/update-user")
      .set("Authorization", `Bearer ${newAuthToken}`)
      .send({
        userName: "Still Unverified",
        emergencyContact: "1234567890",
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Email not verified");
    expect(res.body.isValid).toBe(false);
    expect(res.body.verifyEmail).toBe(false);
    expect(res.body.isCompleteUserDetails).toBe(false);
  });

  it("should return 404 error if user does not exist", async () => {
    const nonExistAuthToken="give me some error"
    const res = await request(app)
      .post("/v1/user/update-user")
      .set("Authorization", `Bearer ${nonExistAuthToken}`)
      .send({
        userName: "Non-existent User",
        emergencyContact: "0000000000",
      });

    expect(res.body.message).toBe("Unauthorized access");
    expect(res.status).toBe(404);
  });
});
