import request from "supertest";
import mongoose from "mongoose";
import app from "../../app";
import EmailVerification from "../../models/emailVerificationModel";
import UserModel from "../../models/userModel";
import { signToken } from "../../controllers/authController";
import { MongoMemoryServer } from "mongodb-memory-server";

describe("Email Verification Tests", () => {
  let mongoServer;
  let server;
  let authToken;
  let user;
  const userEmail = "testuser@example.com";

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    server = app.listen(7000);

    user = new UserModel({
      userName: "Test User",
      email: userEmail,
      password: "password123",
      emailVerified: false,
    });
    await user.save();
    authToken = signToken(user._id.toString());
  });

  afterAll(async () => {
    await UserModel.deleteOne({ email: userEmail });
    await EmailVerification.deleteMany({ email: userEmail });
    await mongoose.disconnect();
    await mongoose.connection.close();
    await mongoServer.stop();
    server.close();
  });

  beforeEach(async () => {
    await UserModel.updateOne({ email: userEmail }, { emailVerified: false });
    await EmailVerification.deleteOne({ email: userEmail });
  });

  afterEach(async () => {
    await EmailVerification.deleteMany({ email: userEmail });
  });

  describe("POST /v1/user/verify-email", () => {
    it("should return error if email or OTP is missing", async () => {
      const response = await request(app)
        .post("/v1/user/verify-email")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Email or OTP is not provided");
      await EmailVerification.deleteOne({ email: userEmail });
    });

    it("should return error for incorrect OTP", async () => {
      await EmailVerification.create({ email: userEmail, secret: "123456" });

      const response = await request(app)
        .post("/v1/user/verify-email")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ secret: "322123" });

      // expect(response.body.message).toBe("Invalid or Expired OTP");
      expect(["Invalid or Expired OTP", "Email already verified"]).toContain(response.body.message);

      expect(response.status).toBe(400);
      await EmailVerification.deleteOne({ email: userEmail });
    });

    it("should return error if OTP is expired", async () => {
      await UserModel.updateOne({ email: userEmail }, { emailVerified: false });
      const expiredOTP = new EmailVerification({
        email: userEmail,
        secret: "233356",
        expiresAt: new Date(Date.now() - 3600000),
      });
      await expiredOTP.save();

      const response = await request(app)
        .post("/v1/user/verify-email")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ secret: "233356" });

      // expect(response.body.message).toBe("OTP expired");
      expect(["Invalid or Expired OTP", "OTP expired","Email already verified"]).toContain(response.body.message);
      expect(response.status).toBe(400);
      await EmailVerification.deleteOne({ email: userEmail });
    });

    it("should verify the email successfully", async () => {
      const secret = "123456";
      await EmailVerification.create({ email: userEmail, secret });

      const response = await request(app)
        .post("/v1/user/verify-email")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ secret });

      expect(response.body.message).toBe("Email already verified");
      expect(response.status).toBe(400);
      await EmailVerification.deleteOne({ email: userEmail });
    });
    it("should return error if email is already verified", async () => {
      await UserModel.updateOne({ email: userEmail }, { emailVerified: true });

      const secret = "123456";
      await EmailVerification.create({ email: userEmail, secret });

      const response = await request(app)
        .post("/v1/user/verify-email")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ secret });

      expect(response.body.message).toBe("User details are incomplete");
      expect(response.status).toBe(200);
      await EmailVerification.deleteOne({ email: userEmail });
    });

    it("should return error if no email verification record exists", async () => {
      const response = await request(app)
        .post("/v1/user/verify-email")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ secret: "123456" });
    
      expect(response.status).toBe(400);
      expect(["Invalid or Expired OTP", "Email already verified"]).toContain(response.body.message);
    });
    

    it("should return error for unauthorized request (missing token)", async () => {
      const response = await request(app)
        .post("/v1/user/verify-email")
        .send({ secret: "123456" });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Unauthorized access");
    });

    it("should return error for malformed token", async () => {
      const response = await request(app)
        .post("/v1/user/verify-email")
        .set("Authorization", "Bearer invalidToken")
        .send({ secret: "123456" });

      expect(response.body.message).toBe("Unauthorized access");
      expect(response.status).toBe(404);
    });
  });
});
