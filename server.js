const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.static("public"));

const BASE =
  "https://tsctup.com/sahyogsuchi_list.php?search=&district=572&block=704&page=";

let allRecords = [];
let currentPage = 1;
let scraping = false;
let finished = false;

// scrape single page
async function scrapePage(page) {
  const url = BASE + page;
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

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
}

// BACKGROUND SCRAPER (runs forever)
async function startScraping() {
  if (scraping) return;
  scraping = true;

  while (!finished) {
    console.log("Scraping page", currentPage);
    const records = await scrapePage(currentPage);

    if (records.length === 0) {
      finished = true;
      console.log("Scraping finished");
      break;
    }

    allRecords = allRecords.concat(records);
    currentPage++;

    // wait 1 second between pages (important!)
    await new Promise(r => setTimeout(r, 1000));
  }
}

// start scraper automatically
startScraping();


// API → returns current available data instantly
app.get("/api/data", (req, res) => {
  res.json({
    records: allRecords,
    finished: finished
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
  console.log("Server running on port " + PORT)
);
