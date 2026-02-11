const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
app.use(cors());

const BASE =
  "https://tsctup.com/running_sahyogsuchi_list.php?search=&district=572&block=704&page=";

let allRecords = [];
let currentPage = 1;
let finished = false;
let started = false;

// scrape one page using real Chrome
async function scrapePage(page, browser) {
  const pageObj = await browser.newPage();

  const url = BASE + page;
  console.log("Opening page:", page);

  await pageObj.goto(url, { waitUntil: "networkidle2", timeout: 0 });

  const records = await pageObj.evaluate(() => {
    const rows = document.querySelectorAll("table tbody tr");
    let data = [];

    rows.forEach(row => {
      const cols = row.querySelectorAll("td");
      if (cols.length > 0) {
        data.push({
          ehrms: cols[1].innerText.trim(),
          donor: cols[2].innerText.trim(),
          school: cols[3].innerText.trim()
        });
      }
    });

    return data;
  });

  await pageObj.close();
  return records;
}

// background scraper
async function startScraping() {
  if (started) return;
  started = true;

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  while (!finished) {
    const records = await scrapePage(currentPage, browser);

    if (records.length === 0) {
      finished = true;
      break;
    }

    allRecords = allRecords.concat(records);
    console.log("Total records:", allRecords.length);

    currentPage++;
    await new Promise(r => setTimeout(r, 2000));
  }

  await browser.close();
}

// start scraper after server boot
setTimeout(startScraping, 4000);

app.get("/", (req, res) => {
  res.send("TSCT Puppeteer API running 🚀");
});

app.get("/api/data", (req, res) => {
  res.json({
    records: allRecords,
    finished: finished,
    pagesScraped: currentPage - 1
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));
