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
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "email and password are required." });
    // check for duplicate emails in the db
    const isUser = await User.findOne({ email });

    if (isUser?.email === email)
      return res.json({ message: "email already exists" }); //Conflict
    //encrypt the password
    const hashedPwd = await bcrypt.hash(password, 10);
    //store the new user
    const newUser = {
      firstname,
      lastname,
      role: role ? role : "Customer",
      email,
      password: hashedPwd,
      referral_package,
    };
    let user_code = firstname;
    newUser.user_code =
      user_code + "-" + faker.helpers.replaceSymbolWithNumber("####-####");

    if (role === "Referrer") {
      newUser.referred_by = referred_by;
      const package = await Package.findById(referral_package);
      if (referred_by) {
        const referral = await User.findOne({ user_code: referred_by });
        if (referral) {
          let commission = (package.price * package.commission) / 100;
          commission = commission + referral.commission;
          let updateRef = await User.findByIdAndUpdate(referral._id, {
            commission,
          });
        } else {
          return res.json({ message: "Referrer does not exists" }); //Conflict
        }
      }
    }
    let user = await User.create(newUser);

    res.status(201).json({
      success: `Your Account is successfully created`,
      data: user,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { handleNewUser };
