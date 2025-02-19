import cron from "node-cron";
import NotificationModel from "../models/notificationModel";

const processExpiredNotifications = async () => {
  try {
    console.log("🔍 Checking for expired notifications...");

    const expiredNotifications = await NotificationModel.find({
      status: "active",
      endTime: { $lte: new Date() },
    });

    if (expiredNotifications.length > 0) {
      console.log(`Found ${expiredNotifications.length} expired notifications.`);

      for (let notification of expiredNotifications) {
        console.log(`Expiring: ${notification.heading}`);

        await NotificationModel.updateOne(
          { _id: notification._id },
          { $set: { status: "expired" } }
        );
      }
    } else {
      console.log("No expired notifications found.");
    }
  } catch (error) {
    console.error(" Error in cron job:", error);
  }
};

cron.schedule('0 0 * * *', processExpiredNotifications);

export default processExpiredNotifications;
