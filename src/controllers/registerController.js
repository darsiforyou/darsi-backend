const User = require("../models/user");
const Package = require("../models/referral_packages");
const bcrypt = require("bcrypt");
const axios = require("axios");
const { faker } = require("@faker-js/faker");
const Financial = require("../models/financial");
const referral_packages = require("../models/referral_packages");
const Milestone = require("../models/milestone");

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
      level: 0,
    };

    let user_code = firstname;
    newUser.user_code =
      user_code + "-" + faker.helpers.replaceSymbolWithNumber("####-####");
    console.log('before role === "Referrer" ');
    if (role === "Referrer") {
      const package = await Package.findById(referral_package);
      const milestones = await Milestone.findOne();
      const milestone = {
        levelOne: milestones.levelOne,
        levelTwo: milestones.levelTwo,
        levelThree: milestones.levelThree,
      }

      let commission = (package.price * package.commission) / 100;
      let packagePrice = package.price - (package.price * package.discount_percentage) / 100;
      console.log("🚀 ~ file: registerController.js:59 ~ handleNewUser ~ commission:", commission)
      let adminAmount = referred_by
      ? +packagePrice - commission
      : +packagePrice;
      console.log("🚀 ~ file: registerController.js:63 ~ handleNewUserrrr ~ adminAmount:", adminAmount);
      let user = await User.create(newUser);

      const tokenRes = await axios.post(`${process.env.PAYPRO_URL}/auth`, {
        clientid: process.env.CLIENT_ID,
        clientsecret: process.env.CLIENT_SECRET,
      });
      const token = tokenRes.headers.token;

      const percent = (+packagePrice * 2.7) / 100;
      console.log('before payment')
      let json1 = [
        {
          MerchantId: "Darsi_Pk",
        },
        {
          OrderNumber: user.id,
          OrderAmount: packagePrice + percent,
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
              UnitPrice: packagePrice + percent,
              SubTotal: packagePrice + percent,
            },
          ],
        },
      ];
      console.log('first1');

      const payment = await axios.post(`${process.env.PAYPRO_URL}/co`, json1, {
        headers: {
          token,
          "Content-Type": "application/json",
        },
        redirect: "follow",
      });
      let pktRes = await payment.data;
      if (pktRes) {
        // const encodeURl = encodeURI("http://localhost:3000/payment/product");
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
      console.log('after payment')

      console.log("🚀 ~ file: registerController.js:125 ~ handleNewUser ~ referred_by:", referred_by)
      if (referred_by) {
        const referral = await User.findOne({ user_code: `${referred_by}` });
        // console.log("🚀 ~ file: registerController.js:130 ~ handleNewUser ~ referral:", referral)
        if (referral) {
          console.log('inside referral')
          console.log('inside referral', referral)
          const referral2 = await User.findOne({ user_code: referral.referred_by });
          let level = referral.upline === '' || referral.referred_by === '' ? 1 : 2;
          if (referral2) {
            const referral3 = await User.findOne({ user_code: referral2.referred_by });
            if (referral3){
              level = 3;
              const referral4 = await User.findOne({ user_code: referral3.referred_by });
              if (referral4){
                level = 4;
              }

            }
          }

          //Create financial entires for referrer
          await Financial.create({
            user: referral._id,
            package: package._id,
            amount: commission,
            type: "PACKAGE",
          });


          newUser.referred_by = referred_by;
          newUser.upline = referral._id;
          newUser.level = level;
          console.log("🚀 ~ file: registerController.js:147 ~ handleNewUser ~ newUser:", newUser)

        } else {
          return res.json({ message: "Referrar Does Not Exists. Please Enter Correct Referral Code" }); //Conflict
        }
      }

    }

    let user = await User.create(newUser);

    res.status(201).json({
      success: `Your Account is successfully created`,
      // data: user,
      data: {name:'fff'}
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { handleNewUser };
