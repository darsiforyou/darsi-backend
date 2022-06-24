const User = require("../models/user");

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    return res.json(users);
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

const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json("User has been deleted...");
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const updateUser = async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findById(req.params.id);
    if (user.username === username)
      return res.json({ message: "username already exists" });
    if (user.email === email)
      return res.json({ message: "email already exists" });
    await User.findByIdAndUpdate(req.params.id, req.body);
    res.status(200).json("User has been updated.");
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

module.exports = {
  getAllUsers,
  getUser,
  deleteUser,
  updateUser,
};
