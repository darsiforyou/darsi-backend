const express = require("express");
const router = express.Router();
const userController = require("../../controllers/userController");
const verifyRoles = require("../../middleware/verifyRoles");
const verifyJWT = require("../../middleware/verifyJWT");
const ROLES_LIST = require("../../config/roles_list");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
router
  .route("/")
  .get(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Referral),
    userController.getAllUsers
  );

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
  .put(verifyJWT, upload.single("file"), userController.updateUser);

router.route("/code/:code").get(userController.getUserWithRefCode);
router.route("/forgotPasswordOtp/:email").get(userController.forgotPasswordOtp);
router.route("/changeUserPassword").post(userController.changeUserPassword);

module.exports = router;
