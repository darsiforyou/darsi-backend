const Product = require("../models/product");
const { faker } = require("@faker-js/faker");
const imagekit = require("../config/imagekit");
const getAllProducts = async (req, res) => {
  try {
    const Products = await Product.find().sort({ createdAt: -1 });
    if (!Products.length)
      return res
        .status(200)
        .send({ message: "There are no products", data: Products });
    return res.json(Products);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const addProduct = async (req, res) => {
  try {
    const {
      title,
      category,
      vendorPrice,
      price,
      available,
      isActive,
      stockCountPending,
      description,
    } = req.body;
    const file = req.file;
    const newProduct = await Product.create({
      title,
      category,
      vendorPrice,
      price,
      available,
      isActive,
      stockCountPending,
      description,
      productCode: faker.phone.phoneNumber("###-###"),
    });
    if (newProduct._id) {
      let img = await imagekit.upload({
        file: file.buffer, //required
        fileName: file.originalname, //required
        folder: "/Products",
      });
      const updateProduct = await Product.findById(newProduct.id, {
        imageURL: img.url,
        imageId: img.fileId,
      });
      res.status(200).json({
        message: "Your product has been Added Successfully.",
        data: updateProduct,
      });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};
const getProduct = async (req, res) => {
  try {
    const Product = await Product.findById(req.params.id);
    if (!Product) return res.status(404).send({ error: "Product not found" });
    return res.json(Product);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json("Product has been deleted...");
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
      isActive,
      stockCountPending,
      description,
    } = req.body;
    const file = req.file;
    let data = await Product.findByIdAndUpdate(req.params.id, {
      title,
      category,
      vendorPrice,
      price,
      available,
      isActive,
      stockCountPending,
      description,
    });
    if (file.path) {
      const { imageId } = data;
      if (imageId) await imagekit.deleteFile(imageId);
      let img = await imagekit.upload({
        file: fs.createReadStream(imagePath.path), //required
        fileName: imagePath.name, //required
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
  getProduct,
  deleteProduct,
  updateProduct,
};
