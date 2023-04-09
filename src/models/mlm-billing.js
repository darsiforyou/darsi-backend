const mongoose = require('mongoose');

const { Schema } = mongoose;
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

const MLMBilling = Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentType: {
      type: String,
      enum: ['Level1', 'Level2', 'Level3'],
      required: true,
    },
    refferalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

  },
  { timestamps: true },
);
MLMBilling.plugin(aggregatePaginate);

module.exports = mongoose.model('MLMBilling', MLMBilling);
