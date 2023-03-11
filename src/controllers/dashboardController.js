const Order = require("../models/order");
const User = require("../models/user");
const Product = require("../models/product");
const Financial = require("../models/financial");
const PaymentRequest = require("../models/payment_requests");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const getCounts = async (req, res) => {
  try {
    const { code } = req.query;
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

    let totalIncomeMatch = { orderStatus: "Delivered" };

    if (code) {
      totalIncomeMatch = { ...totalIncomeMatch, applied_Referral_Code: code };
    }
    const totalIncome = await Order.aggregate([
      { $match: { $and: [totalIncomeMatch] } },
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
    let id = new ObjectId(req.params.id);
    const totalProducts = await Product.countDocuments({
      vendor: id,
    });
    const totalProductsActive = await Product.countDocuments({
      vendor: id,
      isActive: true,
    });
    const totalProductsFeature = await Product.countDocuments({
      vendor: id,
      isFeatured: true,
    });

    const ordersPending = await Order.countDocuments({
      "cart.items.vendor": id,
      orderStatus: "Pending",
    });
    const ordersAccepted = await Order.countDocuments({
      "cart.items.vendor": id,
      orderStatus: "Order Accepted",
    });
    const ordersProcessing = await Order.countDocuments({
      "cart.items.vendor": id,
      orderStatus: "Order Processing",
    });
    const ordersOutForDelivery = await Order.countDocuments({
      "cart.items.vendor": id,
      orderStatus: "Out For Delivery",
    });
    const ordersCompleted = await Order.countDocuments({
      "cart.items.vendor": id,
      orderStatus: "Delivered",
    });
    const ordersCancelled = await Order.countDocuments({
      "cart.items.vendor": id,
      orderStatus: "Cancelled",
    });

    const TF = await Financial.aggregate([
      {
        $match: { user: id },
      },
      {
        $group: {
          _id: "",
          total: { $sum: "$amount" },
        },
      },
    ]);

    const TPR = await PaymentRequest.aggregate([
      {
        $match: { status: "Accepted", user: id },
      },
      {
        $group: {
          _id: "",
          amountAccepted: {
            $sum: "$amountAccepted",
          },
          amountRequested: {
            $sum: "$amountRequested",
          },
        },
      },
    ]);

    let financial = { total: 0 };
    let paymentRequest = { amountAccepted: 0 };

    await (TF || []).forEach(async (x) => {
      financial["total"] = await x.total;
    });
    await (TPR || []).forEach(async (x) => {
      paymentRequest = await {
        amountAccepted: x.amountAccepted,
        amountRequested: x.amountRequested,
      };
    });

    const revenue = {
      walletAmount: financial.total - paymentRequest.amountAccepted,
      withdraw: paymentRequest.amountAccepted,
    };
    res.json({
      data: {
        product: { totalProducts, totalProductsFeature, totalProductsActive },
        order: {
          ordersPending,
          ordersAccepted,
          ordersProcessing,
          ordersOutForDelivery,
          ordersCompleted,
          ordersCancelled,
        },
        revenue,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const getChartData = async (req, res) => {
  try {
    let { startDate, endDate, role, code, productId, vendorId } = req.query;
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

    if (productId) {
      match = { "cart.items.productId": productId };
    }
    if (vendorId) {
      match = { "cart.items.vendor": ObjectId(vendorId), ...match };
    }

    const chartData = await Order.aggregate([
      {
        $match: {
          $and: [match],
        },
      },
      {
        $addFields: {
          totalAvgQty: {
            $reduce: {
              input: "$cart.items",
              initialValue: 0,
              in: {
                $sum: ["$$value", "$$this.qty"],
              },
            },
          },
        },
      },
      {
        $addFields: {
          cartItemPriceWithQTy: {
            $reduce: {
              input: "$cart.items",
              initialValue: 0,
              in: {
                $sum: [
                  "$$value",
                  {
                    $multiply: ["$$this.qty", "$$this.price"],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          totalOrderValue: {
            $sum: "$cart.netCost",
          },
          averageOrderQuantity: {
            $avg: "$cart.totalQty",
          },
          averageOrderQty: {
            $avg: "$totalAvgQty",
          },
          totalPrice: {
            $sum: "$cartItemPriceWithQTy",
          },
        },
      },
      {
        $sort: {
          _id: 1,
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
    let { limit, vendor } = req.query;
    let { startDate, endDate, role, code, productId } = req.query;
    let dateObj = new Date();
    let priorDate =
      startDate ??
      new Date(new Date().setDate(dateObj.getDate() - 30))
        .toISOString()
        .slice(0, 10);
    const today = new Date();
    const tomorrow = endDate ?? new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    let match = {
      createdAt: { $gte: new Date(priorDate), $lte: tomorrow },
    };

    if (vendor) {
      match = { ...match, "cart.items.vendor": ObjectId(vendor) };
    }

    const topProducts = await Order.aggregate([
      {
        $unwind: {
          path: "$cart.items",
        },
      },
      // {
      //   $lookup: {
      //     from: "products",
      //     localField: "$cart.items.productId",
      //     foreignField: "_id",
      //     as: "productss",
      //   },
      // },
      // {
      //   $unwind: {
      //     path: "$productss",
      //   },
      // },
      {
        $match: {
          $and: [match],
        },
      },
      {
        $addFields: {
          totalPrice: {
            $multiply: ["$cart.items.price", "$cart.items.qty"],
          },
        },
      },

      {
        $group: {
          _id: "$cart.items.productId",
          title: {
            $first: "$cart.items.title",
          },
          price: {
            $first: "$cart.items.price",
          },
          qty: {
            $sum: "$cart.items.qty",
          },
          totalPrice: {
            $first: "$totalPrice",
          },
        },
      },
      {
        $sort: {
          totalPrice: -1,
        },
      },
      {
        $limit: +limit || 10,
      },
    ]);
    res.json({ data: topProducts });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};
const getTopCustomers = async (req, res) => {
  try {
    let { limit, vendor } = req.query;
    let { startDate, endDate, role, code, productId } = req.query;
    let dateObj = new Date();
    let priorDate =
      startDate ??
      new Date(new Date().setDate(dateObj.getDate() - 30))
        .toISOString()
        .slice(0, 10);
    const today = new Date();
    const tomorrow = endDate ?? new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    let match = {
      createdAt: { $gte: new Date(priorDate), $lte: tomorrow },
    };

    const topCustomers = await Order.aggregate([
      // {
      //   $match:match
      // },
      {
        $unwind: {
          path: "$cart.items",
        },
      },
      {
        $group: {
          _id: "$email",
          totalPurchase: {
            $sum: "$cart.items.price",
          },
          name: {
            $first: '$name'
          },
        },
      },
      {
        $sort: {
          totalPurchase: -1,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "email",
          as: "customerdetails",
        },
      },
    ]);
    res.json({ data: topCustomers });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};
const getTopVendors = async (req, res) => {
  try {
    let { limit, vendor } = req.query;
    let { startDate, endDate, role, code, productId } = req.query;
    let dateObj = new Date();
    let priorDate =
    startDate ??
    new Date(new Date().setDate(dateObj.getDate() - 30));
      const today = new Date();
    const tomorrow = endDate ?? today;
    tomorrow.setDate(tomorrow.getDate() + 1);
    let match = {
      createdAt: { $gte: priorDate },
      // "cart.items.vendor": ObjectId(vendor),
    };
    const topVendors = await Order.aggregate([
      {
        $match: match
      },
      {
        $unwind: {
          path: "$cart.items",
        },
      },
      {
        '$addFields': {
          'vendor': '$cart.items.vendor'
        }
      },
      
      {
        $group: {
          _id: "$vendor",
          price: {
            $sum: "$cart.items.price",
          },
          qty: {
            $sum: "$cart.items.qty",
          },
        },
      },
      {
        $sort: {
          price: -1,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "vendor",
        },
      },
      {
        $unwind: {
          path: "$vendor",
        },
      },
      {
        $project: {
          id: "$user",
          firstname: "$vendor.firstname",
          lastname: "$vendor.lastname",
          price: "$price",
          qty: "$qty",
        },
      },
      {
        $limit: parseInt(limit) || 10,
      },
    ]);
    res.json({ data: topVendors });
  } catch (error) {
    // console.log(JSON.stringify(error))
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
