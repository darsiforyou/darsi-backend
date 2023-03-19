const Wallet = require("../models/wallet");

const getWallets = async (req, res, next) => {
  try {
    const data = await Wallet.find();
    res.status(200).json({
      message: "Wallet fetched",
      data,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};
const createWallet = async (req, res, next) => {
  try {
    const { minAmount } = req.body;

    const wallet = await Wallet.create({
      minAmount,
    });
    res.status(200).json({
      message: "Wallet added",
      data: wallet,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

const deleteWallet = async (req, res) => {
  try {
    const data = await Wallet.findByIdAndDelete(req.params.id);
    res.status(200).json({
      message: "Wallet deleted",
      data: data,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

const updateWallet = async (req, res) => {
  try {
    const { minAmount } = req.body;

    const data = await Wallet.findByIdAndUpdate(req.params.id, {
      minAmount,
    });
    res.status(200).json({
      message: "Wallet updated",
      data: data,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

module.exports = {
  getWallets,
  createWallet,
  deleteWallet,
  updateWallet,
};
