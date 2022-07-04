const mongoose = require("mongoose");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const Schema = mongoose.Schema;
const categorySchema = Schema(
  {
    title: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
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
categorySchema.plugin(aggregatePaginate);

module.exports = mongoose.model("Category", categorySchema);
