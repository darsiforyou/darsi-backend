const express = require("express");
const router = express.Router();
const verifyRoles = require("../../middleware/verifyRoles");
const verifyJWT = require("../../middleware/verifyJWT");
const ROLES_LIST = require("../../config/roles_list");
const walletController = require("../../controllers/walletController");

router
  .route("/")
  .get(walletController.getWallets)
  .post(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    walletController.createWallet
  );

router
  .route("/:id")
  // .get(walletController.getSubject)
  .delete(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    walletController.deleteWallet
  )
  .put(verifyJWT, verifyRoles(ROLES_LIST.Admin), walletController.updateWallet);

module.exports = router;
