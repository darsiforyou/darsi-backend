const Brand = require("../models/brand");
const Product = require("../models/product"); // <-- ADDED: Product model
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

    // normalize boolean fields (frontend may send "true"/"false" strings)
    const normalizedIsActive = isActive === "true" || isActive === true;
    const normalizedIsFeatured =
      isFeatured === "true" || isFeatured === true;

    let data = await Brand.create({
      title,
      isActive: normalizedIsActive,
      isFeatured: normalizedIsFeatured,
      userId,
    });

    if (file && data?._id) {
      const img = await imagekit.upload({
        file: file.buffer, // required
        fileName: file.originalname, // required
        folder: "/Brand",
      });
      data = await Brand.findByIdAndUpdate(
        data.id,
        {
          imageURL: img.url,
          imageId: img.fileId,
        },
        { new: true }
      );
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
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    // delete image from imagekit if exists
    try {
      if (brand.imageId) {
        await imagekit.deleteFile(brand.imageId);
      }
    } catch (e) {
      // log but continue
      console.error("ImageKit delete failed for brand", req.params.id, e);
    }

    await Brand.findByIdAndDelete(req.params.id);

    // Optionally: unset brand on products or handle as business logic
    // await Product.updateMany({ brand: req.params.id }, { $unset: { brand: "" } });

    res.status(200).json({ message: "Brand has been deleted..." });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const updateBrand = async (req, res) => {
  try {
    // parse incoming values
    const { title, isActive, isFeatured, userId } = req.body;
    const file = req.file;

    // normalize boolean fields
    const normalizedIsActive = isActive === "true" || isActive === true;
    const normalizedIsFeatured =
      isFeatured === "true" || isFeatured === true;

    // update brand basic fields and return the old doc by default; request new doc below after image handling
    let data = await Brand.findByIdAndUpdate(
      req.params.id,
      {
        title,
        isActive: normalizedIsActive,
        isFeatured: normalizedIsFeatured,
        userId,
      },
      { new: false } // we will fetch fresh doc after possible image upload
    );

    if (!data) return res.status(404).json({ message: "Brand not found" });

    // handle file upload (replace image)
    if (file !== undefined && file !== null) {
      try {
        const { imageId } = data;
        if (imageId) {
          // delete old image (ignore errors)
          await imagekit.deleteFile(imageId).catch((e) =>
            console.error("ImageKit delete error:", e)
          );
        }

        const img = await imagekit.upload({
          file: file.buffer, // required
          fileName: file.originalname, // required
          folder: "/Brand",
        });

        data = await Brand.findByIdAndUpdate(
          data.id,
          {
            imageURL: img.url,
            imageId: img.fileId,
          },
          { new: true }
        );
      } catch (e) {
        console.error("Failed to upload brand image", e);
        // continue without failing the whole request
        data = await Brand.findById(data.id);
      }
    } else {
      // fetch fresh doc to return current state
      data = await Brand.findById(data.id);
    }

    // ----- NEW: applyToProducts handling -----
    // frontend sends applyToProducts appended to FormData as "true"/"false"
    try {
      const applyToProductsFlag = req.body.applyToProducts;
      const applyToProducts =
        applyToProductsFlag === "true" || applyToProductsFlag === true;

      // If applyToProducts is true, set isActive on all related products to brand's isActive
      if (applyToProducts) {
        await Product.updateMany(
          { brand: req.params.id },
          { $set: { isActive: !!normalizedIsActive } }
        );
      }
    } catch (err) {
      // log but don't fail the whole brand update if product update fails
      console.error(
        "Failed to update related products for brand",
        req.params.id,
        err
      );
    }
    // ----- END NEW CODE -----

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

