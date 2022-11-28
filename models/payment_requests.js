const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const paymentRequestSchema = Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    darsi: {
      type: Boolean,
      default: false,
    },
    amountAccepted: {
      type: Number,
      default: 0,
      required: true,
    },
    amountRequested: {
      type: Number,
      default: 0,
      required: true,
    },
    status: {
      type: String,
      default: "Pending",
      enum: [
        "Pending",
        "Rejected",
        "Accepted",
      ],
    },
  },
  { timestamps: true }
);
paymentRequestSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("PaymentRequest", paymentRequestSchema);
