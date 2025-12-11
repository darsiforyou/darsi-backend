const User = require("../models/user");
const OTP = require("../models/otp");
const { searchInColumns, getQuery } = require("../utils");
const bcrypt = require("bcrypt");
const send_email = require("../middleware/email");
const imagekit = require("../config/imagekit");
const { distributeReferralCommission } = require("./registerController");

/* ----------------------------------------------
   GET ALL USERS WITH PAGINATION & SEARCH
------------------------------------------------*/
const getAllUsers = async (req, res) => {
  try {
    let { page, limit, search, ...queries } = req.query;
    search = searchInColumns(search, ["firstname", "lastname"]);
    queries = getQuery(queries);

    let myAggregate;
    if (!search) {
      myAggregate = User.aggregate([
        { $match: { $and: [queries] } },
        {
          $lookup: {
            from: "referral_packages",
            localField: "referral_package",
            foreignField: "_id",
            as: "packageName"
          }
        }
      ]);
    } else {
      myAggregate = User.aggregate([
        { $match: { $and: [{ $or: search }, queries] } },
        {
          $lookup: {
            from: "referral_packages",
            localField: "referral_package",
            foreignField: "_id",
            as: "packageName"
          }
        }
      ]);
    }

    const options = {
      page: page || 1,
      limit: limit || 10,
      sort: { createdAt: -1 }
    };

    const data = await User.aggregatePaginate(myAggregate, options);

    return res.status(200).send({
      message: "Successfully fetched Users",
      data: data
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ----------------------------------------------
   GET USER BY ID
------------------------------------------------*/
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send({ error: "User not found" });
    return res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ----------------------------------------------
   GET USER BY REFERRAL CODE
------------------------------------------------*/
const getUserWithRefCode = async (req, res) => {
  try {
    const user = await User.findOne({ user_code: req.params.code }).select(
      "_id firstname lastname email role user_code referral_package"
    );
    if (!user) return res.status(404).send({ error: "User not found" });
    return res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ----------------------------------------------
   GET ALL USERS WITHOUT FILTER
------------------------------------------------*/
const getAllUsersWithoutFilter = async (req, res) => {
  try {
    let query = getQuery(req.query);
    const users = await User.find(query).select(
      "_id firstname lastname email role user_code"
    );
    return res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ----------------------------------------------
   DELETE USER
------------------------------------------------*/
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User has been deleted..." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ----------------------------------------------
   UPDATE USER + PAYMENT STATUS HANDLING
------------------------------------------------*/
const updateUser = async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      password,
      email,
      role,
      referral_payment_status
    } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const prevPaymentStatus = user.paymentStatus;

    const updateUser = {
      firstname,
      lastname,
      role: role || "Customer",
      email,
    };

    // PAYMENT STATUS CHANGE HANDLING
    if (referral_payment_status) {
      updateUser.paymentStatus =
        referral_payment_status === "Paid" ? "PAID" : "UNPAID";
    }

    // UPDATE PASSWORD IF PROVIDED
    if (password) {
      const hashedPwd = await bcrypt.hash(password, 10);
      updateUser.password = hashedPwd;
    }

    const updated = await User.findByIdAndUpdate(user._id, updateUser, { new: true });

    // 🔥 IF STATUS CHANGED TO PAID → DISTRIBUTE COMMISSION
    if (prevPaymentStatus !== "PAID" && updated.paymentStatus === "PAID") {
      await distributeReferralCommission(updated._id);
      console.log("Commission distributed because admin changed status to PAID.");
    }

    return res.status(200).json({
      message: "User has been updated",
      data: updated
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ----------------------------------------------
   FORGOT PASSWORD OTP
------------------------------------------------*/
function generateOTP() {
  let digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 4; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

const forgotPasswordOtp = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(203).json({ message: "User doesn't exist" });

    let otp = generateOTP();
    let otp_data = await OTP.create({
      otp,
      isActive: true,
      email: req.params.email
    });

    if (otp_data.id) {
      let emailInput = {
        subject: "Forgot your password",
        html: `<strong>Please enter the following OTP to Change your password: ${otp} </strong>`
      };
      await send_email(req.params.email, emailInput);

      res.status(200).json({
        message: "OTP has been sent to your email address"
      });
    } else {
      return res.status(500).json({ error: "Something went wrong" });
    }

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ----------------------------------------------
   CHANGE PASSWORD
------------------------------------------------*/
const changeUserPassword = async (req, res) => {
  try {
    const { user_email, otp_code, new_password } = req.body;
    const otp = await OTP.findOne({ otp: otp_code });
    const user = await User.findOne({ email: user_email });

    if (!otp) return res.status(203).json({ message: "OTP is invalid" });
    if (!user) return res.status(203).json({ message: "User doesn't exist" });

    const hashedPwd = await bcrypt.hash(new_password, 10);
    await User.findByIdAndUpdate(user._id, { password: hashedPwd });

    res.status(200).json({
      message: "Password has been updated"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllUsers,
  getUser,
  getAllUsersWithoutFilter,
  getUserWithRefCode,
  deleteUser,
  updateUser,
  forgotPasswordOtp,
  changeUserPassword
};
