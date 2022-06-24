const Category = require("../models/category");

const getAllCategories = async (req, res) => {
  try {
    const Categories = await Category.find();
    if (!Categories.length)
      return res.status(404).send({ error: "Categories not found" });
    return res.json(Categories);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const addCategory = async (req, res) => {
  const newCategory = new Category(req.body);
  try {
    const savedCategory = await newCategory.save();
    res.status(200).json(savedCategory);
  } catch (err) {
    res.status(500).json(err);
  }
};
const getCategory = async (req, res) => {
  try {
    const Category = await Category.findById(req.params.id);
    if (!Category) return res.status(404).send({ error: "Category not found" });
    return res.json(Category);
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
const updateCategory = async (req, res) => {};

module.exports = {
  getAllCategories,
  getCategory,
  addCategory,
  deleteCategory,
  updateCategory,
};
