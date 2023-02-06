const mongoose = require("mongoose");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const Schema = mongoose.Schema;
const shippingSchema = Schema(
  {
    inCity: {
      type: Number,
    },
    outCity: {
      type: Number,
    },
  },
  { timestamps: true }
);
shippingSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("Shipping", shippingSchema);
