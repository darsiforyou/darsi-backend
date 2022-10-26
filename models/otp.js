const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const otp = Schema(
  {
    otp: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    email: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OTP", otp);
