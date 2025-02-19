import nodemailer from "nodemailer";
import dotenv from "dotenv";
import EmailVerification from "../models/emailVerificationModel";
import { Request, Response } from "express";
import UserModel from "../models/userModel";

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
  try{

    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.log("GMAIL_USER and GMAIL_PASS is not extracting from .env")
      return 
    }
    
    const secret = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const currentEmail = EmailVerification.findOne({ email });
  if (!currentEmail) {
    console.log("OTP is already sent or wait for 10min");
    return;
  }

  const mailOption = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Email Verification',
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
}catch(err:any){

  console.log("Error in Sending Verify Email", err)
  return
}
};

export const verifyEmail = async (req: Request, res: Response) => {
  if (!res.locals.user) {
    return res.status(401).json({ message: "Unauthorized: No user found" });
  }

  console.log(res.locals.user);

  const user = res.locals.user;
  const email = user.email;
  const secret = req.body.secret;

  const record = await EmailVerification.findOne({ email, secret });

  if (!record) {
    res.status(400).json({ message: "Invalid or Expired Token" });
    return;
  }
  await EmailVerification.deleteOne({ email });

  const currentUser = await UserModel.findOne({ email });
  currentUser.emailVerified = true;
  await currentUser.save();

  res.status(200).json({ message: "Email Verified Successfully" });

  return;
};
