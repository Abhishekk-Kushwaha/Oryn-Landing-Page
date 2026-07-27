import crypto from "crypto";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_mock",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "secret_mock",
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, planId } = req.body;
  const secret = process.env.RAZORPAY_KEY_SECRET || "secret_mock";

  console.log(`[Verify] Request received. Order ID: ${razorpay_order_id}, Payment ID: ${razorpay_payment_id}`);

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
  const generated_signature = hmac.digest("hex");

  console.log(`[Verify] Signature check. Expected: ${generated_signature}, Received: ${razorpay_signature}`);

  if (generated_signature !== razorpay_signature) {
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }

  try {
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    if (payment.status !== "captured") {
      return res.status(400).json({ success: false, message: "Payment not captured" });
    }

    const pUserId = payment.notes?.userId || userId;
    const pPlanId = payment.notes?.planId || planId || "monthly";
    const pSource = payment.notes?.purchase_source || req.body.purchase_source || "landing_page";

    let expectedAmount = 9900;
    if (pPlanId === "half_yearly" || pPlanId === "biannual") expectedAmount = 24900;

    if (payment.amount < expectedAmount) {
      return res.status(400).json({ success: false, message: "Paid amount is less than expected plan amount" });
    }

    if (pUserId) {
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co",
        process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder",
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const { data: userResp, error: userErr } = await supabase.auth.admin.getUserById(pUserId);
      
      console.log(`[Verify] Supabase user lookup for ID ${pUserId}. Success: ${!userErr}`);
      
      if (userErr || !userResp?.user) {
        throw new Error("User not found: " + (userErr?.message || ""));
      }

      const metadata = userResp.user.user_metadata || {};
      const currentEndDate = metadata.pro_end_date ? new Date(metadata.pro_end_date) : null;

      let newEndDate = new Date();
      if (currentEndDate && currentEndDate > newEndDate) {
        newEndDate = new Date(currentEndDate);
      }

      if (pPlanId === "monthly") newEndDate.setDate(newEndDate.getDate() + 30);
      else if (pPlanId === "half_yearly" || pPlanId === "biannual") newEndDate.setDate(newEndDate.getDate() + 180);
      else newEndDate.setDate(newEndDate.getDate() + 30);

      // Deduplication
      const { error: insertErr } = await supabase.from("payments").insert([{
        user_id: pUserId,
        payment_id: razorpay_payment_id,
        plan: pPlanId,
        amount: payment.amount / 100
      }]);

      if (insertErr) {
        if (insertErr.code === "23505" || insertErr.message.includes("duplicate key")) {
          return res.json({ success: true, message: "Payment already processed successfully" });
        }
        throw new Error("Failed to record payment: " + insertErr.message);
      }

      const { data: updateResp, error: updateErr } = await supabase.auth.admin.updateUserById(pUserId, {
        user_metadata: {
          ...metadata,
          is_pro: true,
          pro_plan: pPlanId,
          pro_end_date: newEndDate.toISOString(),
          purchase_source: pSource
        }
      });

      console.log(`[Verify] Supabase metadata update. Success: ${!updateErr}`);

      if (updateErr) throw updateErr;

      return res.json({ success: true, message: "Payment verified and metadata updated successfully" });
    }

    console.log("[Verify] Completed without user ID");
    res.json({ success: true, message: "Payment verified successfully (no user ID passed)" });
  } catch (err) {
    console.error("[Verify] Caught exception:", err);
    return res.status(500).json({ success: false, message: "Verification process failed. " + err.message });
  }
}
