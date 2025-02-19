import express from "express";
import { fetchDocumentByDate, storeDocument } from "../controllers/documentController";
const router = express.Router();

router.post("/save-docs", storeDocument)
router.post("/get-docs", fetchDocumentByDate)

router.get("/docs-working", (req, res)=>{
    return res.status(200).json({message: "Working Docs Successfully"})
})

export default router