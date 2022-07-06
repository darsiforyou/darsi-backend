const express = require("express");
const router = express.Router();
const userController = require("../../controllers/userController");
const verifyRoles = require("../../middleware/verifyRoles");
const verifyJWT = require("../../middleware/verifyJWT");
const ROLES_LIST = require("../../config/roles_list");

router
  .route("/")
  .get(verifyJWT, verifyRoles(ROLES_LIST.Admin), userController.getAllUsers);

router
  .route("/without_filter")
  .get(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    userController.getAllUsersWithoutFilter
  );
router
  .route("/:id")
  .get(userController.getUser)
  .delete(verifyJWT, verifyRoles(ROLES_LIST.Admin), userController.deleteUser)
  .put(verifyJWT, verifyRoles(ROLES_LIST.Admin), userController.updateUser);

router.route("/code/:code").get(userController.getUserWithRefCode);
module.exports = router;
