const Product = require("../models/product");
const User = require("../models/user");
const { faker } = require("@faker-js/faker");
const imagekit = require("../config/imagekit");
const { searchInColumns, getQuery } = require("../utils");
const send_email = require("../middleware/email");

const getAllProducts = async (req, res) => {
  try {
    let { page, limit, search, sort, ...queries } = req.query;
    search = searchInColumns(search, [
      "category_name",
      "brand_name",
      "title",
      "description",
      "subject_name",
      "isbn",
    ]);
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
    }
    let sortOption = {};
    if (sort) {
      switch (sort) {
        case "PRICE_HIGH_TO_LOW":
          sortOption = { price: -1 };
          break;
        case "PRICE_LOW_TO_HIGH":
          sortOption = { price: 1 };
          break;
        case "RECENT":
          sortOption = { createdAt: -1 };
          break;
      }
    } else {
      sortOption = { createdAt: -1 };
    }
    const options = {
      page: page || 1,
      limit: limit || 10,
      sort: sortOption,
    };

    const data = await Product.aggregatePaginate(myAggregate, options);

    return res.status(200).send({
      message: "Successfully fetch products",
      change: "Changes applied for test",
      data: data,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
};

const suggestProducts = async (req, res) => {
  try {
    let { page, limit, search, sort, targetAge, ...queries } = req.query;
    search = searchInColumns(search, [
      "category_name",
      "brand_name",
      "title",
      "description",
      "subject_name",
      "isbn",
    ]);
    queries = getQuery(queries);
    let myAggregate;
    if (!search) {
      myAggregate = Product.aggregate([
        { $match: { targetAge } },
        { $sample: { size: +limit } },
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
        { $sample: { size: +limit } },
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
    }
    let sortOption = {};
    if (sort) {
      switch (sort) {
        case "PRICE_HIGH_TO_LOW":
          sortOption = { price: -1 };
          break;
        case "PRICE_LOW_TO_HIGH":
          sortOption = { price: 1 };
          break;
        case "RECENT":
          sortOption = { createdAt: -1 };
          break;
      }
    } else {
      sortOption = { createdAt: -1 };
    }
    const options = {
      page: page || 1,
      limit: limit || 10,
      sort: sortOption,
    };

    const data = await Product.aggregatePaginate(myAggregate, options);

    return res.status(200).send({
      message: "Successfully fetch products",
      change: "Changes applied for testing123",
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
      subject,
      vendor,
      vendorPrice,
      price,
      available,
      isActive,
      isFeatured,
      stockCountPending,
      description,
      tags,
      targetAge,
      media,
      options,
      vendor_name,
      brand_name,
      subject_name,
      category_name,
      isbn,
    } = req.body;
    let data = await Product.create({
      title,
      category,
      brand,
      subject,
      vendorPrice,
      vendor,
      price,
      available,
      isActive,
      isFeatured,
      stockCountPending,
      description,
      tags,
      targetAge,
      productCode: faker.phone.number("###-###"),
      createdBy: req.userId,
      profitMargin: price - vendorPrice,
      media,
      options,
      vendor_name,
      brand_name,
      category_name,
      subject_name,
      isbn,
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
    res.status(500).json({
      errorMsg: "An error ocurred during submitting this product .",
      error: err,
    });
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
      subject,
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
      media,
      targetAge,
      options,
      vendor_name,
      brand_name,
      subject_name,
      category_name,
      isbn,
    } = req.body;

    let data = await Product.findByIdAndUpdate(req.params.id, {
      title,
      category,
      brand,
      subject,
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
      media,
      options,
      targetAge,
      vendor_name,
      brand_name,
      subject_name,
      category_name,
      isbn,
      updatedBy: req.userId,
    });

    const user = await User.findById(req.userId);
    const _vendorData = await User.findById(vendor);

    if (user?.role === "Admin") {
      let emailInput = {
        subject: "Product updates",
        html: `<strong>Your product ${title} has been updated</strong>`,
      };
      await send_email(_vendorData.email, emailInput)
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          return res.status(500).json({ error: err });
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
  suggestProducts,
};
