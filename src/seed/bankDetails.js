const BankDetails = require("../models/BankDetails");

const seedBank = async () => {
  await BankDetails.create({
    bankName: "Meezan Bank",
    accountTitle: "Acme Educational Publications Pvt. Ltd.",
    iban: "PK41MEZN0001880111226573",
    accountNumber: "01880111226573",
  });

  console.log("✅ Bank details seeded");
};

module.exports = seedBank;
