import express from "express";
import { protect } from "../controllers/authController";
import {
  createMasterHealth,
  getMasterHealth,
} from "../controllers/masterHealthController";
const router = express.Router();

router.use(protect);
router.get("/get-master-health", getMasterHealth);
router.post("/update-master-health", createMasterHealth);
export default router;
