import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xlsuoimvctjjvedyhewn.supabase.co"; 
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsc3VvaW12Y3RqanZlZHloZXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1Mjg0MTMsImV4cCI6MjA3NzEwNDQxM30.PcaSMuV1Itul5yqyjBFK0wNnYmx_JfAuWELU3Qso014"; // from Supabase settings

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;