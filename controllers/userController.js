const User = require("../models/user");
const { searchInColumns } = require("../utils");

const getAllUsers = async (req, res) => {
  try {
    let { page, limit, search, ...quries } = req.query;
    search = searchInColumns(search, ["firstname", "lastname"]);
    const myAggrigate = await User.aggregate([
      { $match: { $and: [{ $or: search }, quries] } },
    ]);

    const options = {
      page: page || 1,
      limit: limit || 10,
    };

    const data = await User.aggregatePaginate(myAggrigate, options);

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
    const { email } = req.body;
    const user = await User.findById(req.params.id);

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
