const User = require("../models/user");
const OTP = require("../models/otp");
const Package = require("../models/referral_packages");
const Milestone = require("../models/milestone");
const Financial = require("../models/financial");
const { searchInColumns, getQuery } = require("../utils");
const bcrypt = require("bcrypt");
const send_email = require("../middleware/email");
const imagekit = require("../config/imagekit");
const multer = require("multer");
const storage = multer.memoryStorage();
const { sendEmail } = require("../utils/email"); 
const upload = multer({ storage });

// GET all users with optional search and pagination
const getAllUsers = async (req, res) => {
  try {
    let { page, limit, search, mode, ...queries } = req.query;
    //add search keys name
    search = searchInColumns(search, ["firstname", "lastname","transaction_id"]);
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
// const forgotPasswordOtp = async (req, res) => {
//   try {
//     const user = await User.findOne({ email: req.params.email });
//     if (!user) return res.status(404).json({ message: "User doesn't exist" });

//     const otp = generateOTP();
//     const otp_data = await OTP.create({
//       otp,
//       isActive: true,
//       email: req.params.email,
//     });

//     let emailInput = {
//       subject: "Forgot your password",
//       html: `<strong>Please enter the following OTP to change your password: ${otp}</strong>`,
//     };

//     await send_email(req.params.email, emailInput);

//     res.status(200).json({
//       message: "OTP has been sent to your email address",
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };




const forgotPasswordOtp = async (req, res) => {
  try {
    // ✅ Find user by email in Darsi system
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ message: "User doesn't exist" });

    // ✅ Generate OTP
    const otp = generateOTP();

    // ✅ Save OTP in DB
    await OTP.create({
      otp,
      isActive: true,
      email: req.params.email,
    });

    // ✅ Prepare email content
    const emailInput = {
      subject: "Darsi - Forgot Your Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h3 style="color: #33A137;">Darsi Password Reset OTP</h3>
          <p>Please use the following OTP to reset your password:</p>
          <h2 style="background: #f1f1f1; padding: 10px; text-align: center; border-radius: 5px;">${otp}</h2>
          <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>Darsi Team</p>
        </div>
      `,
    };

    // ✅ Send OTP to user's email
   await sendEmail({
  to: req.params.email,
  subject: emailInput.subject,
  html: emailInput.html,
});

    // ✅ Response
    res.status(200).json({
      message: "OTP has been sent to your email address",
    });
  } catch (err) {
    console.error("Forgot password OTP error:", err);
    res.status(500).json({ error: err.message });
  }
};



// CHANGE USER PASSWORD
// const changeUserPassword = async (req, res) => {
//   try {
//     const { user_email, otp_code, new_password } = req.body;

//     const otp = await OTP.findOne({ otp: otp_code, email: user_email, isActive: true });
//     const user = await User.findOne({ email: user_email });


//     if (!otp) return res.status(400).json({ message: "OTP is invalid or expired" });
//     if (!user) return res.status(404).json({ message: "User doesn't exist" });

//     // Check if OTP is expired (5 minutes)
//     const otpAge = (new Date() - otp.createdAt) / 1000 / 60;
//     if (otpAge > 5) return res.status(400).json({ message: "OTP expired" });

//     const hashedPwd = await bcrypt.hash(new_password, 10);
//     await User.findByIdAndUpdate(user._id, { password: hashedPwd });

//     // Deactivate OTP
//     otp.isActive = false;
//     await otp.save();

//     res.status(200).json({ message: "Password has been updated" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

const changeUserPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.params.id; // agar :id use kiya

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const validOldPwd = await bcrypt.compare(oldPassword, user.password);
    if (!validOldPwd)
      return res.status(400).json({ message: "Old password is incorrect" });

    const hashedPwd = await bcrypt.hash(newPassword, 10);
    user.password = hashedPwd;
    await user.save();

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


/***************************verify otp**************************************************** */

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find active OTP
    const otpRecord = await OTP.findOne({ email, otp, isActive: true });
    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Mark OTP as used
    otpRecord.isActive = false;
    await otpRecord.save();

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ error: err.message });
  }
};


/************************************************************************************* */



// ✅ Reset password after OTP verification

/**********************Reset password********************************************* */
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Verify OTP
    const otpRecord = await OTP.findOne({ email, otp, isActive: true });
    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Mark OTP as used
    otpRecord.isActive = false;
    await otpRecord.save();

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: err.message });
  }
};

/****************************************************************************** */


//12152025 
//atharhussin
//proper 
// UPDATE USER (with image & referral handling)
// const updateUser = async (req, res) => {
//   try {
//     const {
//       firstname,
//       lastname,
//       password,
//       email,
//       role,
//       referral_payment_status,
//       referral_package,
//       referred_by,
//     } = req.body;

//     const user = await User.findById(req.params.id);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     const file = req.file;
//     const payment_status = referral_payment_status === "Paid";

//     // Check for email conflict
//     const emailExists = await User.findOne({ email });
//     if (emailExists && emailExists._id.toString() !== req.params.id) {
//       return res.status(409).json({ message: "Email already exists" });
//     }

//     const updateData = {
//       firstname,
//       lastname,
//       role: role || "Customer",
//       email,
//       referral_payment_status: payment_status,
//       referral_package,
//       referred_by,
//       transaction_id:'1234567'
//     };

//     // if (password) {
//     //   const hashedPwd = await bcrypt.hash(password, 10);
//     //   updateData.password = hashedPwd;
//     // }

//     let data = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });

//     // Profile image
//     if (file) {
//       if (data.imageId) await imagekit.deleteFile(data.imageId);

//       const img = await imagekit.upload({
//         file: file.buffer,
//         fileName: file.originalname,
//       });

//       data = await User.findByIdAndUpdate(
//         data._id,
//         { imageURL: img.url, imageId: img.fileId },
//         { new: true }
//       );
//     }

//     // Referral commission & financial records
//     if (payment_status && role === "Referrer" && referral_package) {
//       const packageData = await Package.findById(referral_package);
//       const milestones = await Milestone.findOne();

//       let ref1Commission = 0,
//         ref2Commission = 0,
//         ref3Commission = 0;

//       if (referred_by) {
//         const ref1 = await User.findOne({ user_code: referred_by });
//         if (ref1) {
//           ref1Commission = packageData.price * (milestones.levelOne / 100);
//           await Financial.create({
//             user: ref1._id,
//             package: packageData._id,
//             amount: ref1Commission,
//             type: "PACKAGE",
//           });

//           const ref2 = await User.findOne({ user_code: ref1.referred_by });
//           if (ref2) {
//             ref2Commission = packageData.price * (milestones.levelTwo / 100);
//             await Financial.create({
//               user: ref2._id,
//               package: packageData._id,
//               amount: ref2Commission,
//               type: "PACKAGE",
//             });

//             const ref3 = await User.findOne({ user_code: ref2.referred_by });
//             if (ref3) {
//               ref3Commission = packageData.price * (milestones.levelThree / 100);
//               await Financial.create({
//                 user: ref3._id,
//                 package: packageData._id,
//                 amount: ref3Commission,
//                 type: "PACKAGE",
//               });
//             }
//           }

//           // Update upline & level
//           data.referred_by = referred_by;
//           data.upline = ref1._id;
//           data.level = ref1.level + 1;
//           await data.save();
//         }
//       }

//       const adminAmount = packageData.price - ref1Commission - ref2Commission - ref3Commission;
//       await Financial.create({
//         darsi: true,
//         package: packageData._id,
//         amount: adminAmount,
//         type: "PACKAGE",
//       });
//     }

//     res.status(200).json({ message: "User has been updated", data });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// };

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
      transaction_id,
    } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Email conflict check
    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists && emailExists._id.toString() !== req.params.id) {
        return res.status(409).json({ message: "Email already exists" });
      }
    }

    // Files
    const profileImage = req.files?.profileImage?.[0];
    const paymentScreenshot = req.files?.paymentScreenshot?.[0];

    // Prepare update object
    const updateData = {
      firstname,
      lastname,
      email,
      role,
      referral_package,
      referred_by,
      transaction_id,
      referral_payment_status: referral_payment_status === "Paid",
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    let data = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    // ================= PROFILE IMAGE =================
    if (profileImage) {
      if (data.imageId) {
        await imagekit.deleteFile(data.imageId);
      }

      const uploadedImage = await imagekit.upload({
        file: profileImage.buffer,
        fileName: profileImage.originalname,
      });

      data.imageURL = uploadedImage.url;
      data.imageId = uploadedImage.fileId;
    }

    // ================= PAYMENT SCREENSHOT =================
    if (paymentScreenshot) {
      if (data.paymentScreenshotId) {
        await imagekit.deleteFile(data.paymentScreenshotId);
      }

      const uploadedScreenshot = await imagekit.upload({
        file: paymentScreenshot.buffer,
        fileName: paymentScreenshot.originalname,
      });

      data.paymentScreenshotURL = uploadedScreenshot.url;
      data.paymentScreenshotId = uploadedScreenshot.fileId;
    }

    // ================= SAVE ONCE =================
    await data.save();

    // ================= REFERRAL LOGIC =================
    if (
      updateData.referral_payment_status &&
      role === "Referrer" &&
      referral_package
    ) {
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
              ref3Commission =
                packageData.price * (milestones.levelThree / 100);
              await Financial.create({
                user: ref3._id,
                package: packageData._id,
                amount: ref3Commission,
                type: "PACKAGE",
              });
            }
          }

          data.upline = ref1._id;
          data.level = ref1.level + 1;
          await data.save();
        }
      }

      const adminAmount =
        packageData.price -
        ref1Commission -
        ref2Commission -
        ref3Commission;

      await Financial.create({
        darsi: true,
        package: packageData._id,
        amount: adminAmount,
        type: "PACKAGE",
      });
    }

    res.status(200).json({
      message: "User has been updated successfully",
      data,
    });
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
  verifyOtp,
  resetPassword
};
