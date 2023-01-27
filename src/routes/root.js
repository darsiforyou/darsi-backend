const express = require("express");
const router = express.Router();
const path = require("path");
const Order = require("../models/order");

router.get("^/$|/index(.html)?", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "index.html"));
});

router.get("/paypro/uis", async (req, res) => {
  try {
    const { username, password, csvinvoiceids } = req.query;
    const order = Order.findByIdAndUpdate(csvinvoiceids, {
      paymentStatus: true,
    });

    console.log({ username, password, csvinvoiceids });

    res.redirect("https://darsi.pk/success");
    return { username, password, csvinvoiceids };
  } catch (err) {
    res.status(500).json({
      message: err.message,
      data: {},
    });
  }
});
module.exports = router;
