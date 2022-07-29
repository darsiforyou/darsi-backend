const User = require("../models/user");
const { searchInColumns, getQuery } = require("../utils");
const bcrypt = require("bcrypt");

const getAllUsers = async (req, res) => {
  try {
    let { page, limit, search, mode, ...quries } = req.query;
    search = searchInColumns(search, ["firstname", "lastname"]);
    quries = getQuery(quries);
    const myAggrigate = await User.aggregate([
      { $match: { $and: [{ $or: search }, quries] } },
      {
        $lookup: {
          from: "referral_package",
          localField: "referral_package",
          foreignField: "_id",
          as: "referral_package",
        },
      },
    ]);

    const options = {
      page: page || 1,
      limit: limit || 10,
      sort: { createdAt: -1 }
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
const getUserWithRefCode = async (req, res) => {
  try {
    const user = await User.findOne({ user_code: req.params.code }).select(
      "_id firstname lastname email role user_code referral_package"
    );
    if (!user) return res.status(404).send({ error: "User not found" });
    return res.json(user);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const getAllUsersWithoutFilter = async (req, res) => {
  try {
    let query = getQuery(req.query);
    const users = await User.find(query).select(
      "_id firstname lastname email role user_code"
    );
    return res.json(users);
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
    const { firstname, lastname, password, email, role } = req.body;
    const user = await User.findById(req.params.id);

    if (user.email === email && user._id != req.params.id)
      return res.json({ message: "Email already exists" });
    //store the new user
    const updateUser = {
      firstname,
      lastname,
      role: role ? role : "Customer",
      email,
    };
    if (password) {
      const hashedPwd = await bcrypt.hash(password, 10);
      updateUser.password = hashedPwd;
    }
    let data = await User.findByIdAndUpdate(req.params.id, updateUser);

    res.status(200).json({
      message: "User has been updated",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

module.exports = {
  getAllUsers,
  getUser,
  getAllUsersWithoutFilter,
  getUserWithRefCode,
  deleteUser,
  updateUser,
};
