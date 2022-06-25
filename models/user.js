const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;

const userSchema = Schema(
  {
    firstname: {
      type: String,
      require: true,
    },
    lastname: {
      type: String,
      require: true,
    },
    email: {
      type: String,
      require: true,
    },
    password: {
      type: String,
      require: true,
    },
    role: {
      type: String,
      default: "Customer",
      enum: ["Customer", "Admin", "Referrer", "Vendor", "FeedAdmin"],
    }, //FeedAdmin kept for now can be removed later
    referral_package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Referral_Package",
    },
    user_code: {
      type: String,
      // unique: true,
    },
    referred_by: {
      type: String,
      default: "",
    },
    referral_benefit: {
      type: String,
      default: "",
    },
    refreshToken: {
      type: String,
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

module.exports = mongoose.model("User", userSchema);
