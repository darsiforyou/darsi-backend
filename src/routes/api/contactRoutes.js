// routes/contactRoutes.js
const express = require("express");
const router = express.Router();
const { contactUs } = require("../../controllers/contactEmail");

router.post("/sendEmail", contactUs);

module.exports = router;
