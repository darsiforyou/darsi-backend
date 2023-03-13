const User = require("../models/user");
const OTP = require("../models/otp");
const { searchInColumns, getQuery } = require("../utils");
const bcrypt = require("bcrypt");
const send_email = require("../middleware/email");
const imagekit = require("../config/imagekit");

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

    return res.status(200).send({
      message: "Successfully fetch Users",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send({ error: "User not found" });
    return res.json(user);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const getUserWithRefCode = async (req, res) => {
  try {
    const user = await User.findOne({ user_code: req.params.code }).select(
      "_id firstname lastname email role user_code referral_package"
    );
    if (!user) return res.status(404).send({ error: "User not found" });
    return res.json(user);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const getAllUsersWithoutFilter = async (req, res) => {
  try {
    let query = getQuery(req.query);
    const users = await User.find(query).select(
      "_id firstname lastname email role user_code"
    );
    return res.json(users);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User has been deleted..." });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const updateUser = async (req, res) => {
  try {
    const { firstname, lastname, password, email, role } = req.body;
    const user = await User.findById(req.params.id);
    const file = req.file;

    if (user.email === email && user._id != req.params.id)
      return res.json({ message: "Email already exists" });
    //store the new user
    const updateUser = {
      firstname,
      lastname,
      role: role ? role : "Customer",
      email,
    };
    if (password) {
      const hashedPwd = await bcrypt.hash(password, 10);
      updateUser.password = hashedPwd;
    }
    let data = await User.findByIdAndUpdate(req.params.id, updateUser);

    if (file !== undefined) {
      const { imageId } = data;
      if (imageId) await imagekit.deleteFile(imageId);
      let img = await imagekit.upload({
        file: file.buffer, //required
        fileName: file.originalname, //required
      });
      data = await User.findByIdAndUpdate(data.id, {
        imageURL: img.url,
        imageId: img.fileId,
      });
    }

    res.status(200).json({
      message: "User has been updated",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
function generateOTP() {
  // Declare a digits variable
  // which stores all digits
  var digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 4; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}
const forgotPasswordOtp = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });

    if (!user?._id)
      return res.status(203).json({ message: "User doesn't exist" });

    let otp = generateOTP();
    let otp_data = await OTP.create({
      otp,
      isActive: true,
      email: req.params.email,
    });
    if (otp_data.id) {
      let emailInput = {
        subject: "Forgot your password",
        html: `<strong>Please enter the following OTP to Change your password ${otp} </strong>`,
      };
      await send_email(req.params.email, emailInput)
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          return res.status(500).json({ error: err });
        });

      res.status(200).json({
        message: "OPT has been sent to your email address",
      });
    } else {
      return res.status(500).json({ error: "Something went wrong" });
    }
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const changeUserPassword = async (req, res) => {
  try {
    const { user_email, otp_code, new_password } = req.body;
    const otp = await OTP.findOne({ opt: otp_code });
    const user = await User.findOne({ email: user_email });

    if (!otp?._id) return res.status(203).json({ message: "OPT is invalid" });
    if (!user?._id)
      return res.status(203).json({ message: "User doesn't exist" });

    let currentTime = new Date();
    currentTime.setMinutes(currentTime.getMinutes() + 5);
    currentTime = currentTime.getMilliseconds();

    let optCreatedTime = new Date(otp.createdAt).getMilliseconds();
    // if(optCreatedTime > currentTime){

    // }
    const hashedPwd = await bcrypt.hash(new_password, 10);
    const hashedNewPwd = hashedPwd;
    await User.findByIdAndUpdate(user?._id, { password: hashedNewPwd });

    res.status(200).json({
      message: "password have been updated",
    });
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
  changeUserPassword,
};
