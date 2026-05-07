const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const app = express();
app.use(express.json());

// ✅ Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ One-time subscription amount
const SUBSCRIPTION_AMOUNT = 1;

// ✅ 1️⃣ Create Order Endpoint
app.post("/create-order", async (req, res) => {
  try {

    const options = {
      amount: SUBSCRIPTION_AMOUNT * 100, // ₹50 → 5000 paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    });

  } catch (err) {

    console.error("❌ Error creating order:", err);

    res.status(500).json({
      success: false,
      error: "Failed to create order",
    });

  }
});

// ✅ 2️⃣ Verify & Capture Payment Endpoint
app.post("/verify-payment", async (req, res) => {

  try {

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    // ✅ Create expected signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    // ✅ Verify payment signature
    if (expectedSignature === razorpay_signature) {

      // ✅ MANUALLY CAPTURE PAYMENT
      await razorpay.payments.capture(
        razorpay_payment_id,
        SUBSCRIPTION_AMOUNT * 100,
        "INR"
      );

      console.log("✅ Payment verified & captured successfully");

      return res.json({
        success: true,
        message: "Payment verified and captured ✅",
      });

    } else {

      console.warn("⚠️ Signature mismatch");

      return res.status(400).json({
        success: false,
        message: "Payment verification failed ❌",
      });

    }

  } catch (err) {

    console.error("❌ Verification/Capture error:", err);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });

  }

});

// ✅ 3️⃣ Create Invoice Endpoint
app.post("/create-invoice", async (req, res) => {

  try {

    const {
      customer_name,
      customer_email,
      amount,
      order_id
    } = req.body;

    const invoiceOptions = {

      type: "invoice",

      description: "Dopes Fitness Subscription Payment",

      customer: {
        name: customer_name,
        email: customer_email,
      },

      line_items: [
        {
          name: "Dopes Fitness Subscription",
          description: "One-Time Premium Access",
          amount: amount * 100,
          currency: "INR",
          quantity: 1,
        },
      ],

      order_id,

      sms_notify: 1,
      email_notify: 1,

    };

    const invoice = await razorpay.invoices.create(invoiceOptions);

    res.json({
      success: true,
      invoice_id: invoice.id,
      short_url: invoice.short_url,
      message: "Invoice created successfully 🧾",
    });

  } catch (err) {

    console.error("❌ Error creating invoice:", err);

    res.status(500).json({
      success: false,
      message: "Failed to create invoice",
    });

  }

});

// ✅ 4️⃣ Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
