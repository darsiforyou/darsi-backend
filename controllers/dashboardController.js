const Order = require("../models/order");
const User = require("../models/user");
const Product = require("../models/product");

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
    const chartData = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalOrderValue: {
            $sum: { $multiply: ["$cart.netCost", "$cart.totalQty"] },
          },
          averageOrderQuantity: { $avg: "$cart.totalQty" },
        },
      },
      {
        $sort: { _id: "ASC" },
      },
      // {
      //   $unwind: "$orig",
      // },
      // {
      //   $project: {
      //     createdAt: "$orig.createdAt",
      //     netCost: "$orig.netCost",
      //     total: "$total",
      //   },
      // },
      // {
      //   $group: {
      //     _id: "$createdAt",
      //     netCost: {
      //       $sum: "$netCost",
      //     },
      //     orig: {
      //       $push: "$$ROOT.total",
      //     },
      //   },
      // },
      // {
      //   $unwind: "$orig",
      // },
      // {
      //   $group: {
      //     _id: {
      //       _id: "$_id",
      //       netCost: "$netCost",
      //       total: "$orig",
      //     },
      //   },
      // },
      // {
      //   $project: {
      //     createdAt: "$_id._id",
      //     netCost: "$_id.netCost",
      //     total: "$_id.total",
      //     _id: 0,
      //   },
      // },
    ]);
    res.json({
      data: { chartData },
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const geTopProducts = async (req, res) => {
  try {
    let { limit } = req.query;

    const topProducts = await Product.find()
      .sort({ stockCountConsumed: -1 })
      .limit(limit || 10);
    res.json({ data: { topProducts } });
  } catch (error) {
    res.status(500).json({ error: err });
  }
};
const geTopCustomers = async (req, res) => {
  try {
    const topCustomers = await Order.aggregate([
      {
        $lookup: {
          from: "users", // collection name in db
          localField: "user",
          foreignField: "_id",
          as: "users",
        },
      },
      { $sort: { user: -1 } },
      { $limit: 10 },
    ]);
    res.json({ data: { topCustomers } });
  } catch (error) {
    res.status(500).json({ error: err });
  }
};
module.exports = { getCounts, getChartData, geTopProducts, geTopCustomers };
