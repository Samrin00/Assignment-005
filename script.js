const API_BASE = "https://phi-lab-server.vercel.app/api/v1/lab";

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("username")) initLogin();
  if (document.getElementById("issues-grid")) initMain();
});


// LOGIN PAGE

function initLogin() {
  const loginBtn = document.getElementById("login-btn");
  if (loginBtn) loginBtn.addEventListener("click", login);

  // Enter key triggers login
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") login();
  });
}

function login() {
  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value.trim();
  const error = document.getElementById("error-msg");

  if (username === "admin" && password === "admin123") {
    window.location.href = "main.html";
  } else {
    if (error) error.classList.remove("hidden");
  }
}


// MAIN PAGE


let allIssues = [];
let currentTab = "all";

function initMain() {
  document.getElementById("tab-all")?.addEventListener("click", () => setTab("all"));
  document.getElementById("tab-open")?.addEventListener("click", () => setTab("open"));
  document.getElementById("tab-closed")?.addEventListener("click", () => setTab("closed"));

  document.getElementById("search-btn")?.addEventListener("click", searchIssues);
  document.getElementById("search-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchIssues();
  });

  document.getElementById("close-modal-btn")?.addEventListener("click", closeDetail);

  loadAllIssues();
}



async function loadAllIssues() {
  showSpinner();
  try {
    const res = await fetch(API_BASE + "/issues");
    const data = await res.json();
    if (data.status === "success") {
      allIssues = data.data.map(convertIssue);
      showIssues();
    } else {
      showError("Could not load issues");
    }
  } catch {
    showError("Network error");
  }
  hideSpinner();
}

async function loadSingleIssue(id) {
  showModalSpinner();
  try {
    const res = await fetch(API_BASE + "/issue/" + id);
    const data = await res.json();
    if (data.status === "success") fillModal(convertIssue(data.data));
  } catch {}
  hideModalSpinner();
}


function convertIssue(issue) {
  return {
    id: issue.id,
    title: issue.title,
    desc: issue.description,
    status: issue.status,
    priority: issue.priority?.toUpperCase() || "",
    labels: (issue.labels || []).map(convertLabel),
    author: issue.author || "Unknown",
    assignee: issue.assignee || "Unassigned",
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
    date: makeShortDate(issue.createdAt)
  };
}
function convertLabel(label) {
  const l = label.toLowerCase();
  if (l === "bug") return { label: "BUG", icon: "assets/bug.png" };
  if (l === "help wanted") return { label: "HELP WANTED", icon: "assets/l.png" };
  if (l === "enhancement") return { label: "ENHANCEMENT", icon: "assets/v.png" };
  return { label: label.toUpperCase(), icon: "" };
}

function makeShortDate(date) {
  if (!date) return "-";
  const d = new Date(date);
  return `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`;
}

function makeLongDate(date) {
  if (!date) return "-";
  const d = new Date(date);
  const datePart = d.toLocaleDateString("en-US", { year:"numeric", month:"short", day:"numeric" });
  const timePart = d.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" });
  return `${datePart} · ${timePart}`;
}


function showSpinner() {
  const s = document.getElementById("spinner");
  if (s) s.classList.remove("hidden");
}

function hideSpinner() {
  const s = document.getElementById("spinner");
  if (s) s.classList.add("hidden");
}

function showModalSpinner() {
  const sp = document.getElementById("modal-spinner");
  const content = document.getElementById("modal-content");
  if (sp) sp.classList.remove("hidden");
  if (content) content.classList.add("hidden");
}

function hideModalSpinner() {
  const sp = document.getElementById("modal-spinner");
  const content = document.getElementById("modal-content");
  if (sp) sp.classList.add("hidden");
  if (content) content.classList.remove("hidden");
}


function showError(msg) {
  const empty = document.getElementById("empty-state");
  if (!empty) return;
  empty.textContent = msg;
  empty.classList.remove("hidden");
}


function setTab(tab) {
  currentTab = tab;
  ["all","open","closed"].forEach(t => {
    const btn = document.getElementById("tab-" + t);
    if (!btn) return;
    if (t === tab) btn.classList.add("bg-indigo-600","text-white");
    else btn.classList.remove("bg-indigo-600","text-white");
  });
  showIssues();
}

function filterByTab(list) {
  if (currentTab === "all") return list;
  return list.filter(i => i.status === currentTab);
}


function showIssues() {
  const list = filterByTab(allIssues);
  renderCards(list);
  updateIssueCount(list.length);
}

function updateIssueCount(count) {
  const el = document.getElementById("issue-count");
  if (!el) return;
  el.textContent = count + (count === 1 ? " Issue" : " Issues");
}

function renderCards(issueList) {
  const grid = document.getElementById("issues-grid");
  if (!grid) return;

  if (issueList.length === 0) {
    grid.innerHTML = "";
    document.getElementById("empty-state")?.classList.remove("hidden");
    return;
  }
  document.getElementById("empty-state")?.classList.add("hidden");

  // Border color based on open/closed status
  const borderClass = status => status === "open" ? "card-open" : "card-closed";
  const priColor = p => (p==="HIGH"?"pri-high":p==="MEDIUM"?"pri-medium":p==="LOW"?"pri-low":"text-gray-400");

  const labelBadge = l => {
    const t = l.label.toUpperCase();
    let cls = "badge-default"; let icon = "";
    if (t==="BUG"){ cls="badge-bug"; icon=`<img src="assets/bug.png" class="w-3.5 h-3.5"/>`; }
    else if (t==="HELP WANTED"){ cls="badge-help-wanted"; icon=`<img src="assets/l.png" class="w-3.5 h-3.5"/>`; }
    else if (t==="ENHANCEMENT"){ cls="badge-enhancement"; icon=`<img src="assets/v.png" class="w-3.5 h-3.5"/>`; }
    return `<span class="${cls} inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold">${icon}${t}</span>`;
  };

  grid.innerHTML = issueList.map(issue => {
    const tags = issue.labels.map(labelBadge).join("");
    const statusIcon = issue.status === "open"
      ? `<img src="assets/Open-status.png" class="w-5 h-5"/>`
      : `<img src="assets/Closed-status.png" class="w-5 h-5"/>`;

    return `
      <div onclick="openDetail(${issue.id})" class="bg-white border border-gray-200 rounded-xl p-3 cursor-pointer hover:shadow-md ${borderClass(issue.status)}">
        <div class="flex justify-between mb-2">
          ${statusIcon}
          <span class="text-xs font-bold ${priColor(issue.priority)}">${issue.priority}</span>
        </div>
        <div class="font-semibold text-sm mb-1 text-gray-900">${issue.title}</div>
        <div class="text-xs text-gray-500 mb-2 line-clamp-2">${issue.desc}</div>
        <div class="flex flex-wrap gap-2">${tags}</div>
        <div class="text-xs text-gray-400 mt-2">#${issue.id} by ${issue.author}<br>${issue.date}</div>
      </div>`;
  }).join("");
}


// SEARCH


function searchIssues() {
  const q = document.getElementById("search-input")?.value.trim();
  if (!q) return showIssues();
  const filtered = allIssues.filter(i => i.title.toLowerCase().includes(q.toLowerCase()));
  renderCards(filtered);
  updateIssueCount(filtered.length);
}


function openDetail(id) {
  const overlay = document.getElementById("detail-overlay");
  if (overlay) overlay.classList.add("open");
  loadSingleIssue(id);
}

function closeDetail() {
  const overlay = document.getElementById("detail-overlay");
  if (overlay) overlay.classList.remove("open");
}

function fillModal(issue) {
  document.getElementById("m-title").textContent = issue.title;
  document.getElementById("m-desc").textContent = issue.desc;
  document.getElementById("m-assignee").textContent = issue.assignee;

  const pill = document.getElementById("m-pill");
  if (pill) {
    pill.className = issue.status==="open"
      ? "px-4 py-1.5 rounded-full text-[13px] font-semibold text-white bg-green-500"
      : "px-4 py-1.5 rounded-full text-[13px] font-semibold text-white bg-purple-500";
    pill.textContent = issue.status==="open"?"Opened":"Closed";
  }

  const dateStr = issue.createdAt ? new Date(issue.createdAt).toLocaleDateString("en-GB") : issue.date;
  document.getElementById("m-byline").innerHTML = `Opened by <strong class="text-gray-700 font-medium">${issue.author}</strong> &nbsp;•&nbsp; ${dateStr}`;

  document.getElementById("m-tags").innerHTML = issue.labels.map(l=>{
    const t = l.label.toUpperCase();
    let cls="badge-default", icon="";
    if(t==="BUG"){cls="badge-bug"; icon=`<img src="assets/bug.png" class="w-3.5 h-3.5"/>`;}
    else if(t==="HELP WANTED"){cls="badge-help-wanted"; icon=`<img src="assets/l.png" class="w-3.5 h-3.5"/>`;}
    else if(t==="ENHANCEMENT"){cls="badge-enhancement"; icon=`<img src="assets/v.png" class="w-3.5 h-3.5"/>`;}
    return `<span class="${cls} inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold">${icon}${t}</span>`;
  }).join("");

  const pri = issue.priority || "";
  let priCls="bg-gray-400 text-white";
  if(pri==="HIGH") priCls="bg-red-500 text-white";
  if(pri==="MEDIUM") priCls="bg-amber-400 text-white";
  if(pri==="LOW") priCls="bg-gray-400 text-white";
  document.getElementById("m-priority").innerHTML = `<span class="${priCls} inline-block px-4 py-1.5 rounded-full text-[12px] font-bold">${pri||"—"}</span>`;
}