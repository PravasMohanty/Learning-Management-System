const Notification = require("../models/Notification");
const ApiError = require("../utils/ApiError");
const logger = require("../config/logger");

exports.createNotification = async (userId, data) => {
  const notification = await Notification.create({
    user: userId,
    type: data.type,
    title: data.title,
    message: data.message,
    link: data.link,
    read: false,
  });

  return notification;
};

exports.broadcastNotification = async (users, data) => {
  const notifications = await Notification.insertMany(
    users.map((userId) => ({
      user: userId,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
      read: false,
    }))
  );

  logger.info("Broadcast notification sent", { userCount: users.length, type: data.type });

  return notifications;
};

exports.getUserNotifications = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ user: userId }).sort("-createdAt").skip(skip).limit(limit),
    Notification.countDocuments({ user: userId }),
    Notification.countDocuments({ user: userId, read: false }),
  ]);

  return { items: notifications, total, unreadCount, page, limit };
};

exports.markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOne({ _id: notificationId, user: userId });
  if (!notification) throw new ApiError(404, "Notification not found");

  notification.read = true;
  await notification.save();

  return notification;
};

exports.markAllAsRead = async (userId) => {
  await Notification.updateMany({ user: userId, read: false }, { read: true });
  return { success: true, message: "All notifications marked as read" };
};

exports.deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findOneAndDelete({ _id: notificationId, user: userId });
  if (!notification) throw new ApiError(404, "Notification not found");

  return { success: true, message: "Notification deleted" };
};

exports.deleteAllNotifications = async (userId) => {
  await Notification.deleteMany({ user: userId });
  return { success: true, message: "All notifications deleted" };
};
