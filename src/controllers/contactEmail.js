// controllers/contactController.js
const { sendEmail } = require("../utils/email");

const contactUs = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const htmlContent = `
      <h2>New Contact Request</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong><br/> ${message}</p>
    `;

    await sendEmail({
      to: "darsiforyou@gmail.com", // your inbox
      subject: `Contact Us Form - ${name}`,
      html: htmlContent,
      replyTo: email,
    });

    return res.status(200).json({ message: "Email sent successfully!" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to send email" });
  }
};

module.exports = { contactUs };
