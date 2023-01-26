const express = require("express");
const router = express.Router();
const verifyRoles = require("../../middleware/verifyRoles");
const verifyJWT = require("../../middleware/verifyJWT");
const ROLES_LIST = require("../../config/roles_list");
const subCategoryController = require("../../controllers/subCategoryController");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

router
  .route("/")
  .get(subCategoryController.getAllSubCategories)
  .post(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
  );
router
  .route("/without_filter")
  .get(subCategoryController.getAllSubCategoriesWithoutFilter);
router
  .route("/:id")
  .get(subCategoryController.getSubCategory)
  .delete(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    subCategoryController.deleteSubCategory
  )
  .put(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    upload.single("file"),
    subCategoryController.updateSubCategory
  );

module.exports = router;
