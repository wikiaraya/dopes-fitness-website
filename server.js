const express = require("express");
const Razorpay = require("razorpay");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const app = express();
app.use(bodyParser.json());

// ✅ Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Subscription amount (₹50)
const SUBSCRIPTION_AMOUNT = 50;

// ✅ 1️⃣ Create Order Endpoint
app.post("/create-order", async (req, res) => {
  try {
    const options = {
      amount: SUBSCRIPTION_AMOUNT * 100, // Convert ₹10 → 1000 paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
      payment_capture: 1, // Auto-capture enabled
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
    res.status(500).send({ success: false, error: "Failed to create order" });
  }
});

// ✅ 2️⃣ Verify Payment Endpoint
app.post("/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      console.log("✅ Payment verified successfully for:", razorpay_order_id);
      return res.json({ success: true, message: "Payment verified successfully ✅" });
    } else {
      console.warn("⚠️ Signature mismatch");
      return res.status(400).json({ success: false, message: "Payment verification failed ❌" });
    }
  } catch (err) {
    console.error("❌ Verification error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// ✅ 3️⃣ Create Invoice Endpoint
app.post("/create-invoice", async (req, res) => {
  try {
    const { customer_name, customer_email, amount, order_id } = req.body;

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
          description: "Monthly Subscription Plan",
          amount: amount * 5000, // Convert to paise
          currency: "INR",
          quantity: 1,
        },
      ],
      order_id, // Link invoice to the Razorpay order
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
    res.status(500).json({ success: false, message: "Failed to create invoice" });
  }
});

// ✅ 4️⃣ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
