import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

console.log("Razorpay Auth Debug", {
  hasKeyId: Boolean(keyId),
  hasKeySecret: Boolean(keySecret),
  keyIdPrefix: keyId?.substring(0, 8)
});

const razorpay = new Razorpay({
  key_id: keyId || "rzp_test_mock",
  key_secret: keySecret || "secret_mock",
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, planId, purchase_source } = req.body;

    const isSixMonths = (planId === "half_yearly" || planId === "biannual");
    const validPlanId = isSixMonths ? "biannual" : "monthly";
    
    // Server-enforced pricing
    let amountPaise = 9900; // 99 INR for monthly
    if (validPlanId === "biannual") amountPaise = 24900; // 249 INR

    const options = {
      amount: amountPaise,
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
      notes: {
        userId: userId || "",
        planId: validPlanId,
        purchase_source: purchase_source || "landing_page",
      },
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    res.status(500).json({ error: err.message });
  }
}
