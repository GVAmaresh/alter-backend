import express from "express";
import { protect } from "../controllers/authController";
import {
  createChat,
  deleteChat,
  getAllchat,
} from "../controllers/chatBotController";

const router = express.Router();

router.use(protect);

router.post("/create-chat", createChat);
router.get("/get-chat", getAllchat);
router.post("/delete-chat", deleteChat);

export default router;
