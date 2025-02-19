import { Request, Response } from "express";
import NotificationModel from "../models/notificationModel";

export const createNotification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      heading,
      description,
      alertLevel = "normal",
      startTime = new Date(),
      endTime,
    } = req.body;
    if (!heading || !description) {
      res.status(400).json({ message: "Heading or description is not given" });
      return;
    }
    const user = res.locals.user;
    if (!user) {
      res.status(400).json({ message: "User not found" });
    }
    const userId = user._id;
    const notification = new NotificationModel({
      heading,
      description,
      alertLevel,
      startTime,
      userId,
      endTime,
    });
    await notification.save();
    res.status(200).json({ message: "Successfully Message has been saved" });
    return;
  } catch (err: any) {
    console.log("Error in the notification: ", err);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
};

export const getAllNotification = async (req: Request, res: Response) => {
  const user = res.locals.user;
  if (!user) {
    res.status(400).json({ message: "User not found" });
  }
  const userId = user._id;
  console.log(userId);
  const notifications = await NotificationModel.find({ userId });
  if (!notifications) {
    res
      .status(200)
      .json({ message: "User do not have any notification", data: {} });
    return;
  }
  res.status(200).json({
    message: `There are ${notifications.length} are there`,
    data: { notifications },
  });
  return;
};
