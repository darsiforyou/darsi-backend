const express = require("express");
const router = express.Router();
const verifyRoles = require("../../middleware/verifyRoles");
const verifyJWT = require("../../middleware/verifyJWT");
const ROLES_LIST = require("../../config/roles_list");
const categoryController = require("../../controllers/categoryController");

router
  .route("/")
  .get(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    categoryController.getAllCategories
  )
  .post(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    categoryController.addCategory
  );

router
  .route("/:id")
  .get(verifyJWT, verifyRoles(ROLES_LIST.Admin), categoryController.getCategory)
  .delete(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    categoryController.deleteCategory
  )
  .put(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    categoryController.updateCategory
  );

module.exports = router;
