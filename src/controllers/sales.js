const User = require("../models/user");

const getDashboardCounts = async (req, res) => {
  try {
    const customer = await User.countDocuments({ role: "Customer" });
    // const referrer = await User.countDocuments({ role: "Referrer" });
    // const vendor = await User.countDocuments({ role: "Vendor" });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

module.exports = {
  getDashboardCounts,
};
