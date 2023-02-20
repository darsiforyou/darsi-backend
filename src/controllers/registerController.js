const User = require("../models/user");
const Package = require("../models/referral_packages");
const bcrypt = require("bcrypt");
const axios = require("axios");
const { faker } = require("@faker-js/faker");
const Financial = require("../models/financial");
const referral_packages = require("../models/referral_packages");

const handleNewUser = async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      password,
      email,
      role,
      referral_package,
      referred_by,
    } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "email and password are required." });
    // check for duplicate emails in the db
    const isUser = await User.findOne({ email });
    const package = referral_packages.findById(referral_package);

    if (isUser?.email === email)
      return res.status(409).json({ message: "email already exists" }); //Conflict
    //encrypt the password
    const hashedPwd = await bcrypt.hash(password, 10);
    //store the new user
    const newUser = {
      firstname,
      lastname,
      role: role ? role : "Customer",
      status: true,
      email,
      password: hashedPwd,
      referral_package,
    };
    let user_code = firstname;
    newUser.user_code =
      user_code + "-" + faker.helpers.replaceSymbolWithNumber("####-####");

    if (role === "Referrer") {
      const package = await Package.findById(referral_package);

      let commission = (package.price * package.commission) / 100;
      let adminAmount = referred_by
        ? package.price - commission
        : package.price;
      let user = await User.create(newUser);

      const tokenRes = await axios.post(`${process.env.PAYPRO_URL}/auth`, {
        clientid: process.env.CLIENT_ID,
        clientsecret: process.env.CLIENT_SECRET,
      });
      const token = tokenRes.headers.token;

      const percent = (package.price * 2.7) / 100;
      let json = [
        {
          MerchantId: "Darsi_Pk",
        },
        {
          OrderNumber: user.id,
          OrderAmount: 90 + percent,
          // OrderAmount: package.price + percent,
          OrderDueDate: new Date(),
          OrderType: "Service",
          IssueDate: new Date(),
          OrderExpireAfterSeconds: "0",
          CustomerName: newUser.firstname,
          CustomerMobile: "",
          CustomerEmail: newUser.email,
          CustomerAddress: "",
          BillDetail01: [
            {
              LineItem: package.title,
              Quantity: 1,
              UnitPrice: package.price,
              SubTotal: package.price * 1,
            },
          ],
        },
      ];

      const payment = await axios.post(`${process.env.PAYPRO_URL}/co`, json, {
        headers: {
          token,
          "Content-Type": "application/json",
        },
        redirect: "follow",
      });
      let pktRes = await payment.data;
      if (pktRes) {
        const encodeURl = encodeURI("https://backend.darsi.pk/payment/product");

        return res.status(200).json({
          message: "Your order has been placed Successfully.",
          paymentToken: pktRes[1].Click2Pay + "&callback_url=" + encodeURl,
        });
      }
      await Financial.create({
        darsi: true,
        package: package._id,
        amount: adminAmount,
        type: "PACKAGE",
      });

      if (referred_by) {
        const referral = await User.findOne({ user_code: referred_by });
        if (referral) {
          // Create financial entires for referrer
          await Financial.create({
            user: referral._id,
            package: package._id,
            amount: commission,
            type: "PACKAGE",
          });
          newUser.referred_by = referred_by;
        } else {
          return res.json({ message: "Referrer does not exists" }); //Conflict
        }
      }
    }
    let user = await User.create(newUser);

    res.status(201).json({
      success: `Your Account is successfully created`,
      data: user,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { handleNewUser };
