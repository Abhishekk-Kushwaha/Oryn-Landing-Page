import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false,
  },
};

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "whsec_mock";
  const rawBody = await getRawBody(req);

  const shasum = crypto.createHmac("sha256", secret);
  shasum.update(rawBody);
  const digest = shasum.digest("hex");

  if (digest !== req.headers["x-razorpay-signature"]) {
    console.error(`[Webhook] Invalid signature. Expected: ${digest}, Received: ${req.headers["x-razorpay-signature"]}`);
    return res.status(400).json({ error: "Invalid signature" });
  }

  console.log("[Webhook] Signature is valid.");
  const event = JSON.parse(rawBody.toString());

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const payment = event.payload.payment.entity;
    const userId = payment.notes?.userId;
    const planId = payment.notes?.planId || "monthly";
    const pSource = payment.notes?.purchase_source || "landing_page";
    const amount = payment.amount;

    let expectedAmount = 9900;
    if (planId === "half_yearly" || planId === "biannual") expectedAmount = 24900;

    if (amount < expectedAmount) {
      console.error(`[Webhook] Payment amount ${amount} is less than expected ${expectedAmount} for plan ${planId}`);
      return res.status(200).json({ status: "ignored_invalid_amount" });
    }

    console.log("Payment captured for order:", payment.order_id, "userId:", userId);

    if (userId) {
      try {
        const supabase = createClient(
          process.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co",
          process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder",
          { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { data: userResp, error: userErr } = await supabase.auth.admin.getUserById(userId);
        
        console.log(`[Webhook] Supabase lookup for user ${userId}. Success: ${!userErr}`);
        
        if (userErr || !userResp?.user) {
          throw new Error("User not found: " + (userErr?.message || ""));
        }

        const metadata = userResp.user.user_metadata || {};
        const currentEndDate = metadata.pro_end_date ? new Date(metadata.pro_end_date) : null;

        let newEndDate = new Date();
        if (currentEndDate && currentEndDate > newEndDate) {
          newEndDate = new Date(currentEndDate);
        }

        if (planId === "monthly") newEndDate.setDate(newEndDate.getDate() + 30);
        else if (planId === "half_yearly" || planId === "biannual") newEndDate.setDate(newEndDate.getDate() + 180);
        else newEndDate.setDate(newEndDate.getDate() + 30);

        // Deduplication
        const { error: insertErr } = await supabase.from("payments").insert([{
          user_id: userId,
          payment_id: payment.id,
          plan: planId,
          amount: amount / 100
        }]);

        if (insertErr) {
          if (insertErr.code === "23505" || insertErr.message.includes("duplicate key")) {
            console.log("Payment already processed by verify or webhook. Skipping.");
            return res.status(200).json({ status: "ok_skipped_duplicate" });
          }
          throw new Error("Failed to record payment: " + insertErr.message);
        }

        const { data: updateResp, error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...metadata,
            is_pro: true,
            pro_plan: planId,
            pro_end_date: newEndDate.toISOString(),
            purchase_source: pSource
          }
        });

        console.log(`[Webhook] Supabase metadata update. Success: ${!updateErr}`);

        if (updateErr) throw updateErr;
        console.log("[Webhook] Successfully updated pro status via webhook for user:", userId);
      } catch (err) {
        console.error("[Webhook] Caught exception updating user:", err);
      }
    }
  }

  res.status(200).json({ status: "ok" });
}
