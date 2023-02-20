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
    const tokenRes = await axios.post(`${process.env.PAYPRO_URL}/auth`, {
      clientid: process.env.CLIENT_ID,
      clientsecret: process.env.CLIENT_SECRET,
    });
    const data = JSON.stringify({
      userName: "Darsi_Pk",
      cpayId: ordId,
    });

    const token = tokenRes.headers.token;
    const config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `${process.env.PAYPRO_URL}/ggos`,
      headers: {
        token: token,
        "Content-Type": "application/json",
      },
      data: data,
    };

    const payres = await axios(config);
    const orderStatus = payres.data;

    console.log(orderStatus);
    const orderobj = await Order.findById(orderStatus[1]?.OrderNumber);
    // const userobj = await User.findById(orderStatus[1]?.OrderNumber);
    if (orderobj) {
      const order = await Order.findByIdAndUpdate(orderStatus[1]?.OrderNumber, {
        paymentStatus: status === "Success" ? true : false,
        paymentMethod: "PAYPRO",
      });
      if (status) {
        res.redirect(301, "https://darsi.pk/success");
      }
      res.redirect("http://darsi.pk/failed");
    } else {
      const referrer = await User.findByIdAndUpdate(
        orderStatus[1]?.OrderNumber,
        {
          referral_payment_status: status === "Success" ? true : false,
          paymentMethod: "PAYPRO",
        }
      );

      if (status === "Success") {
        res.redirect(301, "https://dashboard.darsi.pk/login");
      }
      res.redirect("http://darsi.pk/failed");
    }
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
