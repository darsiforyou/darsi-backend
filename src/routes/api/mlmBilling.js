const express = require("express");
const router = express.Router();
const verifyRoles = require("../../middleware/verifyRoles");
const verifyJWT = require("../../middleware/verifyJWT");
const ROLES_LIST = require("../../config/roles_list");
const mlmBilling = require("../../controllers/billingController");

router
  .route("/")
  .get(mlmBilling.getAllMLMBilling)
  .post(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Referral),
    mlmBilling.createMLMBilling
    );

module.exports = router;
