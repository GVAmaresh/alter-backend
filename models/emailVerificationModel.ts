import mongoose from "mongoose";
const EmailVerificationSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  secret: { type: Number, required: true },
  expiresAt: { type: Date, required: true, expires: 600 },
},{ timestamps: true });
const EmailVerification = mongoose.model(
  "EmailVerification",
  EmailVerificationSchema
);
export default EmailVerification;
