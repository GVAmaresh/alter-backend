import express from "express";
import { emailPasswordVerify, protect} from "../controllers/authController";
import { verifyEmail } from "../controllers/emailVerifier";
const router = express.Router();


router.post("/login-signup", emailPasswordVerify)

router.get("/user-working", (req, res)=>{
    return res.status(200).json({message: "Working User Successfully"})
})

router.post("/verify-email", protect, verifyEmail)

export default router