const express = require("express");
const Razorpay = require("razorpay");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,         // <-- Correct usage
  key_secret: process.env.RAZORPAY_KEY_SECRET, // <-- Correct usage
});

// Subscription amount (₹10)
const SUBSCRIPTION_AMOUNT = 10;

// Create order endpoint - sets payment_capture: 1 for auto-capture
app.post("/create-order", async (req, res) => {
  try {
    const options = {
      amount: SUBSCRIPTION_AMOUNT * 100, // paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
      payment_capture: 1, // <- auto-capture enabled!
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    res.status(500).send({ error: "Failed to create order" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
