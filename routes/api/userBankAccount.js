const express = require("express");
const router = express.Router();
const userBankAccountController = require("../../controllers/userBankAccountController");
const verifyRoles = require("../../middleware/verifyRoles");
const verifyJWT = require("../../middleware/verifyJWT");
const ROLES_LIST = require("../../config/roles_list");

router.route("/:id").get(
  // verifyJWT,
  // verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Referral),
  userBankAccountController.getAccountsByUserId
);

router.route("/").get(
  // verifyJWT,
  // verifyRoles(ROLES_LIST.Admin),
  userBankAccountController.getAllAccounts
);

router.route("/:id").post(
  verifyJWT,
  // verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Referral),
  userBankAccountController.createAccount
);
module.exports = router;
