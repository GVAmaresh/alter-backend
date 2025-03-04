import express from "express";
import { protect } from "../controllers/authController";
import {
  createNotification,
  getAllNotification,
} from "../controllers/notificationController";

const router = express.Router();

router.get("/get-notifications", protect, getAllNotification);
router.post("/create-notification", protect, createNotification);
// router.post("/delete-notification", protect)

export default router;
