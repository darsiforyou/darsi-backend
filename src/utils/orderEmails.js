// utils/orderEmails.js

const customerInvoiceEmail = (order) => `
<div style="font-family: Arial; max-width:700px; margin:auto; border:1px solid #eee; padding:20px">
  <h2 style="color:#33A137">Darsi - Order Invoice</h2>

  <p>Hi <b>${order.name}</b>,</p>
  <p>Your order has been successfully placed.</p>

  <hr/>

  <p><b>Order No:</b> ${order.order_number}</p>
  <p><b>Payment Method:</b> ${order.paymentMethod}</p>
  <p><b>City:</b> ${order.city}</p>

  <table width="100%" border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse">
    <thead style="background:#f5f5f5">
      <tr>
        <th>Product</th>
        <th>Qty</th>
        <th>Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${order.cart.items.map(i => `
        <tr>
          <td>${i.name || i.title}</td>
          <td align="center">${i.qty}</td>
          <td align="center">Rs ${i.price}</td>
          <td align="center">Rs ${i.qty * i.price}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <p><b>Shipping:</b> Rs ${order.cart.shippingCharges}</p>
  <p><b>Discount:</b> Rs ${order.cart.discount}</p>
  <h3>Total Payable: Rs ${order.cart.netCost}</h3>

  <p>Regards,<br/><b>Darsi Team</b></p>
</div>
`;

const adminOrderNotification = (order) => `
<h2>🛒 New Order Received</h2>
<p><b>Order #:</b> ${order.order_number}</p>
<p><b>Customer:</b> ${order.name}</p>
<p><b>Email:</b> ${order.email}</p>
<p><b>Phone:</b> ${order.phone}</p>
<p><b>Total:</b> Rs ${order.cart.netCost}</p>
<p><b>City:</b> ${order.city}</p>
`;

module.exports = {
  customerInvoiceEmail,
  adminOrderNotification,
};
