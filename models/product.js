const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = Schema(
  {
    productCode: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    imageURL: {
      type: String,
    },
    imageId: {
      type: String,
    },
    profitMargin: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      required: false,
    },
    vendorPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
    },
    totalSale: {
      type: Number,
      default: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    manufacturer: {
      type: String,
    },
    available: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    stockCountPending: {
      type: Number,
      required: true,
      default: 0,
    },
    stockCountConsumed: {
      type: Number,
      required: true,
      default: 0,
    },
    stockCountInOrderTransit: {
      type: Number,
      required: true,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: "62016d83fae21e29a43aa7aa", //TODO later on this field should be removed and data should be entried only after creating users
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
