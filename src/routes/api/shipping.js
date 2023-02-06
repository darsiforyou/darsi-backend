const express = require("express");
const router = express.Router();
const verifyRoles = require("../../middleware/verifyRoles");
const verifyJWT = require("../../middleware/verifyJWT");
const ROLES_LIST = require("../../config/roles_list");
const shippingController = require("../../controllers/shippingController");

router
  .route("/")
  .get(shippingController.getShippings)
  .post(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    shippingController.createShipping
  );

router
  .route("/:id")
  // .get(shippingController.getSubject)
  .delete(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    shippingController.deleteShipping
  )
  .put(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    shippingController.updateShipping
  );

module.exports = router;
