const User = require("../models/user");
const Package = require("../models/referral_packages");
const bcrypt = require("bcrypt");
const { faker } = require("@faker-js/faker");

const handleNewUser = async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      password,
      email,
      role,
      referral_package,
      referred_by,
    } = req.body;

    // VALIDATION
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "email and password are required." });

    // DUPLICATE CHECK
    const isUser = await User.findOne({ email });
    if (isUser)
      return res.status(409).json({ message: "email already exists" });

    // PASSWORD ENCRYPT
    const hashedPwd = await bcrypt.hash(password, 10);

    // NEW USER OBJECT (NO COMMISSION HERE)
    const newUser = {
      firstname,
      lastname,
      role: role || "Customer",
      status: true,
      email,
      password: hashedPwd,
      referral_package,
      level: 0,
      referred_by: "",
      upline: "",
      paymentStatus: "UNPAID",     // 🔥 IMPORTANT — NO PAYMENT YET
    };

    // CREATE USER CODE
    newUser.user_code =
      firstname + "-" + faker.helpers.replaceSymbolWithNumber("####-####");

    // ---------------------------------------------------
    // REFERRAL VALIDATION (NO COMMISSION HERE)
    // ---------------------------------------------------
    if (referred_by) {
      const referral = await User.findOne({ user_code: referred_by });

      if (!referral) {
        return res.json({
          message: "Referrer does not exist. Please enter correct referral code",
        });
      }

      // ASSIGN REFERRAL LINK
      newUser.referred_by = referred_by;
      newUser.upline = referral._id;
      newUser.level = 1;
    }

    // ---------------------------------------------------
    // CREATE USER (NO COMMISSION ON SIGNUP)
    // ---------------------------------------------------
    const user = await User.create(newUser);

    return res.status(201).json({
      success: "Your Account is successfully created",
      data: user,
    });

  } catch (err) {
    console.log("Signup Error:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { handleNewUser };
