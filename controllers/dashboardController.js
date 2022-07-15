const Order = require("../models/order");

const getPendingAndCompletedOrders = async (req, res) => {
  try {
    const ordersCompleted = await Order.countDocuments({
      orderStatus: "Delivered",
    });
    const ordersPending = await Order.countDocuments({
      orderStatus: "Pending",
    });

    console.log(ordersCompleted, ordersPending);
    res.json({ data: { orders: { ordersCompleted, ordersPending } } });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

module.exports = { getPendingAndCompletedOrders };
