const mongoose = require("mongoose");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const Schema = mongoose.Schema;
const brandSchema = Schema(
  {
    title: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    imageURL: {
      type: String,
    },
    imageId: {
      type: String,
    },
  },
  { timestamps: true }
);
brandSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("Brand", brandSchema);
