const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        qty: {
          type: Number,
          default: 0,
        },
        price: {
          type: Number,
          default: 0,
        },
        profitMargin: {
          type: Number,
          default: 0,
        },
        title: {
          type: String,
        },
        productCode: {
          type: String,
        },
        stockCountPending: {
          type: Number,
        },
        stockCountConsumed: {
          type: Number,
        },
        totalSale: {
          type: Number,
        },
      },
    ],
    totalQty: {
      type: Number,
      default: 0,
      required: true,
    },
    totalCost: {
      type: Number,
      default: 0,
      required: true,
    },
    shippingCharges: {
      type: Number,
      default: 0,
    },
    totalProfitMargin: {
      type: Number,
      default: 0,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
