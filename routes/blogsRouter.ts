import express from "express";
import { getBlogs } from "../controllers/blogsController";
import { protect } from "../controllers/authController";

const router = express.Router();

router.use(protect)
router.get("/who-blogs", getBlogs);

export default router;
