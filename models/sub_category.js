const mongoose = require("mongoose");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const Schema = mongoose.Schema;
const subCategorySchema = Schema(
  {
    title: {
      type: String,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    rank: {
      type: Number,
      default: 1,
    },

  },
  { timestamps: true }
);
subCategorySchema.plugin(aggregatePaginate);

module.exports = mongoose.model("SubCategory", subCategorySchema);
