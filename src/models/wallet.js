const mongoose = require("mongoose");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const Schema = mongoose.Schema;
const walletSchema = Schema(
  {
    minAmount: {
      type: Number,
    },
  },
  { timestamps: true }
);
walletSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("Wallet", walletSchema);
