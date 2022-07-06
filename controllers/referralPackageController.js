const Referral_Package = require("../models/referral_packages");
const { searchInColumns, getQuery } = require("../utils");
const imagekit = require("../config/imagekit");

const getAllPackages = async (req, res) => {
  try {
    let { page, limit, search, ...quries } = req.query;
    search = searchInColumns(search, ["title", "description"]);
    quries = getQuery(quries);
    const myAggrigate = await Referral_Package.aggregate([
      { $match: { $and: [{ $or: search }, quries] } },
    ]);

    const options = {
      page: page || 1,
      limit: limit || 10,
    };

    const data = await Referral_Package.aggregatePaginate(myAggrigate, options);

    return res.status(200).send({
      message: "Successfully fetch Packages",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const getAllPackagesWithoutFilter = async (req, res) => {
  try {
    const data = await Referral_Package.find();
    if (!data.length)
      return res.status(404).send({ error: "Packages not found" });
    return res.json(data);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const addReferralPackage = async (req, res) => {
  try {
    const {
      title,
      valid_time,
      description,
      price,
      discount_percentage,
      commission,
    } = req.body;
    const file = req.file;
    let data = await Referral_Package.create({
      title,
      valid_time,
      description,
      price,
      discount_percentage,
      commission,
    });
    if (file && data._id) {
      let img = await imagekit.upload({
        file: file.buffer, //required
        fileName: file.originalname, //required
        folder: "/Referral_Package",
      });
      data = await Referral_Package.findByIdAndUpdate(data.id, {
        imageURL: img.url,
        imageId: img.fileId,
      });
    }
    res.status(200).json({
      message: "Your Referral Package has been Added Successfully.",
      data: data,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};
const getReferralPackage = async (req, res) => {
  try {
    const data = await Referral_Package.findById(req.params.id);
    if (!data)
      return res.status(404).send({ error: "Referral Package not found" });
    return res.json(data);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const deleteReferralPackage = async (req, res) => {
  try {
    await Referral_Package.findByIdAndDelete(req.params.id);
    res.status(200).json("Referral Package has been deleted...");
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
const updateReferralPackage = async (req, res) => {
  try {
    const {
      title,
      valid_time,
      description,
      price,
      discount_percentage,
      commission,
    } = req.body;
    const file = req.file;
    let data = await Referral_Package.findByIdAndUpdate(req.params.id, {
      title,
      valid_time,
      description,
      price,
      discount_percentage,
      commission,
    });
    if (file !== undefined) {
      const { imageId } = data;
      if (imageId) await imagekit.deleteFile(imageId);
      let img = await imagekit.upload({
        file: file.buffer, //required
        fileName: file.originalname, //required
      });
      data = await Referral_Package.findByIdAndUpdate(data.id, {
        imageURL: img.url,
        imageId: img.fileId,
      });
    }
    res.status(200).json({
      message: "Referral Package has been updated",
      data: data,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

module.exports = {
  getAllPackages,
  getAllPackagesWithoutFilter,
  getReferralPackage,
  addReferralPackage,
  deleteReferralPackage,
  updateReferralPackage,
};
