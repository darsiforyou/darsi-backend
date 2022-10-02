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
        {
          $lookup: {
            from: "brands",
            localField: "brand",
            foreignField: "_id",
            as: "brands",
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
        {
          $lookup: {
            from: "brands",
            localField: "brand",
            foreignField: "_id",
            as: "brands",
          },
        },
      ]);
    }

    const options = {
      page: page || 1,
      limit: limit || 10,
      sort: { createdAt: -1 }
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
      brand,
      vendor,
      vendorPrice,
      price,
      available,
      isActive,
      isFeatured,
      stockCountPending,
      description,
      tags,
      media,
    } = req.body;
    let data = await Product.create({
      title,
      category,
      brand,
      vendorPrice,
      vendor,
      price,
      available,
      isActive,
      isFeatured,
      stockCountPending,
      description,
      tags,
      productCode: faker.phone.number("###-###"),
      createdBy: req.userId,
      profitMargin: price - vendorPrice,
      media
    });

    // if (file && data._id) {
    //   let img = await imagekit.upload({
    //     file: file.buffer, //required
    //     fileName: file.originalname, //required
    //     folder: "/Products",
    //   });
    //   data = await Product.findByIdAndUpdate(data.id, {
    //     imageURL: img.url,
    //     imageId: img.fileId,
    //   });
    // }

    // if(files.length > 0 && data._id){
    //   media = files.map(async(med) => {
    //     let img = await imagekit.upload({
    //       file: med.buffer, //required
    //       fileName: med.originalname, //required
    //       folder: "/Products",
    //     });
    //     return {
    //       imageUrl: img.url,
    //       imageId: img.fileId,
    //       isFront: med.isFront
    //     }
    //   })
    //   data = await Product.findByIdAndUpdate(data.id, {
    //     media: media
    //   });
    // }

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
      brand,
      vendorPrice,
      price,
      available,
      isFeatured,
      isActive,
      stockCountPending,
      vendor,
      description,
      tags,
      media
    } = req.body;
    // const file = req.file;
    let data = await Product.findByIdAndUpdate(req.params.id, {
      title,
      category,
      brand,
      vendorPrice,
      price,
      isFeatured,
      available,
      vendor,
      isActive,
      stockCountPending,
      description,
      tags,
      profitMargin: price - vendorPrice,
      media
    });
    // if (file !== undefined) {
    //   const { imageId } = data;
    //   if (imageId) await imagekit.deleteFile(imageId);
    //   let img = await imagekit.upload({
    //     file: file.buffer, //required
    //     fileName: file.originalname, //required
    //   });
    //   data = await Product.findByIdAndUpdate(data.id, {
    //     imageURL: img.url,
    //     imageId: img.fileId,
    //   });
    // }
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
