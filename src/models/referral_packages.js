const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const referral_packages_schema = Schema(
  {
    title: {
      type: String,
      required: true,
    },
    imageURL: {
      type: String,
      default:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRr3jUH9jcTlLug_s6b0x6ue-Rr0-atd7pjAQ&usqp=CAU",
    },
    image_id: {
      type: String,
    },
    valid_time: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: false,
    },
    discount_percentage: {
      type: String,
      required: false,
    },
    commission: {
      type: String,
      required: false,
    },
    referral_benefits: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);
referral_packages_schema.plugin(aggregatePaginate);

module.exports = mongoose.model("Referral_Package", referral_packages_schema);
