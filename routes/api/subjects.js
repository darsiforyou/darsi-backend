const express = require("express");
const router = express.Router();
const verifyRoles = require("../../middleware/verifyRoles");
const verifyJWT = require("../../middleware/verifyJWT");
const ROLES_LIST = require("../../config/roles_list");
const subjectController = require("../../controllers/subjectController");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

router
  .route("/")
  .get(subjectController.getAllSubjects)
  .post(
    upload.single("file"),
    subjectController.addSubject
  );
  router
  .route("/without_filter")
  .get(subjectController.getAllSubjectWithoutFilter);
router
  .route("/:id")
  .get(subjectController.getSubject)
  .delete(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    subjectController.deleteSubject
  )
  .put(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    upload.single("file"),
    subjectController.updateSubject
  );

module.exports = router;
