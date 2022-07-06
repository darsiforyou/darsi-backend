const Order = require("../models/order");
const { searchInColumns, getQuery } = require("../utils");
const Referral_Package = require("../models/referral_packages");
const User = require("../models/user");
const Product = require("../models/product");

const getAllOrders = async (req, res) => {
  try {
    let { page, limit, search, ...quries } = req.query;
    search = searchInColumns(search, ["user"]);
    quries = getQuery(quries);
    const myAggrigate = await Order.aggregate([
      { $match: { $and: [{ $or: search }, quries] } },
    ]);

    const options = {
      page: page || 1,
      limit: limit || 10,
    };

    const data = await Order.aggregatePaginate(myAggrigate, options);

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
    const { products, user, applied_Referral_Code, address, name, email } =
      req.body;
    let userData;
    let _package;
    let totalCost = 0;
    let discount = 0;
    let totalQty = 0;
    let netCost = 0;
    let totalProfitMargin = 0;

    for (const x of products) {
      totalCost = totalCost + x.price;
      netCost = netCost + x.price;
      totalQty = totalQty + x.qty;
      totalProfitMargin = totalProfitMargin + x.profitMargin;
      let stockCountPending = x.stockCountPending - x.qty;
      let stockCountConsumed = x.stockCountConsumed + x.qty;
      let totalPrice = x.qty * x.price;
      let totalSale = x.totalSale + totalPrice;
      // update product total sale
      await Product.updateOne(
        { _id: x.productId },
        {
          stockCountConsumed: stockCountConsumed,
          stockCountPending: stockCountPending,
          totalSale: totalSale,
        }
      );
    }
    if (applied_Referral_Code) {
      userData = await User.findOne({
        user_code: applied_Referral_Code,
      }).select("_id firstname lastname email role user_code referral_package");
    }
    if (userData) {
      _package = await Referral_Package.findById(userData.referral_package);
      discount = (totalCost * Number(_package.discount_percentage)) / 100;
      netCost = totalCost - discount;
    }
    let order = {
      cart: {
        totalQty: totalQty,
        totalCost: totalCost,
        discount: discount,
        netCost: netCost,
        totalProfitMargin: totalProfitMargin,
        items: products,
      },
      address,
      name,
      email,
    };
    if (applied_Referral_Code) {
      order.applied_Referral_Code = applied_Referral_Code;
    }
    if (user) {
      order.user = user;
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
const getOrder = async (req, res) => {
  try {
    const data = await Order.findById(req.params.id);
    if (!data) return res.status(404).send({ error: "Order not found" });
    return res.json(data);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const deleteOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.status(200).json("Order has been deleted...");
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

module.exports = {
  getAllOrders,
  getOrder,
  deleteOrder,
  createOrder,
};
