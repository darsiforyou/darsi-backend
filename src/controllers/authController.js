const User = require("../models/user");
const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(203).json({
        message: "email and password are required.",
        data: {},
      });
    const foundUser = await User.findOne({ email: email });

    if (!foundUser)
      return res.status(203).json({
        message: "email is Invalid",
        data: {},
      });

    // if (foundUser.role === "Referrer") {
    //   if (foundUser.referral_payment_status === false) {
    //     return res.status(200).json({
    //       message: "You have not paid your account fee",
    //       data: null,
    //     });
    //   }
    // }
    // evaluate password
    const pass = foundUser.password;
    const match = await bcrypt.compare(password, pass);
    if (match) {
      const role = foundUser.role;
      // create JWTs
      const accessToken = jwt.sign(
        {
          UserInfo: {
            id: foundUser.id,
            email: foundUser.email,
            role,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "30d" }
      );
      const refreshToken = jwt.sign(
        { email: foundUser.email },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "1d" }
      );
      // Saving refreshToken with current user
      await User.findById(foundUser._id).update({
        refreshToken,
      });
      res.cookie("jwt", refreshToken, {
        httpOnly: true,
        sameSite: "None",
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      });

      const { password, refreshToken: rftoken, ...others } = foundUser._doc;

      res.status(200).json({
        message: "Successfully loged in.",
        data: { ...others, accessToken },
      });
    } else {
      res.status(203).json({
        message: "Password did not match",
        data: {},
      });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
      data: {},
    });
  }
};

module.exports = { handleLogin };
