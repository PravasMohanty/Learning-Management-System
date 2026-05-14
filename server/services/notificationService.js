const Notification = require("../models/Notification");
const { mailer } = require("../config/mail");
exports.createNotification = async (user, payload, io) => {
  const doc = await Notification.create({ user, ...payload });
  io?.to(String(user)).emit("notification:new", doc);
  return doc;
};
exports.sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.SMTP_HOST) return { skipped: true };
  return mailer().sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
    text,
  });
};
