const User = require("../models/user");
const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const handleLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(401).json({ error: "email and password are required." });
  const foundUser = await User.findOne({ email: email });
  if (!foundUser) return res.status(401).json({ error: "email is Invalid" }); //Unauthorized
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
      { expiresIn: "1d" }
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

    res.json({ ...others, accessToken });
  } else {
    res.sendStatus(401);
  }
};

module.exports = { handleLogin };
