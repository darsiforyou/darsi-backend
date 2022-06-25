const express = require("express");
const router = express.Router();
const verifyRoles = require("../../middleware/verifyRoles");
const verifyJWT = require("../../middleware/verifyJWT");
const ROLES_LIST = require("../../config/roles_list");
const productController = require("../../controllers/productController");

router
  .route("/")
  .get(productController.getAllProducts)
  .post(verifyJWT, verifyRoles(ROLES_LIST.Admin), productController.addProduct);

router
  .route("/:id")
  .get(productController.getProduct)
  .delete(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    productController.deleteProduct
  );

module.exports = router;
