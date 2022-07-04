const User = require("../models/user");
const bcrypt = require("bcrypt");
const { faker } = require("@faker-js/faker");
const handleNewUser = async (req, res) => {
  try {
    const { firstname, lastname, password, email, role } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "email and password are required." });
    // check for duplicate emails in the db
    const user = await User.findOne({ email });

    if (user?.email === email)
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
    };
    let user_code = email;
    newUser.user_code =
      user_code + "-" + faker.helpers.replaceSymbolWithNumber("####-####");
    if (req.body.role === "Referrer") {
      newUser.referral_package = req.body.referral_package;
      newUser.referred_by = req.body.referred_by;
    }
    await User.create(newUser);

    res.status(201).json({ success: `New user created!`, newUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { handleNewUser };
