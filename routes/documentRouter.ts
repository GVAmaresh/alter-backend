import express from "express";
import { fetchDocumentByDate, storeDocument } from "../controllers/documentController";
import { protect } from "../controllers/authController";
const router = express.Router();

router.post("/save-docs", protect, storeDocument)
router.post("/get-docs", protect,fetchDocumentByDate)

router.get("/docs-working", (req, res)=>{
    return res.status(200).json({message: "Working Docs Successfully"})
})

export default router