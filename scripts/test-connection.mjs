import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load .env.local or .env
function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const idx = trimmed.indexOf("=");
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
          process.env[key] = val;
        }
      }
      return file;
    }
  }
  return null;
}

const loadedFile = loadEnv();

console.log("--------------------------------------------------");
console.log("🔍 TaskMint Supabase Database Verification");
console.log("--------------------------------------------------");

if (!loadedFile) {
  console.log("❌ No .env.local or .env file found in TaskMint folder.");
  console.log("👉 Please create .env.local with your Supabase credentials:");
  console.log("   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co");
  console.log("   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...");
  console.log("   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...");
  process.exit(1);
}

console.log(`📁 Loaded configuration from: ${loadedFile}`);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || url.includes("your-project") || !anonKey || anonKey.includes("your-anon-key")) {
  console.log("❌ Placeholder values found in your environment file.");
  console.log("👉 Please put your real Supabase Project URL and Anon/Service keys into .env.local");
  process.exit(1);
}

const client = createClient(url, serviceKey || anonKey);

async function testDatabase() {
  console.log(`📡 Connecting to Supabase URL: ${url}`);

  try {
    // 1. Check profiles table
    const { count: profilesCount, error: profilesError } = await client
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (profilesError) {
      console.log(`❌ Table 'profiles' check failed: ${profilesError.message}`);
    } else {
      console.log(`✅ Table 'profiles' is ready (rows: ${profilesCount ?? 0})`);
    }

    // 2. Check transactions table
    const { count: txCount, error: txError } = await client
      .from("transactions")
      .select("*", { count: "exact", head: true });

    if (txError) {
      console.log(`❌ Table 'transactions' check failed: ${txError.message}`);
    } else {
      console.log(`✅ Table 'transactions' is ready (rows: ${txCount ?? 0})`);
    }

    // 3. Check withdrawals table
    const { count: withCount, error: withError } = await client
      .from("withdrawals")
      .select("*", { count: "exact", head: true });

    if (withError) {
      console.log(`❌ Table 'withdrawals' check failed: ${withError.message}`);
    } else {
      console.log(`✅ Table 'withdrawals' is ready (rows: ${withCount ?? 0})`);
    }

    if (!profilesError && !txError && !withError) {
      console.log("--------------------------------------------------");
      console.log("🎉 SUCCESS! All TaskMint tables are properly installed in Supabase!");
      console.log("--------------------------------------------------");
    }
  } catch (err) {
    console.log("❌ Connection error:", err.message);
  }
}

testDatabase();
