const User = require("../models/user");
const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const handleLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res
      .status(401)
      .json({ message: "Username and password are required." });
  const foundUser = await User.findOne({ email: email });
  if (!foundUser) return res.status(401).json("message", "email is Inalid"); //Unauthorized
  // evaluate password
  const pass = foundUser.password;
  const match = await bcrypt.compare(password, pass);
  if (match) {
    const role = foundUser.role;
    // create JWTs
    const accessToken = jwt.sign(
      {
        UserInfo: {
          username: foundUser.username,
          role,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1d" }
    );
    const refreshToken = jwt.sign(
      { username: foundUser.username },
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

    const { username, ...others } = foundUser;

    res.json({ username, role, accessToken });
  } else {
    res.sendStatus(401);
  }
};

module.exports = { handleLogin };
