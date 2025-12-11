const User = require("../models/user");
const OTP = require("../models/otp");
const Package = require("../models/referral_packages");
const Milestone = require("../models/milestone");
const Financial = require("../models/financial");
const { searchInColumns, getQuery } = require("../utils");
const bcrypt = require("bcrypt");
const send_email = require("../middleware/email");
const imagekit = require("../config/imagekit");

/* -----------------------------------
   GET ALL USERS WITH PAGINATION & SEARCH
----------------------------------- */
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

    res.status(200).json({
      message: "Successfully fetched users",
      data
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

/* -----------------------------------
   GET SINGLE USER BY ID
----------------------------------- */
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

/* -----------------------------------
   GET SINGLE USER BY REFERRAL CODE
----------------------------------- */
const getUserWithRefCode = async (req, res) => {
  try {
    const user = await User.findOne({ user_code: req.params.code }).select(
      "_id firstname lastname email role user_code referral_package"
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

/* -----------------------------------
   GET ALL USERS WITHOUT PAGINATION
----------------------------------- */
const getAllUsersWithoutFilter = async (req, res) => {
  try {
    const query = getQuery(req.query);
    const users = await User.find(query).select("_id firstname lastname email role user_code");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

/* -----------------------------------
   DELETE USER
----------------------------------- */
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User has been deleted" });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

/* -----------------------------------
   UPDATE USER AND APPLY MLM LOGIC ON PAYMENT
----------------------------------- */
const updateUser = async (req, res) => {
  try {
    const { firstname, lastname, password, email, role, referral_payment_status } = req.body;
    const user = await User.findById(req.params.id);
    const file = req.file;

    if (!user) return res.status(404).json({ message: "User not found" });

    // Check duplicate email
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) return res.status(409).json({ message: "Email already exists" });
    }

    // Prepare update object
    const updatedUser = {
      firstname: firstname || user.firstname,
      lastname: lastname || user.lastname,
      role: role || user.role,
      email: email || user.email,
      referral_payment_status: referral_payment_status === "Paid" ? true : false,
    };

    if (password) {
      const hashedPwd = await bcrypt.hash(password, 10);
      updatedUser.password = hashedPwd;
    }

    // Update user first
    let data = await User.findByIdAndUpdate(req.params.id, updatedUser, { new: true });

    // Handle image upload if provided
    if (file) {
      if (data.imageId) await imagekit.deleteFile(data.imageId);
      const img = await imagekit.upload({
        file: file.buffer,
        fileName: file.originalname,
      });
      data = await User.findByIdAndUpdate(
        data._id,
        { imageURL: img.url, imageId: img.fileId },
        { new: true }
      );
    }

    // -------------------------------
    // MLM Commission Logic (run only if payment status just became PAID)
    // -------------------------------
    if (referral_payment_status === "Paid" && user.referral_payment_status === false) {
      const paidUser = await User.findById(req.params.id);
      const package = await Package.findById(paidUser.referral_package);
      const milestone = await Milestone.findOne();
      const packagePrice = package.price;

      // LEVEL 1
      const ref1 = await User.findOne({ user_code: paidUser.referred_by });
      let ref1Commission = 0, ref2Commission = 0, ref3Commission = 0;

      if (ref1 && ref1.paymentStatus === "PAID") {
        ref1Commission = (packagePrice * milestone.levelOne) / 100;
        await Financial.create({
          user: ref1._id,
          package: package._id,
          amount: ref1Commission,
          type: "PACKAGE",
        });
      }

      // LEVEL 2
      let ref2;
      if (ref1) ref2 = await User.findOne({ user_code: ref1.referred_by });
      if (ref2 && ref2.paymentStatus === "PAID") {
        ref2Commission = (packagePrice * milestone.levelTwo) / 100;
        await Financial.create({
          user: ref2._id,
          package: package._id,
          amount: ref2Commission,
          type: "PACKAGE",
        });
      }

      // LEVEL 3
      let ref3;
      if (ref2) ref3 = await User.findOne({ user_code: ref2.referred_by });
      if (ref3 && ref3.paymentStatus === "PAID") {
        ref3Commission = (packagePrice * milestone.levelThree) / 100;
        await Financial.create({
          user: ref3._id,
          package: package._id,
          amount: ref3Commission,
          type: "PACKAGE",
        });
      }

      // ADMIN AMOUNT
      const totalPercentage = milestone.levelOne + milestone.levelTwo + milestone.levelThree;
      const adminAmount = packagePrice - (packagePrice * totalPercentage) / 100;
      await Financial.create({
        darsi: true,
        package: package._id,
        amount: adminAmount,
        type: "PACKAGE",
      });

      // Update user payment status
      await User.findByIdAndUpdate(req.params.id, { paymentStatus: "PAID" });
    }

    res.status(200).json({
      message: "User updated successfully. MLM commissions applied if payment marked Paid",
      data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

/* -----------------------------------
   OTP GENERATION FOR PASSWORD RESET
----------------------------------- */
function generateOTP() {
  const digits = "0123456789";
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

    const otp = generateOTP();
    const otp_data = await OTP.create({
      otp,
      isActive: true,
      email: req.params.email
    });

    if (otp_data.id) {
      const emailInput = {
        subject: "Forgot your password",
        html: `<strong>Please enter the following OTP to change your password: ${otp}</strong>`
      };
      await send_email(req.params.email, emailInput);
      res.status(200).json({ message: "OTP sent to your email address" });
    } else {
      res.status(500).json({ error: "Something went wrong" });
    }
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

/* -----------------------------------
   CHANGE USER PASSWORD
----------------------------------- */
const changeUserPassword = async (req, res) => {
  try {
    const { user_email, otp_code, new_password } = req.body;
    const otp = await OTP.findOne({ otp: otp_code });
    const user = await User.findOne({ email: user_email });

    if (!otp) return res.status(203).json({ message: "OTP is invalid" });
    if (!user) return res.status(203).json({ message: "User doesn't exist" });

    const hashedPwd = await bcrypt.hash(new_password, 10);
    await User.findByIdAndUpdate(user._id, { password: hashedPwd });

    res.status(200).json({ message: "Password has been updated" });
  } catch (err) {
    res.status(500).json({ error: err });
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
