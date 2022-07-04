const express = require("express");
const router = express.Router();
const verifyRoles = require("../../middleware/verifyRoles");
const verifyJWT = require("../../middleware/verifyJWT");
const ROLES_LIST = require("../../config/roles_list");
const categoryController = require("../../controllers/categoryController");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
router
  .route("/")
  .get(categoryController.getAllCategories)
  .get(categoryController.getAllCategoriesWithoutFilter)
  .post(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    upload.single("file"),
    categoryController.addCategory
  );
router
  .route("/without_filter")
  .get(categoryController.getAllCategoriesWithoutFilter);
router
  .route("/:id")
  .get(categoryController.getCategory)
  .delete(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    categoryController.deleteCategory
  )
  .put(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    upload.single("file"),
    categoryController.updateCategory
  );

module.exports = router;
