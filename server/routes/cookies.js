// server/routes/cookies.js
import express from "express";
import { supabase } from "../supabaseClient.js";
import { Parser } from "json2csv";

const router = express.Router();

/* -------------------------------------------------------
   1) POST /consent-log
   Store cookie consent logs from the frontend
------------------------------------------------------- */
router.post("/consent-log", async (req, res) => {
  console.log("🔥 Received cookie consent:", req.body);

  const { user_id, role, action, preferences } = req.body;

  const userAgent = req.headers["user-agent"] || null;
  const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  const { data, error } = await supabase.from("cookie_consents").insert([
    {
      user_id,
      role,
      action,
      preferences,
      user_agent: userAgent,
      ip_address: ipAddress
    }
  ]);

  if (error) {
    console.error("❌ Supabase INSERT ERROR:", error);
    return res.status(500).json({ success: false, error });
  }

  console.log("✅ Inserted row:", data);
  return res.json({ success: true, data });
});



/* -------------------------------------------------------
   2) GET /export-csv
   Admin-only CSV export of cookie consent logs
------------------------------------------------------- */
router.get("/export-csv", async (req, res) => {
  // You should replace this check with JWT middleware later
  const adminRole = req.headers["x-admin-role"];

  if (adminRole !== "admin") {
    return res.status(403).json({ error: "Not authorized" });
  }

  // Calls your Supabase RPC function "export_cookie_logs"
  const { data, error } = await supabase.rpc("export_cookie_logs");

  if (error) {
    console.error("CSV export error:", error);
    return res.status(500).json({ error: "Failed to export logs" });
  }

  // Convert JSON → CSV
  const parser = new Parser();
  const csv = parser.parse(data);

  // Return as downloadable CSV file
  res.header("Content-Type", "text/csv");
  res.attachment("cookie_logs.csv");
  return res.send(csv);
});

export default router;
