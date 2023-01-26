const express = require("express");
const router = express.Router();
const verifyRoles = require("../../middleware/verifyRoles");
const verifyJWT = require("../../middleware/verifyJWT");
const ROLES_LIST = require("../../config/roles_list");
const referralPackageController = require("../../controllers/referralPackageController");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
router
  .route("/")
  .get(referralPackageController.getAllPackages)
  .post(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    upload.single("file"),
    referralPackageController.addReferralPackage
  );
router
  .route("/without_filter")
  .get(referralPackageController.getAllPackagesWithoutFilter);
router
  .route("/:id")
  .get(referralPackageController.getReferralPackage)
  .delete(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    referralPackageController.deleteReferralPackage
  )
  .put(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    upload.single("file"),
    referralPackageController.updateReferralPackage
  );

module.exports = router;
