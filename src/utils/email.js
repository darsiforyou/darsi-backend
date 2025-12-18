// src/utils/email.js
const nodemailer = require("nodemailer"); 
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: 'darsiforyou@gmail.com',
    pass: 'tehhncbwmzapywvp'
  },
});

// ✅ CommonJS export ONLY
const sendEmail = async ({ to, subject, html, replyTo }) => {
  return transporter.sendMail({
   from: `"Darsi Ecommerce" <darsiforyou@gmail.com>"`,
    to,
    replyTo,
    subject,
    html,
  });
};

module.exports = { sendEmail };

