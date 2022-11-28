const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const userBankAccountSchema = Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["Bank", "Jazz Cash", "Easy Paisa"],
    },
    bankName: {
      type: String,
    },
    holderName: {
      type: String,
      required: true,
    },
    account_number: {
      type: String,
      required: true,
    },
    iban: {
      type: String,
    },
  },
  { timestamps: true }
);

userBankAccountSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("userBankAccount", userBankAccountSchema);
