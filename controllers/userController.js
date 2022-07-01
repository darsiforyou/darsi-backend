const User = require("../models/user");

const getAllUsers = async (req, res) => {
  try {
    let query = req.query;
    Object.keys(query).forEach((key) => {
      if (query[key] === null) {
        delete query[key];
      }
    });
    let search = [];
    let limit = 10;
    let skip = 0;
    if (query.search) {
      let search = new RegExp(query.search.toLowerCase(), "i");
      search = [{ title: search }, { description: search }];
      delete query.search;
    } else {
      search = [{ title: "" }, { description: "" }];
    }
    if (query.limit) {
      limit = query.limit;
      delete query.limit;
    }
    if (query.skip) {
      skip = query.skip;
      delete query.skip;
    }
    const count = await User.countDocuments({});
    const data = await User.find({
      $and: [{ $or: search }, query],
    })
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit);

    return res.status(200).send({
      message: "Successfully fetch Users",
      data: data,
      count: count,
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
