/************************************
 * ENV & IMPORTS
 ************************************/
require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const Stripe = require("stripe");
const sgMail = require("@sendgrid/mail");

// Engine
const { getMonday } = require("./engine/dates");
const { buildPlan } = require("./engine/plan");
const { renderHtml } = require("./renderHtml");
const generatePdf = require("./generatePdf");

console.log(">>> RUNIQ API starting");

/************************************
 * APP INIT
 ************************************/
const app = express();
const PORT = process.env.PORT || 3000;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const OUTPUT_DIR = path.join(__dirname, "output");
const PLANS_DIR = path.join(__dirname, "plans");

/************************************
 * 1️⃣ STRIPE WEBHOOK (ABSOLUUT EERST)
 ************************************/
app.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Invalid Stripe signature", err.message);
      return res.status(400).send("Invalid signature");
    }

    if (event.type !== "checkout.session.completed") {
      return res.json({ ignored: true });
    }

    const session = event.data.object;
    const planId = session.metadata?.plan_id;
    const email = session.customer_details?.email;

    if (!planId) {
      return res.status(400).json({ error: "Missing plan_id" });
    }

    console.log("✅ Payment completed for", planId);

    try {
      const formData = loadPlanData(planId);
      const startMonday = getMonday(formData.raceDate);

      const plan = buildPlan({
        startMonday,
        numberOfWeeks: formData.numberOfWeeks,
        sessionsPerWeek: formData.sessionsPerWeek,
        startWeekVolume: formData.startWeekV
