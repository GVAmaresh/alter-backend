import { Request, Response } from "express";
import ChatModel from "../models/chatModel";

export const createChat = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const userId = user._id;
    const { sender, message } = req.body;

    if (!sender || !message) {
      return res
        .status(400)
        .json({ message: "Sender or Message is not provided" });
    }

    const newChat = new ChatModel({ sender, message, userId });
    await newChat.save();

    return res
      .status(201)
      .json({ message: "Chat stored successfully", data: newChat });
  } catch (error) {
    console.error("Error creating chat:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllchat = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const userId = user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 25;
    const skip = (page - 1) * limit;

    let chats = await ChatModel.find({ userId, active: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    if (chats.length === 0) {
      return res.status(200).json({ message: "No chats available", data: [] });
    }
    chats = chats.reverse();

    return res.status(200).json({ message: "Chats retrieved", data: chats });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteChat = async (req: Request, res: Response) => {
  try {
    const user = res.locals.user;
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const userId = user._id;
    const { createdAt } = req.body;

    const chat = await ChatModel.findOne({ userId, createdAt, active: true });

    if (!chat) {
      return res
        .status(200)
        .json({ message: "Chat is already deleted or not found" });
    }

    chat.active = false;
    await chat.save();

    return res.status(200).json({ message: "Chat successfully deleted" });
  } catch (error) {
    console.error("Error deleting chat:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
