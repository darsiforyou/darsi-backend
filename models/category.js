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
    /// if rank is higher the category products will show on homepage
    // value enter in number. 1,2,3,.... 1 rank is higher thn 2 rank
    rank: {
      type: Number,
      default: 1,
    },

  },
  { timestamps: true }
);
categorySchema.plugin(aggregatePaginate);

module.exports = mongoose.model("Category", categorySchema);
