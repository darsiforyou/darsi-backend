const express = require("express");
const router = express.Router();
const verifyRoles = require("../../middleware/verifyRoles");
const verifyJWT = require("../../middleware/verifyJWT");
const ROLES_LIST = require("../../config/roles_list");
const productController = require("../../controllers/productController");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
router
  .route("/")
  .get(productController.getAllProducts)
  .post(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    upload.single("file"),
    productController.addProduct
  );

router
  .route("/without_filter")
  .get(productController.getAllProductWithoutFilter);
router
  .route("/:id")
  .get(productController.getProduct)
  .put(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    upload.single("file"),
    productController.updateProduct
  )
  .delete(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    productController.deleteProduct
  );

module.exports = router;
