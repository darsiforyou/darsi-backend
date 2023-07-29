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
    console.log('referred_by', referred_by);
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
      let packagePrice =  referred_by ? package.price - (package.price * package.discount_percentage) / 100 : package.price;
      console.log("🚀 ~ file: registerController.js:59 ~ handleNewUser ~ commission:", commission)
      // let adminAmount = referred_by
      // ? +packagePrice - commission
      // : +packagePrice;
      let ref1Commission = 0;
      let ref2Commission = 0;
      let ref3Commission = 0;

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
      console.log('after payment')
      console.log('referred_by', referred_by);

      console.log("🚀 ~ file: registerController.js:125 ~ handleNewUser ~ referred_by:", referred_by)
      if (referred_by) {
        const referral = await User.findOne({ user_code: `${referred_by}` });
        console.log('refferby inside')
        console.log("🚀 ~ file: registerController.js:130 ~ handleNewUser ~ referral:", referral)
        if (referral) {
          console.log('inside referral')

          ref1Commission = +packagePrice * (milestone.levelOne / 100);
          /// finacial module for main ref 1
          await Financial.create({
            user: referral._id,
            package: package._id,
            amount: ref1Commission,
            type: "PACKAGE",
          });

          const referral2 = await User.findOne({ user_code: referral.referred_by });
          let level = referral.upline === '' || referral.referred_by === '' ? 1 : 2;
          if (referral2) {

            ref2Commission = +packagePrice * (milestone.levelTwo / 100)
            /// finacial module for main ref 2
            await Financial.create({
              user: referral2._id,
              package: package._id,
              amount: ref2Commission,
              type: "PACKAGE",
            });

            const referral3 = await User.findOne({ user_code: referral2.referred_by });
            if (referral3){
              ref3Commission = +packagePrice * (milestone.levelThree / 100)
              /// finacial module for main ref 3
              await Financial.create({
                user: referral3._id,
                package: package._id,
                amount: ref3Commission,
                type: "PACKAGE",
              });

              level = 3;
              const referral4 = await User.findOne({ user_code: referral3.referred_by });
              if (referral4){
                level = 4;
              }

            }
          }

          // //Create financial entires for referrer
          // await Financial.create({
          //   user: referral._id,
          //   package: package._id,
          //   amount: commission,
          //   type: "PACKAGE",
          // });
          console.log("🚀 refCommission:", ref1Commission, ref2Commission, ref3Commission)

          newUser.referred_by = referred_by;
          newUser.upline = referral._id;
          newUser.level = level;
          // console.log("🚀 ~ file: registerController.js:147 ~ handleNewUser ~ newUser:", newUser)

        } else {
          return res.json({ message: "Referrar Does Not Exists. Please Enter Correct Referral Code" }); //Conflict
        }
      }
      // if refferal were there cut there commison amt  then give to admin else 0 will be minus
      let adminAmount = referred_by
      ? +packagePrice - ref1Commission - ref2Commission - ref3Commission
      : +packagePrice;
      console.log("🚀 ~ file: registerController.js:63 ~ handleNewUserrrr ~ adminAmount:", adminAmount);

      // financial admin entry
      await Financial.create({
        darsi: true,
        package: package._id,
        amount: adminAmount,
        type: "PACKAGE",
      });

    }

    let user = await User.create(newUser);

    res.status(201).json({
      success: `Your Account is successfully created`,
      data: user,
      // data: {name:'fff'}
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { handleNewUser };
