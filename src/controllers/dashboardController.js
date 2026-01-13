const Order = require("../models/order");
const User = require("../models/user");
const Product = require("../models/product");
const Financial = require("../models/financial");
const PaymentRequest = require("../models/payment_requests");
const Milestone = require("../models/milestone");
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
        '$addFields': {
          'profit': {
            '$reduce': {
              'input': '$cart.items', 
              'initialValue': 0, 
              'in': {
                '$add': [
                  '$$value', '$$this.profitMargin'
                ]
              }
            }
          }
        }
      },
      {
        '$lookup': {
          'from': 'users', 
          'localField': 'applied_Referral_Code', 
          'foreignField': 'user_code', 
          'as': 'referralInfo'
        }
      }, {
        '$unwind': {
          'path': '$referralInfo'
        }
      }, {
        '$lookup': {
          'from': 'referral_packages', 
          'localField': 'referralInfo.referral_package', 
          'foreignField': '_id', 
          'as': 'referralPackage'
        }
      }, {
        '$unwind': {
          'path': '$referralPackage'
        }
      }, {
        '$addFields': {
          'referralCommission': {
            '$multiply': [
              '$profit', {
                '$divide': [
                  {
                    '$toInt': '$referralPackage.commission'
                  }, 100
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$cart.netCost",
          },
          totalProfitRefferal: {
            $sum: '$referralCommission'
          }

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
    const { code } = req.params;
    
    // Get referrer details including their commission package
    const referrer = await User.findOne({ user_code: code })
      .populate('referral_package')
      .lean();
    
    if (!referrer) {
      return res.status(404).json({ error: "Referrer not found" });
    }

    const referrerPackage = referrer.referral_package;
    const baseCommissionRate = referrerPackage ? parseInt(referrerPackage.activationCommission) : 0;

    // Get milestones for commission rates
    const milestones = await Milestone.findOne();
    const levelOneRate = milestones ? milestones.levelOne : 0;
    const levelTwoRate = milestones ? milestones.levelTwo : 0;
    const levelThreeRate = milestones ? milestones.levelThree : 0;

    // Level 1 - Direct referrals
    const userCustomerLevel1 = await User.countDocuments({
      role: "Customer",
      referred_by: code,
    });
    const userVendorLevel1 = await User.countDocuments({
      role: "Vendor",
      referred_by: code,
    });
    const userReferrerLevel1 = await User.countDocuments({
      role: "Referrer",
      referred_by: code,
    });

    // Level 2 - Find users referred by Level 1 users
    const level1Users = await User.find(
      { referred_by: code },
      { user_code: 1, _id: 1 }
    );
    const level1Codes = level1Users.map(user => user.user_code);
    const level1UserIds = level1Users.map(user => user._id);
    
    const userCustomerLevel2 = await User.countDocuments({
      role: "Customer",
      referred_by: { $in: level1Codes }
    });
    const userVendorLevel2 = await User.countDocuments({
      role: "Vendor",
      referred_by: { $in: level1Codes }
    });
    const userReferrerLevel2 = await User.countDocuments({
      role: "Referrer",
      referred_by: { $in: level1Codes }
    });

    // Level 3 - Find users referred by Level 2 users
    const level2Users = await User.find(
      { referred_by: { $in: level1Codes } },
      { user_code: 1, _id: 1 }
    );
    const level2Codes = level2Users.map(user => user.user_code);
    const level2UserIds = level2Users.map(user => user._id);
    
    const userCustomerLevel3 = await User.countDocuments({
      role: "Customer",
      referred_by: { $in: level2Codes }
    });
    const userVendorLevel3 = await User.countDocuments({
      role: "Vendor",
      referred_by: { $in: level2Codes }
    });
    const userReferrerLevel3 = await User.countDocuments({
      role: "Referrer",
      referred_by: { $in: level2Codes }
    });

    // Orders counts
    const ordersPending = await Order.countDocuments({
      orderStatus: "Pending",
      applied_Referral_Code: code,
    });
    const ordersAccepted = await Order.countDocuments({
      orderStatus: "Order Accepted",
      applied_Referral_Code: code,
    });
    const ordersProcessing = await Order.countDocuments({
      orderStatus: "Order Processing",
      applied_Referral_Code: code,
    });
    const ordersOutForDelivery = await Order.countDocuments({
      orderStatus: "Out For Delivery",
      applied_Referral_Code: code,
    });
    const ordersCompleted = await Order.countDocuments({
      orderStatus: "Delivered",
      applied_Referral_Code: code,
    });
    const ordersCancelled = await Order.countDocuments({
      orderStatus: "Cancelled",
      applied_Referral_Code: code,
    });

    // Get users with details for each level
    // Level 1 users
    const level1UserDetails = await User.find(
      { referred_by: code },
      { 
        firstname: 1, 
        lastname: 1, 
        email: 1, 
        phone: 1, 
        role: 1,
        user_code: 1,
        createdAt: 1
      }
    ).lean();

    // Level 2 users
    const level2UserDetails = await User.find(
      { referred_by: { $in: level1Codes } },
      { 
        firstname: 1, 
        lastname: 1, 
        email: 1, 
        phone: 1, 
        role: 1,
        user_code: 1,
        createdAt: 1,
        referred_by: 1
      }
    ).lean();

    // Level 3 users
    const level3UserDetails = await User.find(
      { referred_by: { $in: level2Codes } },
      { 
        firstname: 1, 
        lastname: 1, 
        email: 1, 
        phone: 1, 
        role: 1,
        user_code: 1,
        createdAt: 1,
        referred_by: 1
      }
    ).lean();

    // Calculate commission from each user
    // Function to get commission from a specific user
    const getCommissionFromUser = async (userId) => {
      const commissionData = await Financial.aggregate([
        {
          $match: {
            user: userId,
            type: "ACTIVATION"
          }
        },
        {
          $group: {
            _id: null,
            totalCommission: { $sum: "$amount" }
          }
        }
      ]);
      return commissionData.length > 0 ? commissionData[0].totalCommission : 0;
    };

    // Calculate commission for Level 1 users and their total commission
    let level1TotalCommission = 0;
    const level1UsersWithCommission = await Promise.all(
      level1UserDetails.map(async (user) => {
        const commission = await getCommissionFromUser(user._id);
        level1TotalCommission += commission;
        return {
          ...user,
          commission: commission
        };
      })
    );

    // Calculate commission for Level 2 users and their total commission
    let level2TotalCommission = 0;
    const level2UsersWithCommission = await Promise.all(
      level2UserDetails.map(async (user) => {
        const commission = await getCommissionFromUser(user._id);
        level2TotalCommission += commission;
        return {
          ...user,
          commission: commission
        };
      })
    );

    // Calculate commission for Level 3 users and their total commission
    let level3TotalCommission = 0;
    const level3UsersWithCommission = await Promise.all(
      level3UserDetails.map(async (user) => {
        const commission = await getCommissionFromUser(user._id);
        level3TotalCommission += commission;
        return {
          ...user,
          commission: commission
        };
      })
    );

    // Also calculate commission from orders for each level
    // Level 1 commission from orders (direct referrals)
    const level1OrderCommissionData = await Order.aggregate([
      {
        $match: {
          orderStatus: "Delivered",
          applied_Referral_Code: code
        }
      },
      {
        $addFields: {
          profit: {
            $reduce: {
              input: '$cart.items',
              initialValue: 0,
              in: { $add: ['$$value', '$$this.profitMargin'] }
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "applied_Referral_Code",
          foreignField: "user_code",
          as: "referralInfo"
        }
      },
      {
        $unwind: "$referralInfo"
      },
      {
        $lookup: {
          from: "referral_packages",
          localField: "referralInfo.referral_package",
          foreignField: "_id",
          as: "referralPackage"
        }
      },
      {
        $unwind: "$referralPackage"
      },
      {
        $addFields: {
          orderCommission: {
            $multiply: [
              '$profit',
              { $divide: [{ $toInt: '$referralPackage.commission' }, 100] }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalOrderCommission: { $sum: "$orderCommission" },
          totalSales: { $sum: "$cart.netCost" },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    // Level 2 commission from orders
    const level2OrderCommissionData = await Order.aggregate([
      {
        $match: {
          orderStatus: "Delivered",
          applied_Referral_Code: { $in: level1Codes }
        }
      },
      {
        $addFields: {
          profit: {
            $reduce: {
              input: '$cart.items',
              initialValue: 0,
              in: { $add: ['$$value', '$$this.profitMargin'] }
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "applied_Referral_Code",
          foreignField: "user_code",
          as: "referralInfo"
        }
      },
      {
        $unwind: "$referralInfo"
      },
      {
        $lookup: {
          from: "referral_packages",
          localField: "referralInfo.referral_package",
          foreignField: "_id",
          as: "referralPackage"
        }
      },
      {
        $unwind: "$referralPackage"
      },
      {
        $addFields: {
          orderCommission: {
            $multiply: [
              '$profit',
              { $divide: [{ $toInt: '$referralPackage.commission' }, 100] }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalOrderCommission: { $sum: "$orderCommission" },
          totalSales: { $sum: "$cart.netCost" },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    // Level 3 commission from orders
    const level3OrderCommissionData = await Order.aggregate([
      {
        $match: {
          orderStatus: "Delivered",
          applied_Referral_Code: { $in: level2Codes }
        }
      },
      {
        $addFields: {
          profit: {
            $reduce: {
              input: '$cart.items',
              initialValue: 0,
              in: { $add: ['$$value', '$$this.profitMargin'] }
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "applied_Referral_Code",
          foreignField: "user_code",
          as: "referralInfo"
        }
      },
      {
        $unwind: "$referralInfo"
      },
      {
        $lookup: {
          from: "referral_packages",
          localField: "referralInfo.referral_package",
          foreignField: "_id",
          as: "referralPackage"
        }
      },
      {
        $unwind: "$referralPackage"
      },
      {
        $addFields: {
          orderCommission: {
            $multiply: [
              '$profit',
              { $divide: [{ $toInt: '$referralPackage.commission' }, 100] }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalOrderCommission: { $sum: "$orderCommission" },
          totalSales: { $sum: "$cart.netCost" },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    // Calculate totals
    const totalUserCustomer = userCustomerLevel1 + userCustomerLevel2 + userCustomerLevel3;
    const totalUserVendor = userVendorLevel1 + userVendorLevel2 + userVendorLevel3;
    const totalUserReferrer = userReferrerLevel1 + userReferrerLevel2 + userReferrerLevel3;
    
    const level1OrderCommission = level1OrderCommissionData.length > 0 ? level1OrderCommissionData[0].totalOrderCommission : 0;
    const level2OrderCommission = level2OrderCommissionData.length > 0 ? level2OrderCommissionData[0].totalOrderCommission : 0;
    const level3OrderCommission = level3OrderCommissionData.length > 0 ? level3OrderCommissionData[0].totalOrderCommission : 0;
    
    // Total commission from activation + orders
    const level1TotalCommissionWithOrders = level1TotalCommission + level1OrderCommission;
    const level2TotalCommissionWithOrders = level2TotalCommission + level2OrderCommission;
    const level3TotalCommissionWithOrders = level3TotalCommission + level3OrderCommission;
    
    const totalCommission = level1TotalCommissionWithOrders + level2TotalCommissionWithOrders + level3TotalCommissionWithOrders;

    // Response structure
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
        users: { 
          // Frontend compatible - same structure
          userCustomer: totalUserCustomer,
          userVendor: totalUserVendor,  
          userReferrer: totalUserReferrer,
          
          // Detailed breakdown with commission and user details
          level1: {
            userCustomer: userCustomerLevel1,
            userVendor: userVendorLevel1,
            userReferrer: userReferrerLevel1,
            commission: level1TotalCommissionWithOrders,
            commissionRate: levelOneRate,
            users: level1UsersWithCommission,
            orderCommission: level1OrderCommission,
            activationCommission: level1TotalCommission
          },
          level2: {
            userCustomer: userCustomerLevel2,
            userVendor: userVendorLevel2,
            userReferrer: userReferrerLevel2,
            commission: level2TotalCommissionWithOrders,
            commissionRate: levelTwoRate,
            users: level2UsersWithCommission,
            orderCommission: level2OrderCommission,
            activationCommission: level2TotalCommission
          },
          level3: {
            userCustomer: userCustomerLevel3,
            userVendor: userVendorLevel3,
            userReferrer: userReferrerLevel3,
            commission: level3TotalCommissionWithOrders,
            commissionRate: levelThreeRate,
            users: level3UsersWithCommission,
            orderCommission: level3OrderCommission,
            activationCommission: level3TotalCommission
          }
        },
        // Additional summary without breaking frontend structure
        commissionSummary: {
          totalCommission: totalCommission,
          level1: {
            total: level1TotalCommissionWithOrders,
            activation: level1TotalCommission,
            orders: level1OrderCommission
          },
          level2: {
            total: level2TotalCommissionWithOrders,
            activation: level2TotalCommission,
            orders: level2OrderCommission
          },
          level3: {
            total: level3TotalCommissionWithOrders,
            activation: level3TotalCommission,
            orders: level3OrderCommission
          }
        }
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
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

    // this query is fetching payment requested and accepted
    const TPR = await PaymentRequest.aggregate([
      {
        // $match: { status: "Accepted", user: id },
        $match: { user: id },
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
      {
        $addFields: {
          amountRemaining: {
            $subtract: [
              '$amountRequested', '$amountAccepted'
            ]
          }
        }
      }
    ]);
    // Total Amount of Pending Orders
    const TOPA = await Order.aggregate([
      {
        $unwind: {
          path: "$cart.items",
        },
      },
      {
        $match: {
          $and: [
            {
              "cart.items.vendor": id,
            },
            {
              orderStatus: "Pending",
            },
          ],
        },
      },
      {
        $addFields: {
          vendorPrice: "$cart.items.vendorPrice",
          qty: "$cart.items.qty",
        },
      },
      {
        $group: {
          _id: "$_id",
          totalPendingOrderAmount: {
            $sum: {
              $multiply: ["$vendorPrice", "$qty"],
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$totalPendingOrderAmount",
          },
        },
      },
    ]);
    console.log('vendor id=', id);

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
    // console.log(financial.total, 'tottt')

    const revenue = {
      walletAmount: financial.total - paymentRequest.amountAccepted,
      withdraw: paymentRequest.amountAccepted,
      // pendingAmount: TOPA[0].total,
      pendingAmount: paymentRequest.amountRequested  - paymentRequest.amountAccepted,
      total: financial.total
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
    const tomorrow = new Date(endDate) ?? new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    let and = [
      {
        createdAt: { $gte: new Date(priorDate), $lte: tomorrow },
      },
    ];
    let match = {
      createdAt: { $gte: new Date(priorDate), $lt: new Date(todayDate) },
    };
    if (role === "Referrer") {
      match = {
        $and: [
          {
            applied_Referral_Code: code,
            createdAt: { $gte: new Date(priorDate), $lte: new Date(todayDate) },
          },
        ],
      };
      and.push({ applied_Referral_Code: code });
    }

    if (productId) {
      match = { "cart.items.productId": productId, ...matchMedia };
      and.push({ "cart.items.productId": productId });
    }
    if (vendorId) {
      match = { "cart.items.vendor": ObjectId(vendorId), ...match };
      and.push({ "cart.items.vendor": ObjectId(vendorId) });
    }

    const chartData = await Order.aggregate([
      {
        $unwind: {
          path: "$cart.items",
        },
      },
      {
        $match: {
          $and: and,
        },
      },
      {
        $addFields: {
          totalAvgQty: "$cart.items.qty",
        },
      },
      {
        $addFields: {
          cartItemVendorPriceWithQTy: {
            $multiply: ["$cart.items.qty", "$cart.items.vendorPrice"],
          },
        },
      },
      {
        $addFields: {
          cartItemPriceWithQTy: {
            $multiply: ["$cart.items.qty", "$cart.items.price"],
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
          totalOrderValueVendor: {
            $sum: "$cartItemPriceWithQTy",
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
    res.status(500).json({ error: err.message });
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
            $first: "$name",
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
      {
        $limit: +limit || 10,
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
      startDate ?? new Date(new Date().setDate(dateObj.getDate() - 30));
    const today = new Date();
    const tomorrow = endDate ?? today;
    tomorrow.setDate(tomorrow.getDate() + 1);
    let match = {
      createdAt: { $gte: priorDate },
      // "cart.items.vendor": ObjectId(vendor),
    };
    const topVendors = await Order.aggregate([
      {
        $match: match,
      },
      {
        $unwind: {
          path: "$cart.items",
        },
      },
      {
        $addFields: {
          vendor: "$cart.items.vendor",
        },
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
