const mongoose = require("mongoose");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const Schema = mongoose.Schema;
const subjectSchema = Schema(
  {
    title: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    imageURL: {
      type: String,
    },
    imageId: {
      type: String,
    },
  },
  { timestamps: true }
);
subjectSchema.plugin(aggregatePaginate);

module.exports = mongoose.model("Subject", subjectSchema);
