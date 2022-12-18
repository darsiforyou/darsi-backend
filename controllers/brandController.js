const Brand = require("../models/brand");
const { searchInColumns, getQuery } = require("../utils");
const imagekit = require("../config/imagekit");

const getAllBrands = async (req, res) => {
  try {
    let { page, limit, search, ...queries } = req.query;
    search = searchInColumns(search, ["title"]);
    queries = getQuery(queries);
    let myAggregate;
    if (!search) {
      myAggregate = Brand.aggregate([{ $match: { $and: [queries] } }]);
    } else {
      myAggregate = Brand.aggregate([
        { $match: { $and: [{ $or: search }, queries] } },
      ]);
    }

    const options = {
      page: page || 1,
      limit: limit || 10,
      sort: { createdAt: -1 },
    };

    const data = await Brand.aggregatePaginate(myAggregate, options);

    return res.status(200).send({
      message: "Successfully fetch Brands",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const getAllBrandsWithoutFilter = async (req, res) => {
  try {
    const brands = await Brand.aggregate([
      {
        $match: req.query,
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "brand",
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
          isActive: 1,
        },
      },
    ]);
    return res.json(brands);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const addBrand = async (req, res) => {
  try {
    const { title, isActive, isFeatured, userId } = req.body;
    const file = req.file;
    let data = await Brand.create({
      title,
      isActive,
      isFeatured,
      userId,
    });
    if (file && data._id) {
      let img = await imagekit.upload({
        file: file.buffer, //required
        fileName: file.originalname, //required
        folder: "/Brand",
      });
      data = await Brand.findByIdAndUpdate(data.id, {
        imageURL: img.url,
        imageId: img.fileId,
      });
    }
    res.status(200).json({
      message: "Your brand has been Added Successfully.",
      data: data,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};
const getBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).send({ error: "Brand not found" });
    return res.json(brand);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const deleteBrand = async (req, res) => {
  try {
    await Brand.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Brand has been deleted..." });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const updateBrand = async (req, res) => {
  try {
    const { title, isActive, isFeatured, userId } = req.body;
    const file = req.file;
    let data = await Brand.findByIdAndUpdate(req.params.id, {
      title,
      isActive,
      isFeatured,
      userId,
    });
    if (file !== undefined) {
      const { imageId } = data;
      if (imageId) await imagekit.deleteFile(imageId);
      let img = await imagekit.upload({
        file: file.buffer, //required
        fileName: file.originalname, //required
      });
      data = await Brand.findByIdAndUpdate(data.id, {
        imageURL: img.url,
        imageId: img.fileId,
      });
    }
    res.status(200).json({
      message: "Brand has been updated",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

module.exports = {
  getAllBrands,
  getAllBrandsWithoutFilter,
  getBrand,
  addBrand,
  deleteBrand,
  updateBrand,
};
