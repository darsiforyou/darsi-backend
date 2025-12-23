const express = require("express");
const router = express.Router();

const {
  getActiveBankDetails,
  createBankDetails,
  updateBankDetails,
} = require("../../controllers/bankDetailsController");

// GET active bank
router.get("/", getActiveBankDetails);

// CREATE bank (only if none exists)
router.post("/", createBankDetails);

// UPDATE bank
router.put("/:id", updateBankDetails);

module.exports = router;
