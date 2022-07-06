const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const orderSchema = Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    cart: {
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
      discount: {
        type: Number,
        default: 0,
        required: true,
      },
      netCost: {
        type: Number,
        default: 0,
        required: true,
      },
      totalProfitMargin: {
        type: Number,
        default: 0,
        required: true,
      },
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
        },
      ],
    },
    address: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    paymentId: {
      type: String,
      required: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    orderStatus: {
      type: String,
      default: "Pending",
      enum: [
        "Pending",
        "Order Accepted",
        "Order Processing",
        "Delivered",
        "Out For Delivery",
        "Cancelled",
      ],
    },
    applied_Referral_Code: {
      type: String,
      default: "None",
    },
  },
  { timestamps: true }
);
orderSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("Order", orderSchema);
