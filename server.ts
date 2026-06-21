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

// API route: Load system configuration
app.get("/api/config", (req, res) => {
  try {
    const dataPath = path.join(__dirname, "data-store.json");
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ error: "Data store file not found" });
    }
    const rawData = fs.readFileSync(dataPath, "utf8");
    const parsedData: AppConfig = JSON.parse(rawData);
    res.json(parsedData);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to load configuration" });
  }
});

// API route: Update configuration & settings
app.post("/api/config", (req, res) => {
  try {
    const dataPath = path.join(__dirname, "data-store.json");
    const updatedConfig: AppConfig = req.body;
    
    // Validate request briefly
    if (!updatedConfig || !Array.isArray(updatedConfig.buttons)) {
      return res.status(400).json({ error: "Invalid configuration data structure" });
    }

    fs.writeFileSync(dataPath, JSON.stringify(updatedConfig, null, 2), "utf8");
    res.json({ success: true, message: "Configuration saved successfully", config: updatedConfig });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to save configuration" });
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

// API route: Sync with Google Sheets
app.post("/api/sync-sheet", async (req, res) => {
  try {
    const { googleSheetsId } = req.body;
    if (!googleSheetsId) {
      return res.status(400).json({ error: "Google Spreadsheet ID is required" });
    }

    // Load existing config to update
    const dataPath = path.join(__dirname, "data-store.json");
    const rawData = fs.readFileSync(dataPath, "utf8");
    const config: AppConfig = JSON.parse(rawData);

    // Fetch public CSV export of spreadsheet
    const csvUrl = `https://docs.google.com/spreadsheets/d/${googleSheetsId}/gviz/tq?tqx=out:csv`;
    console.log(`Syncing from Google sheet CSV: ${csvUrl}`);
    
    const response = await fetch(csvUrl);
    if (!response.ok) {
      return res.status(400).json({ error: "Could not fetch Google Sheet. Please check Spreadsheet ID and verify the sheet is shared as: 'Anyone with the link can view'" });
    }

    const text = await response.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    
    if (lines.length < 2) {
      return res.status(400).json({ error: "Google Sheet is empty or columns are corrupted" });
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
      return res.status(400).json({ 
        error: "Required columns missing! The Google Sheet must include 'Name' and 'Link' header columns. Optional: 'Logo', 'ID', 'Network', 'Status'" 
      });
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
      return res.status(400).json({ error: "No valid rows detected. Make sure 'Name' and 'Link' have non-empty values on each row." });
    }

    // Save synced buttons to the config database
    // Extract any special ad network control row if present
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

    res.json({ 
      success: true, 
      message: `${parsedButtons.length} buttons parsed and synced successfully!`, 
      buttons: parsedButtons,
      config
    });
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
