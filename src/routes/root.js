const { default: axios } = require("axios");
const express = require("express");
const router = express.Router();
const path = require("path");
const Order = require("../models/order");
const User = require("../models/user");

router.get("^/$|/index(.html)?", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "index.html"));
});

router.get("/payment/product", async (req, res) => {
  try {
    const { status, ordId, msg } = req.query;
    const res = await axios.get("https://demoapi.paypro.com.pk/v2/ppro/ggos", {
      userName: "Darsi_Pk",
      cpayId: ordId,
    });
    const orderStatus = res.data;

    console.log(orderStatus);
    const order = Order.findByIdAndUpdate(orderStatus?.OrderNumber, {
      paymentStatus: status === "Success" ? true : false,
    });

    if (status) {
      res.redirect("https://darsi.pk/success");
    }
    res.redirect("https://darsi.pk/failed");
  } catch (err) {
    res.status(500).json({
      message: err.message,
      data: {},
    });
  }
});

router.get("/paypro/uis", async (req, res) => {
  try {
    const { username, password, csvinvoiceids } = req.query;
    let statusCode = 00;
    if (username === "DarsiPk") {
    }
    // console.log();
    // const order = Order.findByIdAndUpdate(csvinvoiceids, {
    //   paymentStatus: true,
    // });

    // console.log({ username, password, csvinvoiceids });

    // res.redirect("https://darsi.pk/success");
    return [
      {
        StatusCode: "01",
        InvoiceID: null,
        Description: "Invalid Data. Username or password is invalid",
      },
    ];
  } catch (err) {
    res.status(500).json({
      message: err.message,
      data: {},
    });
  }
});

router.get("/paypro/referral", async (req, res) => {
  try {
    const { username, password, csvinvoiceids } = req.query;
    console.log();
    const user = User.findByIdAndUpdate(csvinvoiceids, {
      referral_payment_status: true,
    });

    console.log({ username, password, csvinvoiceids });

    res.redirect("https://dashboard.darsi.pk/login");
    return { username, password, csvinvoiceids };
  } catch (err) {
    res.status(500).json({
      message: err.message,
      data: {},
    });
  }
});

module.exports = router;
