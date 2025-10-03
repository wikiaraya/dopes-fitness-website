const express = require("express");
const Razorpay = require("razorpay");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const app = express();
app.use(bodyParser.json());

// Razorpay setup (keep keys in Render → Environment Variables)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Subscription amount (₹10 here)
const SUBSCRIPTION_AMOUNT = 10;

// Test route
app.get("/", (req, res) => {
  res.send("Razorpay Backend Running 🚀");
});

// API to create an order (automatic capture enabled)
app.post("/create-order", async (req, res) => {
  try {
    const options = {
      amount: SUBSCRIPTION_AMOUNT * 100, // paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
      payment_capture: 1, // <-- automatic capture!
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).send({ error: "Failed to create order" });
  }
});

// API to verify payment (important for security!)
app.post("/verify-payment", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    // Payment verified successfully (already captured automatically!)
    return res.json({ success: true, message: "Payment verified & captured ✅" });
  } else {
    // Verification failed
    return res.status(400).json({ success: false, message: "Payment verification failed ❌" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
