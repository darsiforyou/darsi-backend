const User = require("../models/user");
const bcrypt = require("bcrypt");
const { faker } = require("@faker-js/faker");
const handleNewUser = async (req, res) => {
  const { username, password, email, role } = req.body;
  if (!username || !password)
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  // check for duplicate usernames in the db
  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (user?.username === username)
    return res.json({ message: "username already exists" });
  if (user?.email === email)
    return res.json({ message: "email already exists" }); //Conflict

  try {
    //encrypt the password
    const hashedPwd = await bcrypt.hash(password, 10);
    //store the new user
    const newUser = {
      username: user,
      role: role ? role : "Customer",
      email,

      password: hashedPwd,
    };
    let user_code = email;
    if (req.body.name !== undefined) {
      user_code = req.body.name.split(" ")[0];
    }
    newUser.user_code =
      user_code + "-" + faker.helpers.replaceSymbolWithNumber("####-####");
    if (req.body.role === "Referrer") {
      newUser.referral_package = req.body.referral_package;
      newUser.referred_by = req.body.referred_by;
    }
    await User.create(newUser);

    res.status(201).json({ success: `New user ${username} created!`, newUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { handleNewUser };
