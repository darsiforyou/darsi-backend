const express = require("express");
const router = express.Router();
const verifyRoles = require("../../middleware/verifyRoles");
const verifyJWT = require("../../middleware/verifyJWT");
const ROLES_LIST = require("../../config/roles_list");
const orderController = require("../../controllers/orderController");

router
  .route("/")
  .get(orderController.getAllOrders)
  .post(orderController.createOrder);

router
  .route("/:id")
  .get(orderController.getOrder)
  .delete(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    orderController.deleteOrder
  );
router
  .route("/status-change/:id")
  .put(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    orderController.updateOrderStatus
  );
module.exports = router;
