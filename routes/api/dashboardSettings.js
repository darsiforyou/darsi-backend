const express = require("express");
const router = express.Router();
const verifyRoles = require("../../middleware/verifyRoles");
const verifyJWT = require("../../middleware/verifyJWT");
const ROLES_LIST = require("../../config/roles_list");
const dashboard = require("../../controllers/dashboardSettingsController");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

router
  .route("/")
  .get(dashboard.getAllDS)
  .post(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    upload.single("file"),
    dashboard.addDS
  );
router.route("/without_filter").get(dashboard.getAllDSWithoutFilter);
router
  .route("/:id")
  .get(dashboard.getDS)
  .delete(verifyJWT, verifyRoles(ROLES_LIST.Admin), dashboard.deleteDS)
  .put(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    upload.single("file"),
    dashboard.updateDS
  );

module.exports = router;
