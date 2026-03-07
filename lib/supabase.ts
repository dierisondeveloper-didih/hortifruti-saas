import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://vkumsusmkyxmhgraqdms.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrdW1zdXNta3l4bWhncmFxZG1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MjU0MDMsImV4cCI6MjA4ODMwMTQwM30.43v1bKzbfAnip_5rkX_GCT7GT1Rf9hYvfnbxlaJoebo"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
