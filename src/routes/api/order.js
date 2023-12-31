const express = require("express");
const router = express.Router();
const verifyRoles = require("../../middleware/verifyRoles");
const verifyJWT = require("../../middleware/verifyJWT");
const ROLES_LIST = require("../../config/roles_list");
const orderController = require("../../controllers/orderController");

router
  .route("/")
  .get(orderController.getAllOrders)
  .post(orderController.createPayment);
router.route("/orders-by-item").get(orderController.getAllOrdersByItem);

router.route("/popular-products").get(orderController.popularProducts);

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

router
  .route("/payment-status-change/:id")
  .put(
    verifyJWT,
    verifyRoles(ROLES_LIST.Admin),
    orderController.updatePaymentStatus
  );
module.exports = router;
