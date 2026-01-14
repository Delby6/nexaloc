// server/routes/stripeWebhook.js
import express from "express";
import Stripe from "stripe";
import { supabase } from "../supabaseClient.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// IMPORTANT: Webhook MUST use RAW body
router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    console.log("🔥 STRIPE WEBHOOK HIT");

    const sig = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        endpointSecret
      );
    } catch (err) {
      console.error("❌ Webhook signature error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`⚡ Stripe Event Received: ${event.type}`);

    try {
      /* -------------------------------------------------------
         CASES WE HANDLE
         - subscription.created
         - subscription.updated
         - subscription.deleted
      ------------------------------------------------------- */

      switch (event.type) {
        /* -------------------------------------------------------
           SUBSCRIPTION CREATED
        ------------------------------------------------------- */
        case "customer.subscription.created": {
          const sub = event.data.object;

          const userId = sub.metadata.user_id;
          const planCode = sub.metadata.plan_code || "pro";
          const stripeCustomerId = sub.customer;
          const stripeSubscriptionId = sub.id;

          const trialEnd = sub.trial_end
            ? new Date(sub.trial_end * 1000).toISOString()
            : null;

          console.log("📌 Creating subscription row for user:", userId);

          const { error } = await supabase
            .from("billing_subscriptions")
            .upsert(
              {
                user_id: userId,
                plan: planCode,
                status: sub.status, // likely 'trialing'
                stripe_customer_id: stripeCustomerId,
                stripe_subscription_id: stripeSubscriptionId,
                trial_end: trialEnd,
                trial_ends_at: trialEnd,
                cancel_at: null,
              },
              { onConflict: "user_id" }
            );

          if (error) console.error("❌ Supabase upsert error:", error);
          else console.log("✨ Subscription inserted/updated!");

          break;
        }

        /* -------------------------------------------------------
           SUBSCRIPTION UPDATED
        ------------------------------------------------------- */
        case "customer.subscription.updated": {
          const sub = event.data.object;

          const stripeSubscriptionId = sub.id;
          const status = sub.status; // active, trialing, canceled, past_due
          const cancelAt = sub.cancel_at
            ? new Date(sub.cancel_at * 1000).toISOString()
            : null;
          const trialEnd = sub.trial_end
            ? new Date(sub.trial_end * 1000).toISOString()
            : null;

          console.log(
            "📌 Updating subscription:",
            stripeSubscriptionId,
            "→",
            status
          );

          const { error } = await supabase
            .from("billing_subscriptions")
            .update({
              status,
              cancel_at: cancelAt,
              trial_end: trialEnd,
              trial_ends_at: trialEnd,
              plan: "pro", // Always PRO plan in your SaaS
            })
            .eq("stripe_subscription_id", stripeSubscriptionId);

          if (error) console.error("❌ Subscription update error:", error);
          else console.log("✨ Subscription updated!");

          break;
        }


        /* -------------------------------------------------------
           SUBSCRIPTION COMPLETED
        ------------------------------------------------------- */
        case "checkout.session.completed": {
          const session = event.data.object;

          if (session.mode !== "subscription") break;

          const userId = session.metadata?.user_id;
          const planCode = session.metadata?.plan_code || "pro";
          const stripeCustomerId = session.customer;
          const stripeSubscriptionId = session.subscription;

          if (!userId) {
            console.error("❌ Missing user_id in checkout.session.completed metadata");
            break;
          }

          console.log("📌 Checkout completed → upserting subscription row for user:", userId);

          const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);

          const trialEnd = sub.trial_end
            ? new Date(sub.trial_end * 1000).toISOString()
            : null;

          const cancelAt = sub.cancel_at
            ? new Date(sub.cancel_at * 1000).toISOString()
            : null;

          const { error } = await supabase
            .from("billing_subscriptions")
            .upsert(
              {
                user_id: userId,
                plan: planCode,
                status: sub.status,
                stripe_customer_id: stripeCustomerId,
                stripe_subscription_id: stripeSubscriptionId,
                trial_end: trialEnd,
                trial_ends_at: trialEnd,
                cancel_at: cancelAt,
              },
              { onConflict: "user_id" }
            );

          if (error) console.error("❌ Supabase upsert error:", error);
          else console.log("✨ Subscription inserted/updated via checkout.session.completed!");

          break;
        }
        
        /* -------------------------------------------------------
           SUBSCRIPTION DELETED
           (user canceled and period ended)
        ------------------------------------------------------- */
        case "customer.subscription.deleted": {
          const sub = event.data.object;

          const stripeSubscriptionId = sub.id;

          console.log("📌 Subscription deleted:", stripeSubscriptionId);

          const { error } = await supabase
            .from("billing_subscriptions")
            .update({
              status: "canceled",
              cancel_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", stripeSubscriptionId);

          if (error) console.error("❌ Delete update error:", error);
          else console.log("✨ Subscription marked as canceled!");

          break;
        }

        default:
          console.log("ℹ️ Unhandled event type:", event.type);
      }
    } catch (err) {
      console.error("❌ Webhook processing error:", err);
      return res.status(500).send("Webhook handler failed");
    }

    res.status(200).send("OK");
  }
);

export default router;
