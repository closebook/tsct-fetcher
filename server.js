const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
app.use(cors());

// ================= CONFIG =================
const BASE =
  "https://tsctup.com/running_sahyogsuchi_list.php?search=&district=572&block=704&page=";

let allRecords = [];
let currentPage = 1;
let scraping = false;
let finished = false;

// Pretend to be a real Chrome browser (Cloudflare bypass)
const browserHeaders = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
  "Accept":
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Connection": "keep-alive",
};

// ================= SCRAPE ONE PAGE =================
async function scrapePage(page) {
  try {
    const url = BASE + page;
    console.log("Scraping:", url);

    const { data } = await axios.get(url, { headers: browserHeaders });

    const $ = cheerio.load(data);
    let records = [];

    $("table tbody tr").each((i, el) => {
      const cols = $(el).find("td");

      if (cols.length > 0) {
        records.push({
          ehrms: $(cols[1]).text().trim(),
          donor: $(cols[2]).text().trim(),
          school: $(cols[3]).text().trim(),
        });
      }
    });

    return records;
  } catch (err) {
    console.log("Error scraping page:", page);
    return [];
  }
}

// ================= BACKGROUND SCRAPER =================
async function startScraping() {
  if (scraping) return;
  scraping = true;

  while (!finished) {
    const records = await scrapePage(currentPage);

    if (records.length === 0) {
      finished = true;
      console.log("Scraping finished.");
      break;
    }

    allRecords = allRecords.concat(records);
    console.log("Total records:", allRecords.length);

    currentPage++;

    // IMPORTANT: slow scraping to avoid blocking
    await new Promise(r => setTimeout(r, 2500));
  }
}

// start scraper automatically when server starts
startScraping();

// ================= API =================
app.get("/api/data", (req, res) => {
  res.json({
    records: allRecords,
    finished: finished,
  });
});

// ================= SERVER =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
  console.log("Server running on port " + PORT)
);
