const Order = require("../models/order");
const User = require("../models/user");

const getCounts = async (req, res) => {
  try {
    const ordersPending = await Order.countDocuments({
      orderStatus: "Pending",
    });
    const ordersAccepted = await Order.countDocuments({
      orderStatus: "Order Accepted",
    });
    const ordersProcessing = await Order.countDocuments({
      orderStatus: "Order Processing",
    });
    const ordersOutForDelivery = await Order.countDocuments({
      orderStatus: "Out For Delivery",
    });
    const ordersCompleted = await Order.countDocuments({
      orderStatus: "Delivered",
    });
    const ordersCancelled = await Order.countDocuments({
      orderStatus: "Cancelled",
    });
    const userCustomer = await User.countDocuments({
      role: "Customer",
    });
    const userVendor = await User.countDocuments({
      role: "Vendor",
    });
    const userReferrer = await User.countDocuments({
      role: "Referrer",
    });
    const totalIncome = await Order.aggregate([
      { $match: { orderStatus: "Delivered" } },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$cart.netCost",
          },
        },
      },
    ]);
    const totalIncomePending = await Order.aggregate([
      { $match: { orderStatus: "Pending" } },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$cart.netCost",
          },
        },
      },
    ]);
    const totalIncomeCancelled = await Order.aggregate([
      { $match: { orderStatus: "Cancelled" } },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$cart.netCost",
          },
        },
      },
    ]);
    res.json({
      data: {
        orders: {
          ordersCompleted,
          ordersPending,
          ordersCancelled,
          ordersAccepted,
          ordersOutForDelivery,
          ordersProcessing,
        },
        revenues: { totalIncome, totalIncomePending, totalIncomeCancelled },
        users: { userCustomer, userVendor, userReferrer },
      },
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const getChartData = async (req, res) => {
  try {
    res.json({
      data: {},
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
module.exports = { getCounts, getChartData };
