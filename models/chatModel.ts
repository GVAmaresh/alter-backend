import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
  {
    sender: { type: String, enum: ["chatbot", "user"], required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: { type: String, required: true },
    createdAt: { type: String, default: Date.now },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ChatModel = mongoose.model("Chat", ChatSchema);
export default ChatModel;
