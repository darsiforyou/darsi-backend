const BankDetails = require("../models/BankDetails");

// 🔹 GET Active Bank Details (already OK)
const getActiveBankDetails = async (req, res) => {
  try {
    const bank = await BankDetails.findOne({ isActive: true });
    res.status(200).json({
      success: true,
      data: bank,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 CREATE Bank Details (only one active allowed)
const createBankDetails = async (req, res) => {
  try {
    const { bankName, accountTitle, iban, accountNumber } = req.body;

    // ❗ Check if already exists
    const existing = await BankDetails.findOne({ isActive: true });
    if (existing) {
      return res.status(400).json({
        message: "Bank details already exist. Please update instead.",
      });
    }

    const bank = await BankDetails.create({
      bankName,
      accountTitle,
      iban,
      accountNumber,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Bank details added successfully",
      data: bank,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 UPDATE Bank Details
const updateBankDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const bank = await BankDetails.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!bank) {
      return res.status(404).json({ message: "Bank details not found" });
    }

    res.status(200).json({
      success: true,
      message: "Bank details updated successfully",
      data: bank,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getActiveBankDetails,
  createBankDetails,
  updateBankDetails,
};
