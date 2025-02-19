import mongoose, { Schema, Document } from "mongoose";

interface IDocument extends Document {
  fileId: string;
  encryptedFileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  userId: mongoose.Schema.Types.ObjectId;
  metaData: Record<string, any>;
}

const DocumentSchema: Schema<IDocument> = new Schema(
  {
    fileId: { type: String, required: true },
    encryptedFileId: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadedAt: { type: Date, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    metaData: { type: Object },
  },
  { timestamps: true }
);

const DocumentModel = mongoose.model<IDocument>("Document", DocumentSchema);

export default DocumentModel;
