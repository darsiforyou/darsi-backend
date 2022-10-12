const Order = require("../models/order");
const User = require("../models/user");
const Product = require("../models/product");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

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
    const ordersPending = await Order.countDocuments({
      orderStatus: "Pending",
      applied_Referral_Code: req.params.code,
    });
    const ordersAccepted = await Order.countDocuments({
      orderStatus: "Order Accepted",
      applied_Referral_Code: req.params.code,
    });
    const ordersProcessing = await Order.countDocuments({
      orderStatus: "Order Processing",
      applied_Referral_Code: req.params.code,
    });
    const ordersOutForDelivery = await Order.countDocuments({
      orderStatus: "Out For Delivery",
      applied_Referral_Code: req.params.code,
    });
    const ordersCompleted = await Order.countDocuments({
      orderStatus: "Delivered",
      applied_Referral_Code: req.params.code,
    });
    const ordersCancelled = await Order.countDocuments({
      orderStatus: "Cancelled",
      applied_Referral_Code: req.params.code,
    });
    const userCustomer = await User.countDocuments({
      role: "Customer",
      referred_by: req.params.code,
    });
    const userVendor = await User.countDocuments({
      role: "Vendor",
      referred_by: req.params.code,
    });
    const userReferrer = await User.countDocuments({
      role: "Referrer",
      referred_by: req.params.code,
    });
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
        // revenues: { totalIncome, totalIncomePending, totalIncomeCancelled },
        users: { userCustomer, userVendor, userReferrer },
      },
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
    let { startDate, endDate, role, code } = req.query;
    let todayDate = endDate ?? new Date().toISOString().slice(0, 10);
    let dateObj = new Date();
    let priorDate =
      startDate ??
      new Date(new Date().setDate(dateObj.getDate() - 30))
        .toISOString()
        .slice(0, 10);

    let match = {
      createdAt: { $gte: new Date(priorDate), $lt: new Date(todayDate) },
    };
    if (role === "Referrer") {
      match = {
        $and: [
          {
            applied_Referral_Code: code,
            createdAt: { $gte: new Date(priorDate), $lt: new Date(todayDate) },
          },
        ],
      };
    }

    const chartData = await Order.aggregate([
      {
        $match: match,
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalOrderValue: { $sum: "$cart.netCost" },
          averageOrderQuantity: { $avg: "$cart.totalQty" },
        },
      },
      { $sort: { _id: 1 } },
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
    let { limit, vendor } = req.query;
    const topProducts = await Product.find(
      vendor ? { vendor: ObjectId(vendor) } : {}
    )
      .sort({ stockCountConsumed: -1 })
      .limit(limit || 10);
    res.json({ data: topProducts });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};
const getTopCustomers = async (req, res) => {
  try {
    let { limit } = req.query;

    const topUsers = await User.find({ role: "Customer" })
      .sort({ orderCount: -1 })
      .limit(limit || 10)
      .select("_id firstname lastname role");
    res.json({ data: topUsers });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};
const getTopVendors = async (req, res) => {
  try {
    let { limit } = req.query;

    const topUsers = await User.find({ role: "Vendor" })
      .sort({ totalVendorProductSold: -1 })
      .limit(limit || 10)
      .select("_id firstname lastname role");
    res.json({ data: topUsers });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};
const getTopReferrers = async (req, res) => {
  try {
    let { limit } = req.query;

    const topUsers = await User.find({ role: "Referrer" })
      .sort({ commission: -1 })
      .limit(limit || 10)
      .select("_id firstname lastname role");
    res.json({ data: topUsers });
  } catch (error) {
    res.status(500).json({ error: error });
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
  getTopVendors,
};
