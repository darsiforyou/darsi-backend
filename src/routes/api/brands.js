const express = require("express");
const router = express.Router();
const verifyRoles = require("../../middleware/verifyRoles");
const verifyJWT = require("../../middleware/verifyJWT");
const ROLES_LIST = require("../../config/roles_list");
const brandController = require("../../controllers/brandController");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

router
  .route("/")
  .get(brandController.getAllBrands)
  .get(brandController.getAllBrandsWithoutFilter)
  .post(
    upload.single("file"),
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Vendor),
    brandController.addBrand
  );
router.route("/without_filter").get(brandController.getAllBrandsWithoutFilter);
router
  .route("/:id")
  .get(brandController.getBrand)
  .delete(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Vendor),
    brandController.deleteBrand
  )
  .put(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Vendor),
    upload.single("file"),
    brandController.updateBrand
  );

module.exports = router;
