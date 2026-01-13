// models/packageActivation.js
const mongoose = require('mongoose');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

const packageActivationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['activation', 'upgrade'],
    required: true,
    default: 'activation'
  },
  current_package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'referral_packages'
  },
  requested_package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'referral_packages',
    required: true
  },
  transaction_id: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentScreenshotURL: {
    type: String,
    required: true
  },
  paymentScreenshotId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  remarks: {
    type: String
  },
  processed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  is_first_time: {
    type: Boolean,
    default: false
  },
  is_current_package: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// 添加聚合分页插件
packageActivationSchema.plugin(aggregatePaginate);

const PackageActivation = mongoose.model('PackageActivation', packageActivationSchema);

module.exports = PackageActivation;