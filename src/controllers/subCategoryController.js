const SubCategory = require("../models/sub_category");
const Product = require("../models/product");
const { searchInColumns, getQuery } = require("../utils");

const getAllSubCategories = async (req, res) => {
  try {
    let { page, limit, search, ...queries } = req.query;
    search = searchInColumns(search, ["title"]);
    queries = getQuery(queries);
    let myAggregate;
    if (!search) {
      myAggregate = SubCategory.aggregate([{ $match: { $and: [queries] } }]);
    } else {
      myAggregate = SubCategory.aggregate([
        { $match: { $and: [{ $or: search }, queries] } },
      ]);
    }

    const options = {
      page: page || 1,
      limit: limit || 10,
      sort: { createdAt: -1 },
    };

    const data = await SubCategory.aggregatePaginate(myAggregate, options);

    return res.status(200).send({
      message: "Successfully fetch SubCategories",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const getAllSubCategoriesWithoutFilter = async (req, res) => {
  try {
    const subCategories = await SubCategory.aggregate([
      {
        $match: req.query,
      },
      {
        $lookup: {
          from: "Category",
          localField: "_id",
          foreignField: "category",
          as: "category",
        },
      },
    ]);
    return res.json(subCategories);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const addSubCategory = async (req, res) => {
  try {
    const { title, isActive, isFeatured, rank, category } = req.body;
    const file = req.file;
    let data = await SubCategory.create({
      title,
      isActive,
      isFeatured,
      rank,
      category,
    });
    res.status(200).json({
      message: "Your subCategory has been Added Successfully.",
      data: data,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};
const getSubCategory = async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id);
    if (!subCategory)
      return res.status(404).send({ error: "SubCategory not found" });
    return res.json(subCategory);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const deleteSubCategory = async (req, res) => {
  try {
    await SubCategory.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "SubCategory has been deleted..." });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const updateSubCategory = async (req, res) => {
  try {
    const { title, isActive, isFeatured, rank, category } = req.body;
    const file = req.file;
    let data = await SubCategory.findByIdAndUpdate(req.params.id, {
      title,
      isActive,
      isFeatured,
      rank,
      category,
    });
    res.status(200).json({
      message: "SubCategory has been updated",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

module.exports = {
  getAllSubCategories,
  getAllSubCategoriesWithoutFilter,
  getSubCategory,
  addSubCategory,
  deleteSubCategory,
  updateSubCategory,
};
