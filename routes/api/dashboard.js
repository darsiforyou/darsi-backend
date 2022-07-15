const express = require("express");
const router = express.Router();
const verifyRoles = require("../../middleware/verifyRoles");
const verifyJWT = require("../../middleware/verifyJWT");
const ROLES_LIST = require("../../config/roles_list");
const dashboard = require("../../controllers/dashboardController");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.route("/").get(dashboard.getPendingAndCompletedOrders);

module.exports = router;
