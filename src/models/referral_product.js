const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Product = require("../models/product").schema;

const referral_productSchema = Schema(
  {
    referral_productCode: {
      type: String,
      required: true,
      default: "not_required_will_remove_later",
    },
    title: {
      type: String,
      required: true,
    },
    productList: {
      type: [Product],
    },
    imagePath: {
      type: String,
      default:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRr3jUH9jcTlLug_s6b0x6ue-Rr0-atd7pjAQ&usqp=CAU",
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: false,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      default: "622dd7545fad380eb4349489", //TODO later on this field should be removed and data should be entried only after creating users
      ref: "Category",
    },
    available: {
      type: Boolean,
      required: true,
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

module.exports = mongoose.model("Referral_Product", referral_productSchema);
