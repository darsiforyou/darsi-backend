const User = require("../models/user");
const OTP = require("../models/otp");
const Package = require("../models/referral_packages");
const Milestone = require("../models/milestone");
const Financial = require("../models/financial");
const { searchInColumns, getQuery } = require("../utils");
const bcrypt = require("bcrypt");
const send_email = require("../middleware/email");
const imagekit = require("../config/imagekit");

// GET all users with optional search and pagination
const getAllUsers = async (req, res) => {
  try {
    let { page, limit, search, mode, ...queries } = req.query;
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
            as: "packageName",
          },
        },
      ]);
    } else {
      myAggregate = User.aggregate([
        { $match: { $and: [{ $or: search }, queries] } },
        {
          $lookup: {
            from: "referral_packages",
            localField: "referral_package",
            foreignField: "_id",
            as: "packageName",
          },
        },
      ]);
    }

    const options = {
      page: page || 1,
      limit: limit || 10,
      sort: { createdAt: -1 },
    };

    const data = await User.aggregatePaginate(myAggregate, options);

    

    return res.status(200).json({
      message: "Successfully fetched users",
      data,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET single user by ID
const getUser = async (req, res) => {
  try {

    //without decrypt code
    // const user = await User.findById(req.params.id);
    // if (!user) return res.status(404).json({ error: "User not found" });
    // return res.json(user);

     //decrypt code
     let user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });

    

    return res.json(user);







    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET user by referral code
const getUserWithRefCode = async (req, res) => {
  try {
    const user = await User.findOne({ user_code: req.params.code }).select(
      "_id firstname lastname email role user_code referral_package"
    );
    if (!user) return res.status(404).json({ error: "User not found" });
     user = user.toObject();
      user.password = decrypt(user.password); 
    return res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET all users without filters
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

// DELETE user by ID
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User has been deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GENERATE 4-digit OTP
function generateOTP() {
  let digits = "0123456789";
  let otp = "";
  for (let i = 0; i < 4; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

// SEND forgot password OTP
const forgotPasswordOtp = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ message: "User doesn't exist" });

    const otp = generateOTP();
    const otp_data = await OTP.create({
      otp,
      isActive: true,
      email: req.params.email,
    });

    let emailInput = {
      subject: "Forgot your password",
      html: `<strong>Please enter the following OTP to change your password: ${otp}</strong>`,
    };

    await send_email(req.params.email, emailInput);

    res.status(200).json({
      message: "OTP has been sent to your email address",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CHANGE USER PASSWORD
const changeUserPassword = async (req, res) => {
  try {
    const { user_email, otp_code, new_password } = req.body;

    const otp = await OTP.findOne({ otp: otp_code, email: user_email, isActive: true });
    const user = await User.findOne({ email: user_email });

    if (!otp) return res.status(400).json({ message: "OTP is invalid or expired" });
    if (!user) return res.status(404).json({ message: "User doesn't exist" });

    // Check if OTP is expired (5 minutes)
    const otpAge = (new Date() - otp.createdAt) / 1000 / 60;
    if (otpAge > 5) return res.status(400).json({ message: "OTP expired" });

    const hashedPwd = await bcrypt.hash(new_password, 10);
    await User.findByIdAndUpdate(user._id, { password: hashedPwd });

    // Deactivate OTP
    otp.isActive = false;
    await otp.save();

    res.status(200).json({ message: "Password has been updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE USER (with image & referral handling)
const updateUser = async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      password,
      email,
      role,
      referral_payment_status,
      referral_package,
      referred_by,
    } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const file = req.file;
    const payment_status = referral_payment_status === "Paid";

    // Check for email conflict
    const emailExists = await User.findOne({ email });
    if (emailExists && emailExists._id.toString() !== req.params.id) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const updateData = {
      firstname,
      lastname,
      role: role || "Customer",
      email,
      referral_payment_status: payment_status,
      referral_package,
      referred_by,
    };

    // if (password) {
    //   const hashedPwd = await bcrypt.hash(password, 10);
    //   updateData.password = hashedPwd;
    // }

    let data = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });

    // Profile image
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

    // Referral commission & financial records
    if (payment_status && role === "Referrer" && referral_package) {
      const packageData = await Package.findById(referral_package);
      const milestones = await Milestone.findOne();

      let ref1Commission = 0,
        ref2Commission = 0,
        ref3Commission = 0;

      if (referred_by) {
        const ref1 = await User.findOne({ user_code: referred_by });
        if (ref1) {
          ref1Commission = packageData.price * (milestones.levelOne / 100);
          await Financial.create({
            user: ref1._id,
            package: packageData._id,
            amount: ref1Commission,
            type: "PACKAGE",
          });

          const ref2 = await User.findOne({ user_code: ref1.referred_by });
          if (ref2) {
            ref2Commission = packageData.price * (milestones.levelTwo / 100);
            await Financial.create({
              user: ref2._id,
              package: packageData._id,
              amount: ref2Commission,
              type: "PACKAGE",
            });

            const ref3 = await User.findOne({ user_code: ref2.referred_by });
            if (ref3) {
              ref3Commission = packageData.price * (milestones.levelThree / 100);
              await Financial.create({
                user: ref3._id,
                package: packageData._id,
                amount: ref3Commission,
                type: "PACKAGE",
              });
            }
          }

          // Update upline & level
          data.referred_by = referred_by;
          data.upline = ref1._id;
          data.level = ref1.level + 1;
          await data.save();
        }
      }

      const adminAmount = packageData.price - ref1Commission - ref2Commission - ref3Commission;
      await Financial.create({
        darsi: true,
        package: packageData._id,
        amount: adminAmount,
        type: "PACKAGE",
      });
    }

    res.status(200).json({ message: "User has been updated", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllUsers,
  getUser,
  getUserWithRefCode,
  getAllUsersWithoutFilter,
  deleteUser,
  updateUser,
  forgotPasswordOtp,
  changeUserPassword,
};
