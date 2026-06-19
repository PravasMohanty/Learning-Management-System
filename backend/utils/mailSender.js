const nodemailer = require("nodemailer");

require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

console.log("EMAIL_ADDRESS =", process.env.EMAIL_ADDRESS);
console.log("EMAIL_PASSWORD exists =", !!process.env.EMAIL_PASSWORD);

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_ADDRESS,

      to,

      subject,

      text,

      html,
    });

    return info;
  } catch (error) {
    console.error("[SEND EMAIL ERROR]", error);

    throw error;
  }
};

module.exports = sendEmail;