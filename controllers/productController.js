const Product = require("../models/product");
const { faker } = require("@faker-js/faker");
const imagekit = require("../config/imagekit");
const { searchInColumns, getQuery } = require("../utils");
const getAllProducts = async (req, res) => {
  try {
    let { page, limit, search, ...queries } = req.query;
    search = searchInColumns(search, ["title", "description"]);
    queries = getQuery(queries);
    let myAggregate;
    if (!search) {
      myAggregate = Product.aggregate([
        { $match: { $and: [queries] } },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categories",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "vendor",
            foreignField: "_id",
            as: "vendors",
          },
        },
      ]);
    } else {
      myAggregate = Product.aggregate([
        { $match: { $and: [{ $or: search }, queries] } },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "vendor",
            foreignField: "_id",
            as: "vendor",
          },
        },
      ]);
    }

    const options = {
      page: page || 1,
      limit: limit || 10,
    };

    const data = await Product.aggregatePaginate(myAggregate, options);

    return res.status(200).send({
      message: "Successfully fetch products",
      data: data,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
};
const getAllProductWithoutFilter = async (req, res) => {
  try {
    const data = await Product.find(req.query);
    return res.json(data);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const addProduct = async (req, res) => {
  try {
    const {
      title,
      category,
      vendor,
      vendorPrice,
      price,
      available,
      isActive,
      isFeatured,
      stockCountPending,
      description,
    } = req.body;
    const file = req.file;
    let data = await Product.create({
      title,
      category,
      vendorPrice,
      vendor,
      price,
      available,
      isActive,
      isFeatured,
      stockCountPending,
      description,
      productCode: faker.phone.phoneNumber("###-###"),
      createdBy: req.userId,
      profitMargin: price - vendorPrice,
    });
    if (file && data._id) {
      let img = await imagekit.upload({
        file: file.buffer, //required
        fileName: file.originalname, //required
        folder: "/Products",
      });
      data = await Product.findByIdAndUpdate(data.id, {
        imageURL: img.url,
        imageId: img.fileId,
      });
    }
    res.status(200).json({
      message: "Your product has been Added Successfully.",
      data: data,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send({ error: "Product not found" });
    return res.json(product);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Product has been deleted..." });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const updateProduct = async (req, res) => {
  try {
    const {
      title,
      category,
      vendorPrice,
      price,
      available,
      isFeatured,
      isActive,
      stockCountPending,
      vendor,
      description,
    } = req.body;
    const file = req.file;
    let data = await Product.findByIdAndUpdate(req.params.id, {
      title,
      category,
      vendorPrice,
      price,
      isFeatured,
      available,
      vendor,
      isActive,
      stockCountPending,
      description,
      profitMargin: price - vendorPrice,
    });
    if (file !== undefined) {
      const { imageId } = data;
      if (imageId) await imagekit.deleteFile(imageId);
      let img = await imagekit.upload({
        file: file.buffer, //required
        fileName: file.originalname, //required
      });
      data = await Product.findByIdAndUpdate(data.id, {
        imageURL: img.url,
        imageId: img.fileId,
      });
    }
    res.status(200).json({
      message: "Product has been updated",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

module.exports = {
  addProduct,
  getAllProducts,
  getAllProductWithoutFilter,
  getProduct,
  deleteProduct,
  updateProduct,
};
