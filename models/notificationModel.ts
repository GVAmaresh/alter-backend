import mongoose from "mongoose";

import cron from "node-cron";

const NotificationSchema = new mongoose.Schema(
  {
    heading: { type: String, required: true },
    description: { type: String, required: true },
    alertLevel: {
      type: String,
      enum: ["red", "yellow", "green", "normal"],
      default: "normal",
    },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date, index: { expires: 0 } },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

NotificationSchema.methods.isExpired = function () {
  return this.endTime && this.endTime < new Date();
};

NotificationSchema.statics.getActiveNotifications = function () {
  return this.find({ endTime: { $gt: new Date() } });
};

const NotificationModel = mongoose.model("Notification", NotificationSchema);

export default NotificationModel;
