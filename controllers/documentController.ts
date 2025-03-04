import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Request, Response } from "express";
import DocumentModel from "../models/documentModel";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export const storeDocument = async (
  req: MulterRequest,
  res: Response
): Promise<void> => {
  try {
    let date;
    if (req.body.date) date = req.body.date;
    if (req.query.date) date = req.query.date;

    const file = req.file;
    console.log("Request Body:", req.body);
    console.log("Uploaded File:", req.file);
    console.log("User:", res.locals.user);
    if (!date) {
      res.status(400).json({ message: "Date or userId is not defined" });
      return;
    }
    if (!file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const user = res.locals.user;
    if (!user) {
      res.status(401).json({ message: "User not LoggedIN" });
      return;
    }
    const userId = user._id;
    const fileId = crypto.randomBytes(16).toString("hex");
    const salt = crypto.randomBytes(8).toString("hex");

    const encryptedFileId = crypto
      .createHash("sha256")
      .update(fileId + salt)
      .digest("hex");

    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(
      uploadDir,
      `${fileId}${path.extname(file.originalname)}`
    );

    try {
      fs.writeFileSync(filePath, file.buffer);
    } catch (fileError) {
      console.error("File write error:", fileError);
      res.status(500).json({ message: "Error saving file" });
      return;
    }

    const document = new DocumentModel({
      fileId,
      encryptedFileId,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadedAt: new Date(date),
      userId,
    });

    await document.save();

    res
      .status(201)
      .json({ message: "File stored successfully", fileId, encryptedFileId });

    return;
  } catch (error: any) {
    console.error("Error storing file:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const fetchDocumentByDate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { date } = req.body;
    if (!date) {
      res.status(400).json({ message: "Date not provided" });
      return;
    }
    const user = res.locals.user;
    if (!user) {
      res.status(401).json({ message: "User not LoggedIN" });
      return;
    }
    const searchDate = new Date(date);
    const documents = await DocumentModel.find({
      uploadedAt: {
        $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
        $lt: new Date(searchDate.setHours(23, 59, 59, 999)),
      },
    });
    res.status(200).json({ documents });
    return;
  } catch (err: any) {
    console.error("Error fetching file: ", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
