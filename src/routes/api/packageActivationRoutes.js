// routes/packageActivationRoutes.js
const express = require("express");
const router = express.Router();
const packageActivationController = require("../../controllers/packageActivationController");
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
  packageActivationController.submitActivationRequest
);

router.post(
  "/current",
  
  upload.single("paymentScreenshot"),
  packageActivationController.submitCurrentPackageActivation
);

router.get(
  "/user/:userId",
  verifyJWT,
  packageActivationController.getUserActivationRequests
);

router.get(
  "/history/:userId",
  verifyJWT,
  packageActivationController.getCombinedRequestsHistory
);

router.get(
  "/status",
  verifyJWT,
  packageActivationController.checkUserActivationStatus
);

// 🔵 Admin routes (Admin only)
router.get(
  "/",
  verifyJWT,
  verifyRoles(ROLES_LIST.Admin),
  packageActivationController.getAllActivationRequests
);

router.get(
  "/:requestId",
  verifyJWT,
  verifyRoles(ROLES_LIST.Admin),
  packageActivationController.getActivationRequestById
);

router.put(
  "/:requestId/process",
  verifyJWT,
  verifyRoles(ROLES_LIST.Admin),
  packageActivationController.processActivationRequest
);

module.exports = router;