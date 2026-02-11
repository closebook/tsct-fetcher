const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
app.use(cors());

const BASE =
  "https://tsctup.com/running_sahyogsuchi_list.php?search=&district=572&block=704&page=";

let allRecords = [];
let currentPage = 1;
let finished = false;
let scrapingStarted = false;

// Pretend to be Chrome browser
const browserHeaders = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept": "text/html,application/xhtml+xml",
  "Connection": "keep-alive"
};

// scrape one page safely
async function scrapePage(page) {
  try {
    const url = BASE + page;
    console.log("Scraping page", page);

    const response = await axios.get(url, { headers: browserHeaders });
    const $ = cheerio.load(response.data);

    let records = [];

    $("table tbody tr").each((i, el) => {
      const cols = $(el).find("td");

      if (cols.length > 0) {
        records.push({
          ehrms: $(cols[1]).text().trim(),
          donor: $(cols[2]).text().trim(),
          school: $(cols[3]).text().trim()
        });
      }
    });

    return records;

  } catch (err) {
    console.log("Blocked or error on page", page);
    return null; // important
  }
}

// background scraper with retry
async function startScraping() {
  if (scrapingStarted) return;
  scrapingStarted = true;

  while (!finished) {
    const records = await scrapePage(currentPage);

    // if blocked → retry same page later
    if (records === null) {
      console.log("Retrying page in 10 seconds...");
      await new Promise(r => setTimeout(r, 10000));
      continue;
    }

    // if no records → end reached
    if (records.length === 0) {
      finished = true;
      console.log("Scraping finished");
      break;
    }

    allRecords = allRecords.concat(records);
    console.log("Total records:", allRecords.length);

    currentPage++;

    // slow scraping to avoid blocking
    await new Promise(r => setTimeout(r, 3000));
  }
}

// start scraper AFTER server starts
setTimeout(startScraping, 5000);

// ROOT ROUTE
app.get("/", (req, res) => {
  res.send("TSCT API is running 🚀 Use /api/data");
});

// API ROUTE (always works)
app.get("/api/data", (req, res) => {
  res.json({
    records: allRecords,
    finished: finished,
    pagesScraped: currentPage - 1
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
