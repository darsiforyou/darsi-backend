const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const Dashboard = Schema(
  {
    title: {
      type: String,
      required: true,
    },
    sub_title: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    btn_text: {
      type: String,
      required: false,
    },
    imageURL: {
      required: false,
      type: String,
    },
    imageId: {
      unique: false,
      type: String,
      required: false,
    },
    // featured_product: [
    //   {
    //     productId: {
    //       type: mongoose.Schema.Types.ObjectId,
    //       ref: "Product",
    //     },
    //   },
    // ],
  },
  { timestamps: true }
);
Dashboard.plugin(aggregatePaginate);

module.exports = mongoose.model("dashboard", Dashboard);
