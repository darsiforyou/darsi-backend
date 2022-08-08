const Category = require("../models/category");
const { searchInColumns, getQuery } = require("../utils");
const imagekit = require("../config/imagekit");

const getAllCategories = async (req, res) => {
  try {
    let { page, limit, search, ...quries } = req.query;
    search = searchInColumns(search, ["title"]);
    quries = getQuery(quries);
    const myAggrigate = await Category.aggregate([
      { $match: { $and: [{ $or: search }, quries] } },
    ]);

    const options = {
      page: page || 1,
      limit: limit || 10,
    };

    const data = await Category.aggregatePaginate(myAggrigate, options);

    return res.status(200).send({
      message: "Successfully fetch Categories",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const getAllCategoriesWithoutFilter = async (req, res) => {
  try {
    const categories = await Category.find(req.query);
    return res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const addCategory = async (req, res) => {
  try {
    const { title, isActive, isFeatured, rank } = req.body;
    const file = req.file;
    let data = await Category.create({
      title,
      isActive,
      isFeatured,
      rank,
    });
    if (file && data._id) {
      let img = await imagekit.upload({
        file: file.buffer, //required
        fileName: file.originalname, //required
        folder: "/Category",
      });
      data = await Category.findByIdAndUpdate(data.id, {
        imageURL: img.url,
        imageId: img.fileId,
      });
    }
    res.status(200).json({
      message: "Your category has been Added Successfully.",
      data: data,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};
const getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).send({ error: "Category not found" });
    return res.json(category);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json("Category has been deleted...");
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const updateCategory = async (req, res) => {
  try {
    const { title, isActive, isFeatured, rank } = req.body;
    const file = req.file;
    let data = await Category.findByIdAndUpdate(req.params.id, {
      title,
      isActive,
      isFeatured,
      rank,
    });
    if (file !== undefined) {
      const { imageId } = data;
      if (imageId) await imagekit.deleteFile(imageId);
      let img = await imagekit.upload({
        file: file.buffer, //required
        fileName: file.originalname, //required
      });
      data = await Category.findByIdAndUpdate(data.id, {
        imageURL: img.url,
        imageId: img.fileId,
      });
    }
    res.status(200).json({
      message: "Category has been updated",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

module.exports = {
  getAllCategories,
  getAllCategoriesWithoutFilter,
  getCategory,
  addCategory,
  deleteCategory,
  updateCategory,
};
