console.log(">>> server.js starting");

const express = require("express");
const fs = require("fs");
const path = require("path");
const Stripe = require("stripe");

console.log(">>> core modules loaded");

// Internal logic
const { getMonday } = require("./engine/dates");
const { buildPlan } = require("./engine/plan");
const { renderHtml } = require("./renderHtml");

// PDF generator
const generatePdf = require("./generatePdf");

console.log(">>> internal modules loaded");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || "local-dev-key";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const OUTPUT_DIR = path.join(__dirname, "output");


// ===================================================
// ✅ STRIPE WEBHOOK — MOET HELEMAAL BOVENAAN
// ===================================================
app.post(
  "/webhook/stripe",
  express.raw({ type: "*/*
