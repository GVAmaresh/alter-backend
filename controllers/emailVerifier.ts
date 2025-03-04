import nodemailer from "nodemailer";
import dotenv from "dotenv";
import EmailVerification from "../models/emailVerificationModel";
import { Request, Response } from "express";
import UserModel from "../models/userModel";
import { signToken } from "./authController";

dotenv.config();

const transponder = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email: string): Promise<void> => {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.log("GMAIL_USER and GMAIL_PASS is not extracting from .env");
      return;
    }
    const secret = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const currentEmail = await EmailVerification.findOne({ email });
    if (currentEmail && expiresAt > currentEmail.expiresAt) {
      console.log("OTP is already sent or wait for 10min");
      return;
    }

    if (currentEmail && expiresAt < currentEmail.expiresAt) {
      await EmailVerification.deleteOne({ email });
    }

    const mailOption = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Email Verification",
      text: `Your verification code is: ${secret}. It is valid for 10 minutes.`,
    };
    await transponder.sendMail(mailOption);

    await EmailVerification.create({
      email,
      secret,
      expiresAt,
    });
    console.log("Email verification sent Successfully");
    return;
  } catch (err: any) {
    console.log("Error in Sending Verify Email", err);
    return;
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  if (!res.locals.user) {
    return res.status(401).json({ message: "Unauthorized: No user found" });
  }

  const user = res.locals.user;
  console.log("user = ", res.locals.user);

  const email = user.email;
  const secret = req.body.secret;
  if (!secret || !email) {
    return res.status(400).json({ message: "Email or OTP is not provided" });
  }
  const checkVerified = await UserModel.findOne({ email });

  if (!checkVerified) {
    return res.status(400).json({ message: "User not found" });
  } else if (!checkVerified.emailVerified) {
    return res.status(400).json({ message: "Email already verified" });
  }

  const record = await EmailVerification.findOne({ email, secret });

  if (!record) {
    return res.status(400).json({ message: "Invalid or Expired OTP" });
  }

  if (record.expiresAt && record.expiresAt.getTime() < Date.now()) {
    await EmailVerification.deleteOne({ email });
    return res.status(400).json({ message: "OTP expired" });
  }

  console.log(record);

  await EmailVerification.deleteOne({ email });

  const currentUser = await UserModel.findOne({ email });
  if (!currentUser) {
    return res.status(404).json({ message: "User not found" });
  }

  currentUser.emailVerified = true;
  await currentUser.save();

  const token = signToken(user._id.toString());

  if (
    !currentUser.userName ||
    !currentUser.emergencyContact ||
    !currentUser.gender ||
    !currentUser.dob
  ) {
    return res.status(200).json({
      token,
      verifyEmail: true,
      isCompleteUserDetails: false,
      message: "User details are incomplete",
    });
  }

  return res.status(200).json({ message: "Email Verified Successfully" });
};
