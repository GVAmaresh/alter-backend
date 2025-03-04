import express, { Request, Response } from "express";
import { emailPasswordVerify, protect } from "../controllers/authController";
import { verifyEmail } from "../controllers/emailVerifier";
import { updateUserDetails } from "../controllers/userController";
const router = express.Router();

router.post("/login-signup", emailPasswordVerify);

router.get("/verify-token", protect, (req: Request, res: Response) => { 
    try {
      const user = res.locals.user;
      if (!user) {
        return res.status(401).json({ isValid: false, message: "User not logged in" });
      }
      res.status(200).json({ isValid: true, message: "User logged in successfully", user });
    } catch (err: any) {
      console.error("Token verification error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
  

router.get("/user-working", (req, res) => {
  return res.status(200).json({ message: "Working User Successfully" });
});

router.post("/verify-email", protect, verifyEmail);

router.post("/update-user", protect, updateUserDetails);

export default router;
