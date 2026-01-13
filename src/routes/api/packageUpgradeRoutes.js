const express = require("express");
const router = express.Router();
const packageUpgradeController = require("../../controllers/packageUpgradeController");
const verifyJWT = require("../../middleware/verifyJWT");
const verifyRoles = require("../../middleware/verifyRoles");
const ROLES_LIST = require("../../config/roles_list");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage });

// 🔵 User routes (Authenticated users only)
router.post(
  "/",
  verifyJWT,
  upload.single("paymentScreenshot"),
  packageUpgradeController.submitUpgradeRequest
);

router.get(
  "/user/:userId",
  verifyJWT,
  packageUpgradeController.getUserUpgradeRequests
);

router.get(
  "/history/:userId",
  verifyJWT,
  packageUpgradeController.getUpgradeHistory
);

// 🔵 Admin routes (Admin only)
router.get(
  "/",
  verifyJWT,
  verifyRoles(ROLES_LIST.Admin),
  packageUpgradeController.getAllUpgradeRequests
);

router.get(
  "/:requestId",
  verifyJWT,
  verifyRoles(ROLES_LIST.Admin),
  packageUpgradeController.getUpgradeRequestById
);

router.put(
  "/:requestId/process",
  verifyJWT,
  verifyRoles(ROLES_LIST.Admin),
  packageUpgradeController.processUpgradeRequest
);

module.exports = router;