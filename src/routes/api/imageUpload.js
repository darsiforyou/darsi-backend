const express = require("express");
const router = express.Router();
const verifyRoles = require("../../middleware/verifyRoles");
const verifyJWT = require("../../middleware/verifyJWT");
const ROLES_LIST = require("../../config/roles_list");
const imageUploadController = require("../../controllers/imageUploadController");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
router
    .route("/upload")
    .post(
        upload.single("file"),
        imageUploadController.uploadImage
    );

module.exports = router;
