const Category = require("../models/category");
const Product = require("../models/product");
const { searchInColumns, getQuery } = require("../utils");
const imagekit = require("../config/imagekit");
const slugify = require("slugify");
const shortid = require("shortid");
function createCategories(categories, parentId = null) {
  const categoryList = [];
  let category;
  if (parentId == null) {
    category = categories.filter((cat) => cat.parentId == undefined);
  } else {
    category = categories.filter((cat) => cat.parentId == parentId);
  }

  for (let cate of category) {
    categoryList.push({
      _id: cate._id,
      title: cate.title,
      slug: cate.slug,
      parentId: cate.parentId,
      isActive: cate.isActive,
      isFeatured: cate.isFeatured,
      // type: cate.type,
      children: createCategories(categories, cate._id),
    });
  }

  return categoryList;
}
const getCategories = (req, res) => {
  Category.find({}).exec((error, categories) => {
    if (error) return res.status(400).json({ error });
    if (categories) {
      const categoryList = createCategories(categories);
      res.status(200).json({ categoryList });
    }
  });
};
const getAllCategories = async (req, res) => {
  try {
    let { page, limit, search, ...queries } = req.query;
    search = searchInColumns(search, ["title"]);
    queries = getQuery(queries);
    let myAggregate;
    if (!search) {
      myAggregate = Category.aggregate([{ $match: { $and: [queries] } }]);
    } else {
      myAggregate = Category.aggregate([
        { $match: { $and: [{ $or: search }, queries] } },
      ]);
    }

    const options = {
      page: page || 1,
      limit: limit || 10,
      sort: { createdAt: -1 },
    };

    const data = await Category.aggregatePaginate(myAggregate, options);

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
    // const categories = await Category.find(req.query).sort({ rank: 1 });
    // let categoryId = await Category.find().select("_id").sort({ rank: 1 });
    // console.log(categoryId);
    // const ids = categoryId.map((categoryId) => categoryId._id);
    // console.log(ids);
    // const productCat = await Product.find({ category: { $in: ids } })
    //   .populate("category")
    //   .lean();
    // const products = await Product.find();
    const categories = await Category.aggregate([
      {
        $match: req.query,
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "category",
          as: "products",
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          products: { $size: "$products" },
          imageId: 1,
          imageURL: 1,
          isFeatured: 1,
          rank: 1,
          isActive: 1,
        },
      },
      { $sort: { rank: 1 } }
    ]);
    return res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const addCategory = async (req, res) => {
  try {
    const { title, isActive, isFeatured, rank, parentId } = req.body;
    const file = req.file;
    let data = await Category.create({
      title,
      isActive,
      isFeatured,
      slug: `${slugify(req.body.title)}-${shortid.generate()}`,
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
    if (parentId) {
      data = await Category.findByIdAndUpdate(data.id, {
        parentId,
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
    res.status(200).json({ message: "Category has been deleted..." });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const updateCategory = async (req, res) => {
  try {
    const { title, isActive, isFeatured, rank, parentId } = req.body;
    const file = req.file;
    let data = await Category.findByIdAndUpdate(req.params.id, {
      title,
      isActive,
      isFeatured,
      rank,
    });
    if (parentId) {
      data = await Category.findByIdAndUpdate(data.id, {
        parentId,
      });
    }
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
  getCategories,
  addCategory,
  deleteCategory,
  updateCategory,
};
