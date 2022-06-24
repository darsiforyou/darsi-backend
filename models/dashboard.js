const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Dashboard = Schema(
  {
    dashboard: {
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
      banner_button: {
        text: {
          type: String,
          required: false,
        },
      },
    },
    imagePath: {
      required: false,
      type: String,
    },
    fileId: {
      unique: false,
      type: String,
      required: false,
    },
    featured_product: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("dashboard", Dashboard);
