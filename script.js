let allData = [];
let uniqueData = [];
let filteredData = []; // ⭐ search result
let currentPage = 1;
const rowsPerPage = 100;

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function removeDuplicates(data) {
  const map = new Map();
  data.forEach(item => {
    if (item.ehrms && !map.has(item.ehrms)) {
      map.set(item.ehrms, item);
    }
  });
  return Array.from(map.values());
}

// ⭐ SEARCH FUNCTION
function applySearch() {
  const q = document.getElementById("searchBox").value.toLowerCase();

  filteredData = uniqueData.filter(item =>
    item.donor.toLowerCase().includes(q) ||
    item.ehrms.toLowerCase().includes(q) ||
    item.school.toLowerCase().includes(q)
  );

  currentPage = 1;
  showPage(1, true);
}

async function fetchUpdates() {
  const res = await fetch("https://tsct-fetcher.onrender.com/");
  const json = await res.json();

  const oldLength = uniqueData.length;

  allData = json.records;
  uniqueData = removeDuplicates(allData);

  // apply search after new data arrives
  applySearch();

  if (!json.finished) {
    setTimeout(fetchUpdates, 3000);
  }
}

function showPage(page, isUserAction = true) {
  currentPage = page;
  if (isUserAction) scrollToTop();

  const tbody = document.querySelector("#dataTable tbody");
  tbody.innerHTML = "";

  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = filteredData.slice(start, end);

  pageData.forEach(item => {
    tbody.innerHTML += `
      <tr>
        <td>${item.donor}</td>
        <td>${item.ehrms}</td>
        <td>${item.school}</td>
        <td>✅</td>
      </tr>
    `;
  });

  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
  const text = `Page ${currentPage} / ${totalPages} | Results: ${filteredData.length}`;

  document.getElementById("pageInfo").innerText = text;
  document.getElementById("pageInfoTop").innerText = text;
}

// navigation
function goFirst(){ showPage(1, true); }
function goLast(){
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  showPage(totalPages, true);
}
function goNext(){
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  if (currentPage < totalPages) showPage(currentPage + 1, true);
}
function goPrev(){
  if (currentPage > 1) showPage(currentPage - 1, true);
}

// buttons
document.getElementById("first").onclick = goFirst;
document.getElementById("last").onclick = goLast;
document.getElementById("next").onclick = goNext;
document.getElementById("prev").onclick = goPrev;

document.getElementById("firstTop").onclick = goFirst;
document.getElementById("lastTop").onclick = goLast;
document.getElementById("nextTop").onclick = goNext;
document.getElementById("prevTop").onclick = goPrev;

// ⭐ trigger search when typing
document.getElementById("searchBox").addEventListener("input", applySearch);

fetchUpdates();


