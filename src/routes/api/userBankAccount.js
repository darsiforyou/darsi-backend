const express = require("express");
const router = express.Router();
const userBankAccountController = require("../../controllers/userBankAccountController");
const verifyRoles = require("../../middleware/verifyRoles");
const verifyJWT = require("../../middleware/verifyJWT");
const ROLES_LIST = require("../../config/roles_list");

router
  .route("/user/:userId")
  .get(
    verifyJWT,
    verifyRoles(ROLES_LIST.Vendor, ROLES_LIST.Referral),
    userBankAccountController.getAccountsByUserId
  );

router
  .route("/")
  .get(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    userBankAccountController.getAllAccounts
  );

router
  .route("/")
  .post(
    verifyJWT,
    verifyRoles(ROLES_LIST.Vendor, ROLES_LIST.Referral),
    userBankAccountController.createAccount
  );

router
  .route("/:id")
  .delete(
    verifyJWT,
    verifyRoles(ROLES_LIST.Vendor, ROLES_LIST.Referral),
    userBankAccountController.deleteAccount
  )
  .put(
    verifyJWT,
    verifyRoles(ROLES_LIST.Vendor, ROLES_LIST.Referral),
    userBankAccountController.updateAccount
  );
module.exports = router;
