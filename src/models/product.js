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
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    },
    subject_name: {
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
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  },
  { timestamps: true }
);

productSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("Product", productSchema);
