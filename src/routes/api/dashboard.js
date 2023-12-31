const express = require("express");
const router = express.Router();
const verifyRoles = require("../../middleware/verifyRoles");
const verifyJWT = require("../../middleware/verifyJWT");
const ROLES_LIST = require("../../config/roles_list");
const dashboard = require("../../controllers/dashboardController");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.route("/counts").get(dashboard.getCounts);
router.route("/chart-data").get(dashboard.getChartData);
router.route("/top-products").get(dashboard.getTopProducts);
router.route("/top-customers").get(dashboard.getTopCustomers);
router.route("/top-vendors").get(dashboard.getTopVendors);
router.route("/top-referrers").get(dashboard.getTopReferrers);
router.route("/ref_count/:code").get(dashboard.getCountsRef);
router.route("/ven_count/:id").get(dashboard.getCountsVen);

module.exports = router;
