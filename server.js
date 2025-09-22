const express = require("express");
const Razorpay = require("razorpay");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const app = express();
app.use(bodyParser.json());

// Razorpay setup (keys stored in Render → Environment Variables)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Subscription amount (₹10)
const SUBSCRIPTION_AMOUNT = 10;

// Test route
app.get("/", (req, res) => {
  res.send("Razorpay Backend Running 🚀");
});

// API to create an order
app.post("/create-order", async (req, res) => {
  try {
    const options = {
      amount: SUBSCRIPTION_AMOUNT * 100, // Razorpay works in paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).send({ error: "Failed to create order" });
  }
});

// ✅ API to verify payment
app.post("/verify-payment", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      console.log("✅ Payment verified:", razorpay_payment_id);
      res.json({ status: "success", paymentId: razorpay_payment_id });
    } else {
      console.log("❌ Payment verification failed");
      res.status(400).json({ status: "failure" });
    }
  } catch (err) {
    console.error("Error verifying payment:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
