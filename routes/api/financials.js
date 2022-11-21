const express = require("express");
const router = express.Router();
const verifyRoles = require("../../middleware/verifyRoles");
const verifyJWT = require("../../middleware/verifyJWT");
const ROLES_LIST = require("../../config/roles_list");
const financialController = require("../../controllers/financialController");


router
  .route("/")
  .get(financialController.getAllFinancials)
router
  .route("/make-payment-request")
  .post(financialController.makePaymentRequest)

router
  .route("/:id")
  .get(financialController.getFinancial)
  .delete(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    financialController.deleteFinancial
  )
module.exports = router;
