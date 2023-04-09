const express = require("express");
const router = express.Router();
const verifyRoles = require("../../middleware/verifyRoles");
const verifyJWT = require("../../middleware/verifyJWT");
const ROLES_LIST = require("../../config/roles_list");
const ms = require("../../controllers/milestoneController");

router
  .route("/")
  .get(ms.getAllMS)
  .post(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    ms.addMilestone);
router
  .route("/update/:id")
  .post(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    ms.updateMilestone);

module.exports = router;
