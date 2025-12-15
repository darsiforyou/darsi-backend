const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");



const userSchema = new Schema(
  {
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    // Main profile image
    imageURL: {
      type: String,
      default: null,
    },
    imageId: {
      type: String,
      default: null,
    },
    // Additional images (like media in products)
   
    // Payment screenshot fields
    paymentScreenshotURL: {
      type: String,
      default: null,
    },
    paymentScreenshotId: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      default: "Customer",
      enum: ["Customer", "Admin", "Referrer", "Vendor", "FeedAdmin"],
    },
    status: {
      type: Boolean,
      default: false,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
      required: true,
    },
    transaction_id: {
      type: String,
      default: null,
    },
    referral_package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Referral_Package",
    },
    referral_payment: {
      type: Number,
      default: 0,
    },
    referral_payment_status: {
      type: Boolean,
      default: false,
    },
    user_code: {
      type: String,
      default: null,
    },
    referred_by: {
      type: String,
      default: "",
    },
    commission: {
      type: Number,
      default: 0,
    },
    orderCount: {
      type: Number,
      default: 0,
    },
    totalSale: {
      type: Number,
      default: 0,
    },
    totalVendorProductSold: {
      type: Number,
      default: 0,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    upline: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    level: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);



// encrypt the password before storing
userSchema.methods.encryptPassword = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(5), null);
};

userSchema.methods.validPassword = function (candidatePassword) {
  if (this.password != null) {
    return bcrypt.compareSync(candidatePassword, this.password);
  } else {
    return false;
  }
};

userSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("User", userSchema);
