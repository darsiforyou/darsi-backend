const DS = require("../models/dashboard");
const { searchInColumns, getQuery } = require("../utils");
const imagekit = require("../config/imagekit");

const getAllDS = async (req, res) => {
  try {
    let { page, limit, search, ...queries } = req.query;
    search = searchInColumns(search, ["title", "description"]);
    queries = getQuery(queries);
    let myAggregate;
    if (!search) {
      myAggregate = User.aggregate([{ $match: { $and: [queries] } }]);
    } else {
      myAggregate = User.aggregate([
        { $match: { $and: [{ $or: search }, queries] } },
      ]);
    }

    const options = {
      page: page || 1,
      limit: limit || 10,
    };

    const data = await DS.aggregatePaginate(myAggregate, options);

    return res.status(200).send({
      message: "Successfully fetch DS",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const getAllDSWithoutFilter = async (req, res) => {
  try {
    const data = await DS.find();
    return res.status(200).send({
      message: "Successfully fetch DS",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const addDS = async (req, res) => {
  try {
    const { title, sub_title, description, btn_text } = req.body;
    const file = req.file;
    let data = await DS.create({
      title,
      sub_title,
      description,
      btn_text,
    });
    if (file && data._id) {
      let img = await imagekit.upload({
        file: file.buffer, //required
        fileName: file.originalname, //required
        folder: "/DS",
      });
      data = await DS.findByIdAndUpdate(data.id, {
        imageURL: img.url,
        imageId: img.fileId,
      });
    }
    res.status(200).json({
      message: "Your DS has been Added Successfully.",
      data: data,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};
const getDS = async (req, res) => {
  try {
    const Referral_Package = await DS.findById(req.params.id);
    if (!Referral_Package)
      return res.status(404).send({ error: "DS not found" });
    return res.json(Referral_Package);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const deleteDS = async (req, res) => {
  try {
    await DS.findByIdAndDelete(req.params.id);
    res.status(200).json("DS has been deleted...");
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const updateDS = async (req, res) => {
  try {
    const { title, sub_title, description, btn_text } = req.body;
    const file = req.file;
    let data = await DS.findByIdAndUpdate(req.params.id, {
      title,
      sub_title,
      description,
      btn_text,
    });
    if (file !== undefined) {
      const { imageId } = data;
      if (imageId) await imagekit.deleteFile(imageId);
      let img = await imagekit.upload({
        file: file.buffer, //required
        fileName: file.originalname, //required
      });
      data = await DS.findByIdAndUpdate(data.id, {
        imageURL: img.url,
        imageId: img.fileId,
      });
    }
    res.status(200).json({
      message: "DS has been updated",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

module.exports = {
  getAllDS,
  getAllDSWithoutFilter,
  getDS,
  addDS,
  deleteDS,
  updateDS,
};
