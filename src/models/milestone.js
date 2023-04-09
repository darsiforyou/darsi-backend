const mongoose = require('mongoose');

const { Schema } = mongoose;


const milestoneSchema = Schema(
  {
    levelOne: {
      type: Number,
      required: true,
    },
    levelTwo: {
      type: Number,
      required: true,
    },
    levelThree: {
      type: Number,
      required: true,
    },
    levelFour: {
      type: Number,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Milestone', milestoneSchema);
