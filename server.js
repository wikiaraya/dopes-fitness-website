const express = require("express");
const Razorpay = require("razorpay");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// Razorpay setup (keys will be stored in Render → Environment Variables)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Subscription amount (₹50)
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
