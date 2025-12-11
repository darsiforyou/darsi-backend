const User = require("../models/user");
const Package = require("../models/referral_packages");
const bcrypt = require("bcrypt");
const { faker } = require("@faker-js/faker");
const Financial = require("../models/financial");
const Milestone = require("../models/milestone");

/* ---------------------------------------------------------
   FUNCTION: DISTRIBUTE MLM COMMISSION AFTER PAYMENT SUCCESS
------------------------------------------------------------ */
const distributeReferralCommission = async (paidUserId) => {
  const paidUser = await User.findById(paidUserId);
  if (!paidUser) return;

  const package = await Package.findById(paidUser.referral_package);
  const milestone = await Milestone.findOne();

  let packagePrice = package.price;

  // LEVEL 1
  const ref1 = await User.findOne({ user_code: paidUser.referred_by });

  if (ref1 && ref1.paymentStatus === "PAID") {
    const commission = (packagePrice * milestone.levelOne) / 100;
    await Financial.create({
      user: ref1._id,
      package: package._id,
      amount: commission,
      type: "PACKAGE",
    });
  }

  // LEVEL 2
  let ref2;
  if (ref1) ref2 = await User.findOne({ user_code: ref1.referred_by });

  if (ref2 && ref2.paymentStatus === "PAID") {
    const commission = (packagePrice * milestone.levelTwo) / 100;
    await Financial.create({
      user: ref2._id,
      package: package._id,
      amount: commission,
      type: "PACKAGE",
    });
  }

  // LEVEL 3
  let ref3;
  if (ref2) ref3 = await User.findOne({ user_code: ref2.referred_by });

  if (ref3 && ref3.paymentStatus === "PAID") {
    const commission = (packagePrice * milestone.levelThree) / 100;
    await Financial.create({
      user: ref3._id,
      package: package._id,
      amount: commission,
      type: "PACKAGE",
    });
  }

  // ADMIN AMOUNT ONLY AFTER PAYMENT
  let totalPercentage =
    milestone.levelOne + milestone.levelTwo + milestone.levelThree;

  let adminAmount = packagePrice - (packagePrice * totalPercentage) / 100;

  await Financial.create({
    darsi: true,
    package: package._id,
    amount: adminAmount,
    type: "PACKAGE",
  });

  console.log("MLM COMMISSION DISTRIBUTED SUCCESSFULLY FOR USER:", paidUser.email);
};

/* ---------------------------------------------------------
   SIGNUP HANDLER - NO COMMISSION HERE
------------------------------------------------------------ */

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

    if (!email || !password)
      return res
        .status(400)
        .json({ message: "email and password are required." });

    // check for duplicate emails
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ message: "email already exists" });

    const hashedPwd = await bcrypt.hash(password, 10);

    const newUser = {
      firstname,
      lastname,
      role: role || "Customer",
      status: true,
      email,
      password: hashedPwd,
      referral_package,
      level: 0,
      paymentStatus: "UNPAID", // ← NEW ADDITION
    };

    // generate unique ref code
    newUser.user_code =
      firstname + "-" + faker.helpers.replaceSymbolWithNumber("####-####");

    // verify referral
    if (referred_by) {
      const referral = await User.findOne({ user_code: referred_by });
      if (!referral)
        return res.json({
          message: "Referrar Does Not Exists. Please Enter Correct Referral Code",
        });

      newUser.referred_by = referred_by;
      newUser.upline = referral._id;
      newUser.level = 1;
    }

    const user = await User.create(newUser);

    return res.status(201).json({
      success: `Your Account is successfully created`,
      data: user,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { handleNewUser, distributeReferralCommission };
