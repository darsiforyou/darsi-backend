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
const getCountsRef = async (req, res) => {
  try {
    const user = await User.countDocuments({
      referred_by: req.params.code,
    });
    const totalCommission = await User.aggregate([
      { $match: { user_code: req.params.code } },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$commission",
          },
        },
      },
    ]);
    res.json({
      data: { user, totalCommission },
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const getCountsVen = async (req, res) => {
  try {
    const products = await Product.countDocuments({
      vendor: req.params.id,
    });
    res.json({
      data: { products },
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
    ]);
    res.json({
      data: { chartData },
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const getTopProducts = async (req, res) => {
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
const getTopCustomers = async (req, res) => {
  try {
    let { limit } = req.query;

    const topUsers = await User.find({role: "Customer"})
      .sort({ orderCount: -1 })
      .limit(limit || 10);
    res.json({ data: { topUsers } });
  } catch (error) {
    res.status(500).json({ error: err });
  }
};
const getTopVendors = async (req, res) => {
  try {
    let { limit } = req.query;

    const topUsers = await User.find({role: "Vendor"})
      .sort({ totalVendorProductSold: -1 })
      .limit(limit || 10);
    res.json({ data: { topUsers } });
  } catch (error) {
    res.status(500).json({ error: err });
  }
};
const getTopReferrers = async (req, res) => {
  try {
    let { limit } = req.query;

    const topUsers = await User.find({role: "Referrer"})
      .sort({ commission: -1 })
      .limit(limit || 10);
    res.json({ data: { topUsers } });
  } catch (error) {
    res.status(500).json({ error: err });
  }
};
module.exports = {
  getCounts,
  getChartData,
  getTopProducts,
  getTopCustomers,
  getCountsRef,
  getCountsVen,
  getTopReferrers,
  getTopVendors
};
