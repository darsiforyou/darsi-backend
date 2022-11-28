const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const financialSchema = Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    darsi: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
    amount: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  { timestamps: true }
);
financialSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("Financial", financialSchema);