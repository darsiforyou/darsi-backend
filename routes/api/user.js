const express = require("express");
const router = express.Router();
const userController = require("../../controllers/userController");
const verifyRoles = require("../../middleware/verifyRoles");
const verifyJWT = require("../../middleware/verifyJWT");
const ROLES_LIST = require("../../config/roles_list");

router
  .route("/")
  .get(verifyJWT, verifyRoles(ROLES_LIST.Admin), userController.getAllUsers);
// .post(
//   verifyJWT,
//   verifyRoles(ROLES_LIST.Admin),
//   userController.createNewEmployee
// )
// .put(
//   verifyJWT,
//   verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor),
//   userController.updateEmployee
// )

router
  .route("/:id")
  .get(userController.getUser)
  .delete(verifyJWT, verifyRoles(ROLES_LIST.Admin), userController.deleteUser);

module.exports = router;
