const User = require("../models/user");
const OTP = require("../models/otp");
const bcrypt = require("bcrypt");
const send_email = require("../middleware/email");
const { sendEmail } = require("../utils/email");


// ==================== GENERATE 4-DIGIT OTP ====================
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
}

// ==================== FORGOT PASSWORD (SEND OTP) ====================


const forgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    // ✅ Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User doesn't exist" });

    // ✅ Only allow Admin or Referrer
    if (!["Admin", "Referrer"].includes(user.role)) {
      return res.status(403).json({ message: "You are not authorized to reset password" });
    }

    // ✅ Generate OTP
    const otp = generateOTP();

    // ✅ Save OTP in DB
    await OTP.create({
      otp,
      isActive: true,
      email,
    });

    // ✅ Prepare email
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h3 style="color: #33A137;">Darsi Password Reset OTP</h3>
        <p>Please use the following OTP to reset your password:</p>
        <h2 style="background: #f1f1f1; padding: 10px; text-align: center; border-radius: 5px;">${otp}</h2>
        <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>Darsi Team</p>
      </div>
    `;

    // ✅ Send OTP email
    await sendEmail({ to: email, subject: "Darsi - Forgot Your Password", html: emailContent });

    res.status(200).json({ message: "OTP has been sent to your email address" });
  } catch (err) {
    console.error("Forgot password OTP error:", err);
    res.status(500).json({ message: "Server error" });
  }
};




// ==================== VERIFY OTP ====================
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await OTP.findOne({ email, otp, isActive: true });
    if (!otpRecord) return res.status(400).json({ message: "Invalid or expired OTP" });

    otpRecord.isActive = false;
    await otpRecord.save();

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ==================== RESET PASSWORD ====================
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) return res.status(400).json({ message: "Invalid or expired OTP" });

    otpRecord.isActive = false;
    await otpRecord.save();

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await User.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  forgotPasswordOtp,
  verifyOtp,
  resetPassword,
   
};
