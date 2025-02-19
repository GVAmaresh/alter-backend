import { Request, Response, NextFunction } from "express";
import UserModel from "../models/userModel";
import * as jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "./emailVerifier";

dotenv.config();



const signToken = (id: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined");
  const expire = process.env.JWT_EXPIRES_IN;
  if (!expire) throw new Error("JWT_EXPIRE is not defined ");
  return jwt.sign({ id }, (secret as string), {
    expiresIn: "9d",
  });
};

export const emailPasswordVerify = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "Email or Password is missing" });
      return;
    }

    let user = await UserModel.findOne({ email }).select("+password");

    if (!user) {
      const newUser = new UserModel({ email, password });
      await newUser.save();

      const token = signToken(newUser._id.toString());
      await sendVerificationEmail(email);

      res.status(201).json({
        token,
        verifyEmail: false,
        message: "Email verification has been sent",
      });
      return;
    }

    if (!bcrypt.compare(password, user.password)) {
      res.status(401).json({
        isCorrectPassword: false,
        message: "Incorrect password",
      });
      return;
    }

    if (!user.emailVerified) {
      const token = signToken(user._id.toString());
      await sendVerificationEmail(email);

      res.status(201).json({
        token,
        verifyEmail: false,
        message: "Email verification has been sent",
      });
      return;
    }

    if (!user.userName || !user.emergencyContact || !user.gender || !user.dob) {
      const token = signToken(user._id.toString());

      res.status(400).json({
        token,
        isCompleteUserDetails: false,
        message: "User details are incomplete",
      });
      return;
    }

    const token = signToken(user._id.toString());
    res.status(200).json({
      isValid: true,
      message: "User is valid",
      token,
    });
  } catch (err) {
    console.error("Error verifying email and password", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      res.status(401).json({ message: "Unauthorized access" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
    };

    const currentUser = await UserModel.findById(decoded.id);
    if (!currentUser) {
      res.status(401).json({ message: "User no longer exists" });
      return;
    }
    res.locals.user = currentUser;
    next();
  } catch (err) {
    console.error("Error in protect middleware", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
