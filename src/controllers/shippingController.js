const Shipping = require("../models/shipping");

const getShippings = async (req, res, next) => {
  try {
    const data = await Shipping.find();
    res.status(200).json({
      message: "Shipping fetched",
      data,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};
const createShipping = async (req, res, next) => {
  try {
    const { inCity, outCity } = req.body;

    const shipping = await Shipping.create({
      inCity,
      outCity,
    });
    res.status(200).json({
      message: "Shipping added",
      data: shipping,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

const deleteShipping = async (req, res) => {
  try {
    const data = await Shipping.findByIdAndDelete(req.params.id);
    res.status(200).json({
      message: "Shipping deleted",
      data: data,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

const updateShipping = async (req, res) => {
  try {
    const { inCity, outCity } = req.body;

    const data = await Shipping.findByIdAndUpdate(req.params.id, {
      inCity,
      outCity,
    });
    res.status(200).json({
      message: "Shipping updated",
      data: data,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

module.exports = {
  getShippings,
  createShipping,
  deleteShipping,
  updateShipping,
};
