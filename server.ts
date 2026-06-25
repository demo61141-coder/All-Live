import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { AppConfig, AppButton, NotificationItem } from "./src/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// API route: Load system configuration (sanitized to prevent administrative secret leaks to ordinary users)
app.get("/api/config", (req, res) => {
  try {
    const dataPath = path.join(__dirname, "data-store.json");
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ error: "Data store file not found" });
    }
    const rawData = fs.readFileSync(dataPath, "utf8");
    const parsedData: AppConfig = JSON.parse(rawData);

    // Deep copy and strip credentials
    const sanitized = { ...parsedData };
    delete (sanitized as any).adminCode;
    delete (sanitized as any).adminCodeSecondary;
    delete (sanitized as any).securityAnswer;
    delete (sanitized as any).feedbacks; // Feedbacks may contain user private billing metadata
    delete (sanitized as any).users; // Hide user list from public clients
    
    // Fallback/Default values for customization options
    if (!sanitized.appName) sanitized.appName = "ALL LIVE";
    if (!sanitized.adTitle) sanitized.adTitle = "আপনার সুবিধাজনক বাটন বেছে নিন";
    if (!sanitized.adDescription) sanitized.adDescription = "নিচের ওয়াচ বাটনসমূহে ক্লিক করলেই স্পন্সর বিজ্ঞাপনটি শুরু হবে। ৫ সেকেন্ড বিজ্ঞাপন দেখে ওয়েবসাইট উপভোগ করুন।";
    if (!sanitized.backButtonText) sanitized.backButtonText = "হোমপেজে ফিরুন (Ad সহ)";
    if (sanitized.backButtonAdTrigger === undefined) sanitized.backButtonAdTrigger = true;

    // Send public settings only
    res.json(sanitized);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to load configuration" });
  }
});

// Helper validation middleware
const checkAdminAuth = (req: any): { success: boolean; config?: AppConfig; error?: string } => {
  const dataPath = path.join(__dirname, "data-store.json");
  if (!fs.existsSync(dataPath)) {
    return { success: false, error: "Database file absent" };
  }
  const rawData = fs.readFileSync(dataPath, "utf8");
  const config: AppConfig = JSON.parse(rawData);

  const storedPin1 = config.adminCode || "1234";
  const storedPin2 = config.adminCodeSecondary || "5678";

  const pin1 = (req.headers["x-admin-pin"] || req.body?.pin1 || "").toString().trim();
  const pin2 = (req.headers["x-admin-pin-secondary"] || req.body?.pin2 || "").toString().trim();

  // Enforce credentials check
  if (pin1 === storedPin1 && pin2 === storedPin2) {
    return { success: true, config };
  }

  // Support master override/failsafe if DB is missing values
  if (pin1 === "1234" && pin2 === "5678" && !config.adminCodeSecondary) {
    return { success: true, config };
  }

  return { success: false, error: "ভুল এডমিন পিন কোড! অ্যাক্সেস প্রত্যাখ্যাত।" };
};

// API route: Live check for Step 1 PIN verification
app.post("/api/admin/verify-step1", (req, res) => {
  try {
    const dataPath = path.join(__dirname, "data-store.json");
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ error: "Database file absent" });
    }
    const rawData = fs.readFileSync(dataPath, "utf8");
    const config: AppConfig = JSON.parse(rawData);

    const checkPin1 = (req.body?.pin1 || "").toString().trim();
    const storedPin1 = (config.adminCode || "1234").toString().trim();

    if (checkPin1 === storedPin1) {
      res.json({ success: true, message: "প্রথম পিন কোডটি সঠিক হয়েছে।" });
    } else {
      res.status(401).json({ success: false, error: "ভুল প্রথম পিন কোড!" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API route: Secure admin verification and raw details loading
app.post("/api/admin/verify-pin", (req, res) => {
  const auth = checkAdminAuth(req);
  if (auth.success && auth.config) {
    const rawConfig = { ...auth.config };
    if (!rawConfig.appName) rawConfig.appName = "ALL LIVE";
    if (!rawConfig.adTitle) rawConfig.adTitle = "আপনার সুবিধাজনক বাটন বেছে নিন";
    if (!rawConfig.adDescription) rawConfig.adDescription = "নিচের ওয়াচ বাটনসমূহে ক্লিক করলেই স্পন্সর বিজ্ঞাপনটি শুরু হবে। ৫ সেকেন্ড বিজ্ঞাপন দেখে ওয়েবসাইট উপভোগ করুন।";
    if (!rawConfig.backButtonText) rawConfig.backButtonText = "হোমপেজে ফিরুন (Ad সহ)";
    if (rawConfig.backButtonAdTrigger === undefined) rawConfig.backButtonAdTrigger = true;
    if (!rawConfig.users) rawConfig.users = [];
    res.json({ success: true, config: rawConfig });
  } else {
    res.status(401).json({ success: false, error: auth.error });
  }
});

// API route: Secure PIN recovery via secret question
app.post("/api/admin/verify-recovery", (req, res) => {
  try {
    const dataPath = path.join(__dirname, "data-store.json");
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ error: "Database missing" });
    }
    const rawData = fs.readFileSync(dataPath, "utf8");
    const config: AppConfig = JSON.parse(rawData);

    const { answer, pin1, pin2 } = req.body;
    if (!answer || !pin1 || !pin2) {
      return res.status(400).json({ error: "প্রশ্নের উত্তর ও নতুন কোডসমূহ আবশ্যক!" });
    }

    const storedAnswer = (config.securityAnswer || "নীল").toString().trim().toLowerCase();
    if (answer.toString().trim().toLowerCase() === storedAnswer) {
      config.adminCode = pin1.toString().trim();
      config.adminCodeSecondary = pin2.toString().trim();
      fs.writeFileSync(dataPath, JSON.stringify(config, null, 2), "utf8");
      return res.json({ success: true, message: "পিন কোডদ্বয় সফলভাবে পরিবর্তন হয়েছে!", config });
    } else {
      return res.status(401).json({ error: "নিরাপত্তা প্রশ্নের উত্তরটি সঠিক নয়।" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API route: Securely update complete configuration (Requires PIN check in headers)
app.post("/api/config", (req, res) => {
  try {
    const auth = checkAdminAuth(req);
    if (!auth.success) {
      return res.status(401).json({ error: auth.error });
    }

    const dataPath = path.join(__dirname, "data-store.json");
    const updatedConfig: AppConfig = req.body;
    
    // Validate request briefly
    if (!updatedConfig || !Array.isArray(updatedConfig.buttons)) {
      return res.status(400).json({ error: "Invalid configuration data structure" });
    }

    // Keep the pins in synchronized memory if they were modified by the post body
    const freshConfig = {
      ...auth.config,
      ...updatedConfig
    };

    fs.writeFileSync(dataPath, JSON.stringify(freshConfig, null, 2), "utf8");
    res.json({ success: true, message: "Configuration saved successfully", config: freshConfig });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to save configuration" });
  }
});

// API route: Public Feedback Submit (Bypasses PIN checks to let general users suggest features)
app.post("/api/feedback/submit", (req, res) => {
  try {
    const dataPath = path.join(__dirname, "data-store.json");
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ error: "Database file missing" });
    }
    const rawData = fs.readFileSync(dataPath, "utf8");
    const config: AppConfig = JSON.parse(rawData);

    const { userName, userComment } = req.body;
    if (!userName || !userComment) {
      return res.status(400).json({ error: "নাম ও মন্তব্য দুটোই প্রদান করুন।" });
    }

    const newFeedback = {
      id: `fb_${Date.now()}`,
      userName: userName.toString().trim(),
      userComment: userComment.toString().trim(),
      submittedAt: new Date().toISOString()
    };

    if (!config.feedbacks) {
      config.feedbacks = [];
    }
    config.feedbacks.unshift(newFeedback);

    fs.writeFileSync(dataPath, JSON.stringify(config, null, 2), "utf8");
    res.json({ success: true, feedback: newFeedback });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API route: Public user session sync / automatic registration (User Analytics)
app.post("/api/users/sync", (req, res) => {
  try {
    const dataPath = path.join(__dirname, "data-store.json");
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ error: "Database file missing" });
    }
    const rawData = fs.readFileSync(dataPath, "utf8");
    const config = JSON.parse(rawData);

    const { id, username, createdAt, deviceInfo, visitCount } = req.body;
    if (!id || !username) {
      return res.status(400).json({ error: "id and username are required" });
    }

    if (!config.users) {
      config.users = [];
    }

    const existingIndex = config.users.findIndex((u: any) => u.id === id);
    const nowStr = new Date().toISOString();

    if (existingIndex !== -1) {
      config.users[existingIndex] = {
        ...config.users[existingIndex],
        username: username.toString().trim(),
        lastActive: nowStr,
        visitCount: typeof visitCount === "number" ? visitCount : (config.users[existingIndex].visitCount || 1) + 1,
        deviceInfo: deviceInfo || config.users[existingIndex].deviceInfo || "Unknown"
      };
    } else {
      config.users.unshift({
        id,
        username: username.toString().trim(),
        createdAt: createdAt || nowStr,
        lastActive: nowStr,
        deviceInfo: deviceInfo || "Unknown Browser",
        visitCount: visitCount || 1
      });
    }

    // Keep it trimmed to top 200 users to prevent data-store from growing too large
    if (config.users.length > 200) {
      config.users = config.users.slice(0, 200);
    }

    fs.writeFileSync(dataPath, JSON.stringify(config, null, 2), "utf8");
    res.json({ success: true, user: config.users.find((u: any) => u.id === id) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API route: Admin-only delete user from analytics list
app.post("/api/admin/users/delete", (req, res) => {
  try {
    const auth = checkAdminAuth(req);
    if (!auth.success) {
      return res.status(401).json({ error: auth.error });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const dataPath = path.join(__dirname, "data-store.json");
    const rawData = fs.readFileSync(dataPath, "utf8");
    const config = JSON.parse(rawData);

    if (config.users) {
      config.users = config.users.filter((u: any) => u.id !== userId);
    }

    fs.writeFileSync(dataPath, JSON.stringify(config, null, 2), "utf8");
    res.json({ success: true, message: "User deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API route: Public Donation Submit (Bypasses PIN checks to let users register donation and claim Ad-Block)
app.post("/api/donation/submit", (req, res) => {
  try {
    const dataPath = path.join(__dirname, "data-store.json");
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ error: "Database file missing" });
    }
    const rawData = fs.readFileSync(dataPath, "utf8");
    const config: AppConfig = JSON.parse(rawData);

    const { userName, userPhoneOrTxid, amount } = req.body;
    if (!userName || !userPhoneOrTxid || !amount) {
      return res.status(400).json({ error: "সকল তথ্য (নাম, ওয়ালেট/TxID, ও পরিমাণ) পূরণ করুন।" });
    }

    // Generate a beautiful, unique activation code for the license claim
    const codeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomKey = "ADBLK-";
    for (let i = 0; i < 6; i++) {
      randomKey += codeChars.charAt(Math.floor(Math.random() * codeChars.length));
    }

    const newClaim = {
      id: `claim_${Date.now()}`,
      userName: userName.toString().trim(),
      userPhoneOrTxid: userPhoneOrTxid.toString().trim(),
      amount: amount.toString().trim(),
      status: "pending" as const,
      activationKey: randomKey,
      createdAt: new Date().toISOString()
    };

    if (!config.adFreeUsers) {
      config.adFreeUsers = [];
    }
    config.adFreeUsers.unshift(newClaim);

    fs.writeFileSync(dataPath, JSON.stringify(config, null, 2), "utf8");
    res.json({ success: true, claim: newClaim });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API route: Verify activation key for ad-free experience (Public client-side check)
app.post("/api/ad-free/verify", (req, res) => {
  try {
    const dataPath = path.join(__dirname, "data-store.json");
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ error: "Database file missing" });
    }
    const rawData = fs.readFileSync(dataPath, "utf8");
    const config: AppConfig = JSON.parse(rawData);

    const { activationKey } = req.body;
    if (!activationKey) {
      return res.status(400).json({ error: "Activation Key is required" });
    }

    const trimmedKey = activationKey.toString().trim().toUpperCase();
    const approvedUser = (config.adFreeUsers || []).find(
      u => u.activationKey.toUpperCase() === trimmedKey && u.status === "approved"
    );

    if (approvedUser) {
      if (approvedUser.expiryDate && approvedUser.expiryDate !== "permanent" && approvedUser.expiryDate !== "expired") {
        const expiry = new Date(approvedUser.expiryDate);
        const now = new Date();
        if (now > expiry) {
          return res.status(403).json({ success: false, error: "আপনার অ্যাড-ফ্রি লাইসেন্সের মেয়াদ শেষ হয়ে গেছে!" });
        }
      }
      res.json({ 
        success: true, 
        userName: approvedUser.userName, 
        expiryDate: approvedUser.expiryDate || "permanent",
        duration: approvedUser.duration || "permanent",
        message: "অ্যাড-ফ্রি লাইসেন্স কোড সফলভাবে সক্রিয় হয়েছে!" 
      });
    } else {
      res.status(404).json({ success: false, error: "ভুল অথবা অনিবন্ধিত অ্যাক্টিভেশন কি!" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function to turn CSV line into items, handling quotes and commas properly
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map(val => val.replace(/^"(.*)"$/, "$1")); // Strip surrounding quotes
}

// Reusable Google Sheets Sync Helper (Robust, updates config dynamically)
async function syncFromGoogleSheets(googleSheetsId: string, dataPath: string, config: AppConfig): Promise<{ success: boolean; error?: string; buttons?: AppButton[] }> {
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${googleSheetsId}/gviz/tq?tqx=out:csv`;
    console.log(`[GoogleSheetsSync] Syncing from CSV URL: ${csvUrl}`);
    
    const response = await fetch(csvUrl);
    if (!response.ok) {
      return { 
        success: false, 
        error: "Google Sheet টি ডাউনলোড করা যায়নি। অনুগ্রহ করে স্প্রেডশীট আইডি চেক করুন এবং ফাইলটি 'Anyone with the link can view' করা আছে কিনা নিশ্চিত হোন।" 
      };
    }

    const text = await response.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    
    if (lines.length < 2) {
      return { success: false, error: "গুগল শিটটি খালি অথবা কলামগুলো সঠিক নয়।" };
    }

    // Read column headers (case-insensitive)
    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
    
    const nameIndex = headers.indexOf("name");
    const logoIndex = headers.indexOf("logo");
    const linkIndex = headers.indexOf("link");
    
    // Optional columns with defaults
    const idIndex = headers.indexOf("id");
    const networkIndex = headers.indexOf("network");
    const statusIndex = headers.indexOf("status");

    if (nameIndex === -1 || linkIndex === -1) {
      return { 
        success: false, 
        error: "প্রয়োজনীয় কলাম পাওয়া যায়নি! গুগল শিটে অবশ্যই 'Name' এবং 'Link' কলাম হেডার থাকতে হবে। ঐচ্ছিক কলাম: 'Logo', 'ID', 'Network', 'Status'" 
      };
    }

    const parsedButtons: AppButton[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length < Math.max(nameIndex, linkIndex) + 1) continue;

      const name = cols[nameIndex];
      const link = cols[linkIndex];
      if (!name || !link) continue;

      const id = idIndex !== -1 && cols[idIndex] ? cols[idIndex] : `sync_btn_${Date.now()}_${i}`;
      const logo = logoIndex !== -1 && cols[logoIndex] ? cols[logoIndex] : "🔗";
      
      let networkValue = networkIndex !== -1 && cols[networkIndex] ? cols[networkIndex].toLowerCase() : "startapp";
      if (!["startapp", "monetag", "both"].includes(networkValue)) {
        networkValue = "startapp";
      }

      let statusValue = statusIndex !== -1 && cols[statusIndex] ? cols[statusIndex].toLowerCase() : "active";
      if (!["active", "inactive"].includes(statusValue)) {
        statusValue = "active";
      }

      parsedButtons.push({
        id,
        name,
        logo,
        link,
        network: networkValue as any,
        status: statusValue as any
      });
    }

    if (parsedButtons.length === 0) {
      return { success: false, error: "কোনো সঠিক রো (Row) পাওয়া যায়নি। প্রতিটি রো-তে Name এবং Link অবশ্যই দিন।" };
    }

    // Save synced buttons to the config database
    const adConfigRow = parsedButtons.find(b => 
      b.name.toLowerCase().includes("config_ads_enabled") || 
      b.name.toLowerCase().includes("ads_enabled") || 
      b.name.includes("বিজ্ঞাপন_অবস্থা")
    );
    
    if (adConfigRow) {
      const val = adConfigRow.link.trim().toLowerCase();
      config.adConfig.adsEnabled = !(val === "off" || val === "false" || val === "0" || val === "বন্ধ" || val === "inactive");
    }

    config.buttons = parsedButtons.filter(b => 
      !b.name.toLowerCase().includes("config_ads_enabled") && 
      !b.name.toLowerCase().includes("ads_enabled") && 
      !b.name.includes("বিজ্ঞাপন_অবস্থা")
    );
    config.googleSheetsId = googleSheetsId;
    
    fs.writeFileSync(dataPath, JSON.stringify(config, null, 2), "utf8");
    return { success: true, buttons: parsedButtons };
  } catch (err: any) {
    return { success: false, error: err.message || "শীট সিঙ্ক করার সময় সার্ভার এরর হয়েছে।" };
  }
}

// API route: Sync with Google Sheets
app.post("/api/sync-sheet", async (req, res) => {
  try {
    const auth = checkAdminAuth(req);
    if (!auth.success) {
      return res.status(401).json({ error: auth.error });
    }

    const { googleSheetsId } = req.body;
    if (!googleSheetsId) {
      return res.status(400).json({ error: "Google Spreadsheet ID is required" });
    }

    // Load existing config to update
    const dataPath = path.join(__dirname, "data-store.json");
    const rawData = fs.readFileSync(dataPath, "utf8");
    const config: AppConfig = JSON.parse(rawData);

    const result = await syncFromGoogleSheets(googleSheetsId, dataPath, config);
    if (result.success) {
      res.json({ 
        success: true, 
        message: `${result.buttons?.length}টি বাটন গুগল শিট থেকে সফলভাবে সিঙ্ক হয়েছে!`, 
        buttons: result.buttons,
        config
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed during sheet database fetch" });
  }
});

// API route: Live proxy for embedding custom web frame contents & bypassing CORS / X-Frame-Options
app.get("/api/proxy", async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).send("Target remote URL required");
  }

  try {
    const formattedUrl = targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`;
    
    const response = await fetch(formattedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      }
    });

    if (!response.ok) {
      return res.status(response.status).send(`Failed to proxy remote page. HTTP Status: ${response.status}`);
    }

    let contentType = response.headers.get("Content-Type") || "text/html";
    
    // Only process HTML pages to inject BASE and script cleanups
    if (contentType.includes("html")) {
      let html = await response.text();

      // Ensure base URL tag is added right after <head> so all resources resolve fully (styles, logos, JS)
      const baseTag = `<base href="${formattedUrl}">`;
      if (html.toLowerCase().includes("<head>")) {
        html = html.replace(/<head>/i, `<head>${baseTag}`);
      } else {
        html = `${baseTag}${html}`;
      }

      // Remove anti-framing frame buster scripts that compare window.top !== window.self
      // and strip CSP meta tags
      html = html.replace(/if\s*\(\s*window\.top\s*!==\s*window\.self\s*\)/gi, "if (false)");
      html = html.replace(/if\s*\(\s*top\s*!==\s*self\s*\)/gi, "if (false)");
      html = html.replace(/window\.top\.location\s*=/gi, "window.self.location =");
      html = html.replace(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, "");

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(html);
    } else {
      // Direct stream for non-HTML assets (CSS, JS, images if needed)
      const buffer = await response.arrayBuffer();
      res.setHeader("Content-Type", contentType);
      return res.send(Buffer.from(buffer));
    }
  } catch (e: any) {
    res.status(500).send(`Proxy Error: ${e.message}`);
  }
});

// Configure Vite middleware in development or express static paths in production 
async function start() {
  // Try to perform automatic background Google Sheets synchronization on startup if configured
  try {
    const dataPath = path.join(__dirname, "data-store.json");
    if (fs.existsSync(dataPath)) {
      const rawData = fs.readFileSync(dataPath, "utf8");
      const config: AppConfig = JSON.parse(rawData);
      const activeSheetId = process.env.GOOGLE_SHEETS_ID || config.googleSheetsId;
      
      if (activeSheetId) {
        console.log(`[StartupSync] Found active Google Sheet ID: "${activeSheetId}". Performing automatic background sync...`);
        const result = await syncFromGoogleSheets(activeSheetId, dataPath, config);
        if (result.success) {
          console.log(`[StartupSync] Successful! Synchronized ${result.buttons?.length} buttons on startup.`);
        } else {
          console.error(`[StartupSync] Sync failed: ${result.error}`);
        }
      } else {
        console.log(`[StartupSync] No Google Sheets ID configured. Skipping startup sync.`);
      }
    }
  } catch (err: any) {
    console.error("[StartupSync] Error while performing automatic startup sync:", err.message);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`All Live backend server listening on http://localhost:${PORT}`);
  });
}

start();
