const Milestone = require("../models/milestone");
const { searchInColumns, getQuery } = require("../utils");

const getAllMS = async (req, res) => {
  try {
    const data = await Milestone.find();
    return res.status(200).send({
      message: "Successfully fetch Milestones",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const addMilestone = async (req, res) => {
  try {
    const { levelOne, levelTwo, levelThree } = req.body;
    const file = req.file;
    let data = await Milestone.create({
        levelOne,
        levelTwo,
        levelThree
    });
    res.status(200).json({
      message: "Your Milestone has been Added Successfully.",
      data: data,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};
const getMilestone = async (req, res) => {
  try {
    const Milestone = await Milestone.findById(req.params.id);
    if (!Milestone) return res.status(404).send({ error: "Milestone not found" });
    return res.json(Milestone);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const deleteMilestone = async (req, res) => {
  try {
    await Milestone.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Milestone has been deleted..." });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const updateMilestone = async (req, res) => {
  try {
    const { levelOne, levelTwo, levelThree } = req.body;
    let data = await Milestone.findByIdAndUpdate(req.params.id, {
        levelOne,
        levelTwo,
        levelThree
    });
    res.status(200).json({
      message: "Milestone has been updated",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

module.exports = {
  getAllMS,
  getMilestone,
  addMilestone,
  deleteMilestone, 
  updateMilestone,
};
