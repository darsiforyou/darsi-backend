const mongoose = require('mongoose');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

const packageUpgradeRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
    required: true,
    unique: true
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
  parent_request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PackageUpgradeRequest'
  },
  previous_requests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PackageUpgradeRequest'
  }]
}, {
  timestamps: true
});

// 添加聚合分页插件
packageUpgradeRequestSchema.plugin(aggregatePaginate);

const PackageUpgradeRequest = mongoose.model('PackageUpgradeRequest', packageUpgradeRequestSchema);

module.exports = PackageUpgradeRequest;