// src/utils/email.js
const nodemailer = require("nodemailer"); 
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: 'Landdostmedia@gmail.com',
    pass: 'uyxbhkpnpewvvwrk'
  },
});

// ✅ CommonJS export ONLY
const sendEmail = async ({ to, subject, html, replyTo }) => {
  return transporter.sendMail({
   from: `"Darsi Ecommerce" <Landdostmedia@gmail.com>"`,
    to,
    replyTo,
    subject,
    html,
  });
};

module.exports = { sendEmail };

