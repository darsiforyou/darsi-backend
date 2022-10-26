const mongoose = require("mongoose");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

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
    media: [
      {
        imageURL: { type: String },
        imageId: { type: String },
        isFront: { type: Boolean },
      },
    ],
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
    category_name: {
      type: String,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
    },
    brand_name: {
      type: String,
    },
    tags: {
      type: String,
    },
    options: [
      {
        key: { type: String },
        values: [
          {
            type: String,
          },
        ],
      },
    ],
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    vendor_name: {
      type: String,
    },
    isbn: {
      type: String,
    },
    available: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
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

productSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("Product", productSchema);
