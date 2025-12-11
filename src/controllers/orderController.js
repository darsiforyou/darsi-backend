const Order = require("../models/order");
const { searchInColumns, getQuery } = require("../utils");
const Referral_Package = require("../models/referral_packages");
const User = require("../models/user");
const Product = require("../models/product");
const Financial = require("../models/financial");
const mongoose = require("mongoose");
const axios = require("axios");
const ObjectId = mongoose.Types.ObjectId;

const getAllOrders = async (req, res) => {
  try {
    let { page, limit, search, vendorId, ...queries } = req.query;
    let orderSearch = { order_number: new RegExp(parseInt(search), "i") };

    search = searchInColumns(search, ["name", "email", "phone"]);
    queries = getQuery(queries);
    let items = "";
    if (vendorId) {
      id = ObjectId(vendorId);
      queries = { ...queries, "cart.items.vendor": id };
      items = {};
    }
    let myAggregate;
    let arr = [
      {
        $addFields: {
          items: "$cart.items",
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "prd",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "items.vendor",
          foreignField: "_id",
          as: "vendorDetail",
        },
      },
      {
        $addFields: {
          items: {
            $map: {
              input: "$items",
              in: {
                $mergeObjects: [
                  "$$this",
                  {
                    lineItems: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$prd",
                            as: "j",
                            cond: {
                              $eq: ["$$this.productId", "$$j._id"],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          items: {
            $map: {
              input: "$items",
              in: {
                $mergeObjects: [
                  "$$this",
                  {
                    vendorDetail: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$vendorDetail",
                            as: "j",
                            cond: {
                              $eq: ["$$this.vendor", "$$j._id"],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
    ];
    if (!search) {
      if (vendorId) {
        myAggregate = Order.aggregate([
          {
            $match: { $and: [queries] },
          },
          ...arr,
          {
            $addFields: {
              items: {
                $filter: {
                  input: "$items",
                  as: "j",
                  cond: {
                    $and: [
                      {
                        $eq: ["$$j.vendor", new ObjectId(vendorId)],
                      },
                    ],
                  },
                },
              },
            },
          },
        ]);
      } else {
        myAggregate = Order.aggregate([
          {
            $match: { $and: [queries] },
          },
          ...arr,
        ]);
      }
    } else {
      if (vendorId) {
        myAggregate = Order.aggregate([
          {
            $match: { $and: [{ $or: search }, queries] },
          },
          ...arr,
          {
            $addFields: {
              items: {
                $filter: {
                  input: "$items",
                  as: "j",
                  cond: {
                    $and: [
                      {
                        $eq: ["$$j.vendor", new ObjectId(vendorId)],
                      },
                    ],
                  },
                },
              },
            },
          },
        ]);
      } else {
        myAggregate = Order.aggregate([
          {
            $match: {
              $and: [
                {
                  $or: [...search, orderSearch],
                },
                queries,
              ],
            },
          },
          ...arr,
        ]);
      }
    }

    const options = {
      page: page || 1,
      limit: limit || 10,
      sort: { createdAt: -1 },
    };

    const data = await Order.aggregatePaginate(myAggregate, options);

    return res.status(200).send({
      message: "Successfully fetch Orders",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const getAllOrdersByItem = async (req, res) => {
  try {
    let { page, limit, search, vendorId, ...queries } = req.query;
    search = searchInColumns(search, ["user", "order_number"]);
    queries = getQuery(queries);
    let items = "";
    if (vendorId) {
      id = ObjectId(vendorId);
      queries = { ...queries, "cart.items.vendor": id };
      items = {};
    }
    let myAggregate;
    if (!search) {
      myAggregate = Order.aggregate([
        {
          $match: { $and: [queries] },
        },
        {
          $unwind: {
            path: "$cart.items",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "prd",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "items.vendor",
            foreignField: "_id",
            as: "vendorDetail",
          },
        },
      ]);
    }
    const options = {
      page: page || 1,
      limit: limit || 10,
      sort: { createdAt: -1 },
    };

    const data = await Order.aggregatePaginate(myAggregate, options);

    return res.status(200).send({
      message: "Successfully fetch Orders",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const createOrder = async (req, res) => {
  try {
    const {
      products,
      user,
      applied_Referral_Code,
      address,
      name,
      email,
      phone,
      city,
      postalCode,
      paymentMethod,
    } = req.body;
    let refData;
    let _package;
    let shippingCharges = city === "Karachi" ? 50 : 100;
    let totalCost = 0;
    let totalVendorCost = 0;
    let discount = 0;
    let totalQty = 0;
    let netCost = 0;
    let totalProfitMargin = 0;
    let allVendors = {};
    let referrer = { id: undefined, commission: 0 };

    for (const x of products) {
      totalCost += x.price * x.qty;
      totalVendorCost += x.vendorPrice * x.qty;
      netCost += x.price * x.qty;
      totalQty += x.qty;
      totalProfitMargin += x.profitMargin * x.qty; // ✅ include qty
      let stockCountPending = x.stockCountPending - x.qty;
      let stockCountConsumed = x.stockCountConsumed + x.qty;
      let totalPrice = x.qty * x.price;
      let totalSale = x.totalSale + totalPrice;

      // update vendor sold product quantity
      allVendors[x.vendor] = {
        id: x.vendor,
        commission:
          (allVendors[x.vendor]?.commission || 0) + x.qty * x.vendorPrice,
      };

      const vendorData = await User.findById(x.vendor);
      await User.findByIdAndUpdate(x.vendor, {
        totalVendorProductSold: vendorData.totalVendorProductSold + x.qty, // ✅ qty
      });

      // update product total sale
      await Product.updateOne(
        { _id: x.productId },
        {
          stockCountConsumed,
          stockCountPending,
          totalSale,
        }
      );
    }

    if (applied_Referral_Code) {
      refData = await User.findOne({
        user_code: applied_Referral_Code,
      });
    }
    if (refData) {
      _package = await Referral_Package.findById(refData.referral_package);
      discount = calculateDiscount(
        totalCost,
        totalVendorCost,
        _package.discount_percentage
      );
      netCost = totalCost - discount;

      // calculate commission for user based on total profit including qty
      let commission = (totalProfitMargin * Number(_package.commission)) / 100;

      referrer = { id: refData._id, commission };

      commission = commission + refData.commission;
      await User.findByIdAndUpdate(refData._id, {
        commission,
      });
    }
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const val = Math.floor(1000 + Math.random() * 9000);
    let order = {
      order_number: Number(dd + val),
      cart: {
        totalQty: totalQty,
        totalCost: totalCost + shippingCharges,
        discount: discount,
        netCost: netCost + shippingCharges,
        shippingCharges: shippingCharges,
        totalProfitMargin: totalProfitMargin,
        items: products,
      },
      address,
      name,
      email,
      phone,
      city,
      postalCode,
      paymentMethod: paymentMethod,
    };
    if (applied_Referral_Code) {
      order.applied_Referral_Code = applied_Referral_Code;
    }

    if (user) {
      order.user = user;
      const userData = await User.findById(user);
      await User.findByIdAndUpdate(user, {
        orderCount: (userData?.orderCount || 0) + 1,
        totalSale: userData.totalSale + netCost,
      });
    }

    let data = await Order.create(order);

    res.status(200).json({
      message: "Your order has been placed Successfully.",
      data: data,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
      data: {},
    });
  }
};

const createPayment = async (req, res) => {
  try {
    const {
      products,
      user,
      applied_Referral_Code,
      address,
      name,
      email,
      phone,
      city,
      postalCode,
      paymentMethod,
      shippingCharges,
    } = req.body;
    let refData;
    let _package;
    let totalCost = 0;
    let totalVendorCost = 0;
    let discount = 0;
    let totalQty = 0;
    let netCost = 0;
    let totalProfitMargin = 0;
    let allVendors = {};
    let referrer = { id: undefined, commission: 0 };
    const paymentproducts = [];

    for (const x of products) {
      totalCost += x.price * x.qty;
      totalVendorCost += x.vendorPrice * x.qty;
      netCost += x.price * x.qty;
      totalQty += x.qty;
      totalProfitMargin += x.profitMargin * x.qty; // ✅ include qty
      let stockCountPending = x.stockCountPending - x.qty;
      let stockCountConsumed = x.stockCountConsumed + x.qty;
      let totalPrice = x.qty * x.price;
      let totalSale = x.totalSale + totalPrice;
      x.amount_cents = x.price;
      x.quantity = x.qty;

      paymentproducts.push({
        LineItem: x.title,
        Quantity: x.qty,
        UnitPrice: x.price,
        SubTotal: x.price * x.qty,
      });

      // update vendor sold product quantity
      allVendors[x.vendor] = {
        id: x.vendor,
        commission:
          (allVendors[x.vendor]?.commission || 0) + x.qty * x.vendorPrice,
      };

      const vendorData = await User.findById(x.vendor);
      await User.findByIdAndUpdate(x.vendor, {
        totalVendorProductSold: vendorData.totalVendorProductSold + x.qty,
      });

      // update product total sale
      await Product.updateOne(
        { _id: x.productId },
        {
          stockCountConsumed,
          stockCountPending,
          totalSale,
        }
      );
    }

    if (paymentMethod === "PAYPRO") {
      const bankSurCharges =
        ((totalCost + shippingCharges - discount) * 2.75) / 100;
      const taxPaypro = Number((bankSurCharges * 13) / 100);
      const totalTax = Number(bankSurCharges + taxPaypro);
      const paybale = Number(totalCost + shippingCharges - discount + totalTax);

      netCost = paybale;
    } else {
      const paybale = Number(totalCost + shippingCharges - discount);
      netCost = paybale;
    }

    if (applied_Referral_Code) {
      refData = await User.findOne({
        user_code: applied_Referral_Code,
      });
    }
    if (refData) {
      _package = await Referral_Package.findById(refData.referral_package);

      discount = calculateDiscount(
        totalCost,
        totalVendorCost,
        _package.discount_percentage
      );
      netCost = netCost - discount;

      // ✅ Total profit including qty
      totalProfitMargin = products.reduce(
        (acc, item) => acc + item.profitMargin * item.qty,
        0
      );

      // calculate commission based on total profit
      let commission = (totalProfitMargin * Number(_package.commission)) / 100;

      referrer = { id: refData._id, commission };

      commission = commission + refData.commission;
      await User.findByIdAndUpdate(refData._id, {
        commission,
      });
    }

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const val = Math.floor(1000 + Math.random() * 9000);
    let order = {
      order_number: Number(dd + val),
      cart: {
        totalQty: totalQty,
        totalCost: totalCost + shippingCharges,
        discount: discount,
        netCost: Math.ceil(netCost),
        shippingCharges: shippingCharges,
        totalProfitMargin: totalProfitMargin,
        items: products,
      },
      address,
      name,
      email,
      phone,
      city,
      postalCode,
      paymentMethod,
    };
    if (applied_Referral_Code) {
      order.applied_Referral_Code = applied_Referral_Code;
    }

    if (user) {
      order.user = user;
      const userData = await User.findById(user);
      await User.findByIdAndUpdate(user, {
        orderCount: (userData?.orderCount || 0) + 1,
        totalSale: userData.totalSale + netCost,
      });
    }
    let data = await Order.create(order);
    let pktRes;

    const pMethods = { CARD: 47022, BANK: 47022, EP: 47022 };

    if (paymentMethod !== "COD") {
      const tokenRes = await axios.post(`${process.env.PAYPRO_URL}/auth`, {
        clientid: process.env.CLIENT_ID,
        clientsecret: process.env.CLIENT_SECRET,
      });
      const token = tokenRes.headers.token;

      let raw = [
        {
          MerchantId: "Darsi_Pk",
        },
        {
          OrderNumber: data.id,
          OrderAmount: Math.ceil(order.cart.netCost),
          OrderDueDate: new Date(),
          OrderType: "Service",
          IssueDate: new Date(),
          OrderExpireAfterSeconds: "0",
          CustomerName: order.name,
          CustomerMobile: order.phone,
          CustomerEmail: order.email,
          CustomerAddress: order.address,
          BillDetail01: paymentproducts,
        },
      ];

      const payment = await axios.post(`${process.env.PAYPRO_URL}/co`, raw, {
        headers: {
          token,
          "Content-Type": "application/json",
        },
        redirect: "follow",
      });
      pktRes = await payment.data;
    }

    const encodeURl = encodeURI("http://localhost:3000/payment/product");
    res.status(200).json({
      message: "Your order has been placed Successfully.",
      paymentToken:
        paymentMethod !== "COD"
          ? pktRes[1].Click2Pay + "&callback_url=" + encodeURl
          : "",
      data: data,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
      data: {},
    });
  }
};

function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    let order = await Order.findByIdAndUpdate(req.params.id, {
      orderStatus,
      paymentStatus: false,
    });
    if (orderStatus === "Delivered") {
      let order = await Order.findByIdAndUpdate(req.params.id, {
        orderStatus,
        paymentStatus: true,
      });
      let totalProfitMargin = 0;
      let allVendors = {};
      let referrer = { id: undefined, commission: 0 };

      for (const product of order.cart.items) {
        totalProfitMargin += product.profitMargin * product.qty; // ✅ include qty
        if (!isEmpty(allVendors)) {
          allVendors[product.vendor] = {
            id: product.vendor,
            commission:
              (allVendors[product.vendor]?.commission || 0) +
              product.vendorPrice * product.qty,
          };
        } else {
          allVendors[product.vendor] = {
            id: product.vendor,
            commission: product.vendorPrice * product.qty,
          };
        }
      }
      if (order.applied_Referral_Code !== "None") {
        let refData = await User.findOne({
          user_code: order.applied_Referral_Code,
        });
        let _package = await Referral_Package.findById(
          refData.referral_package
        );
        let commission =
          (totalProfitMargin * Number(_package.commission)) / 100;
        referrer = { id: refData._id, commission };

        await Financial.create({
          user: refData._id,
          order: order._id,
          amount: referrer.commission,
        });
      }

      for (const vendor of Object.values(allVendors)) {
        await Financial.create({
          user: vendor.id,
          order: order._id,
          amount: vendor.commission,
        });
      }
      await Financial.create({
        darsi: true,
        order: order._id,
        amount:
          totalProfitMargin - referrer.commission + order.cart.shippingCharges,
      });
    }
    if (orderStatus === "Sale Return") {
      let totalProfitMargin = 0;
      let allVendors = {};
      let referrer = { id: undefined, commission: 0 };

      for (const product of order.cart.items) {
        totalProfitMargin += product.profitMargin * product.qty;
        allVendors[product.vendor] = {
          id: product.vendor,
          commission: product.vendorPrice * product.qty,
        };
      }
      if (order.applied_Referral_Code !== "None") {
        let refData = await User.findOne({
          user_code: order.applied_Referral_Code,
        });
        let _package = await Referral_Package.findById(
          refData.referral_package
        );
        let commission =
          (totalProfitMargin * Number(_package.commission)) / 100;
        referrer = { id: refData._id, commission };

        await Financial.create({
          user: refData._id,
          order: order._id,
          amount: -referrer.commission,
        });
      }

      for (const vendor of Object.values(allVendors)) {
        await Financial.create({
          user: vendor.id,
          order: order._id,
          amount: -vendor.commission,
        });
      }
      await Financial.create({
        darsi: true,
        order: order._id,
        amount: -(totalProfitMargin - referrer.commission),
      });
    }
    res.status(200).json({ message: "Successfully Updated Order Status" });
  } catch (err) {
    res.status(500).json({
      message: err.message,
      data: {},
    });
  }
};

function calculateDiscount(totalCost, totalVendorCost, discount) {
  return (totalCost - totalVendorCost) * (discount / 100);
}

module.exports = {
  getAllOrders,
  getAllOrdersByItem,
  createOrder,
  createPayment,
  updateOrderStatus,
};
