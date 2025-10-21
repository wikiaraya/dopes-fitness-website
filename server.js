// server.js
const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const cors = require("cors");

require("dotenv").config(); // if you're using a .env locally for testing

const app = express();
app.use(express.json());
app.use(cors());

// Init Razorpay with env variables (set these on Render)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Subscription amount default (₹10)
const DEFAULT_AMOUNT = 10 * 100; // paise

// -------------------------
// Create order endpoint
// -------------------------
app.post("/create-order", async (req, res) => {
  try {
    // allow frontend to send amount (in rupees) or fallback to default
    const requestedAmountRupees = req.body && req.body.amount;
    const amountPaise = requestedAmountRupees
      ? Number(requestedAmountRupees) * 100
      : DEFAULT_AMOUNT;

    const options = {
      amount: amountPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1, // important: enable auto-capture
    };

    const order = await razorpay.orders.create(options);

    // return fields the frontend expects
    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    });
  } catch (err) {
    console.error("Order creation failed:", err);
    return res.status(500).json({ success: false, message: "Order creation failed" });
  }
});

// -------------------------
// Verify payment endpoint
// -------------------------
// Expects body with razorpay_order_id, razorpay_payment_id, razorpay_signature
app.post("/verify-payment", (req, res) => {
  try {
    // These keys come from Razorpay checkout response
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    // Compute expected signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Verified — the payment is authentic
      return res.status(200).json({ success: true, message: "Payment verified" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (err) {
    console.error("verify-payment error:", err);
    return res.status(500).json({ success: false, message: "Verification failed" });
  }
});

// Health check / root
app.get("/", (req, res) => res.send({ status: "ok" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
