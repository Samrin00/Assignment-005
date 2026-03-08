document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("username"))    initLogin();
  if (document.getElementById("issues-grid")) initMain();
});

function apiURL(endpoint) {
  return `https://phi-lab-server.vercel.app/api/v1/lab/${endpoint}`;
}

function initLogin() {
  document.getElementById("login-btn")?.addEventListener("click", login);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") login();
  });
}

function login() {
  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  if (username === "admin" && password === "admin123") {
    window.location.href = "main.html";
  } else {
    document.getElementById("error-msg")?.classList.remove("hidden");
  }
}

let allIssues  = [];
let currentTab = "all";

function initMain() {
  document.getElementById("tab-all")?.addEventListener("click",    () => setTab("all"));
  document.getElementById("tab-open")?.addEventListener("click",   () => setTab("open"));
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
    const response = await fetch(apiURL("issues"));
    const data     = await response.json();

    if (data.status === "success") {
      allIssues = data.data.map(convertIssue);
      showIssues();
    } else {
      showError("Could not load issues");
    }
  } catch (err) {
    showError("Network error");
  }
  hideSpinner();
}

async function loadSingleIssue(id) {
  showModalSpinner();
  try {
    const response = await fetch(apiURL("issue/" + id));
    const data     = await response.json();

    if (data.status === "success") {
      fillModal(convertIssue(data.data));
    }
  } catch (err) {}
  hideModalSpinner();
}

function convertIssue(rawIssue) {
  return {
    id:        rawIssue.id,
    title:     rawIssue.title,
    desc:      rawIssue.description,
    status:    rawIssue.status,
    priority:  rawIssue.priority?.toUpperCase() || "",
    labels:    (rawIssue.labels || []).map(convertLabel),
    author:    rawIssue.author   || "Unknown",
    assignee:  rawIssue.assignee || "Unassigned",
    createdAt: rawIssue.createdAt,
    updatedAt: rawIssue.updatedAt,
    date:      makeShortDate(rawIssue.createdAt),
  };
}

function convertLabel(label) {
  const lower = label.toLowerCase();

  if (lower === "bug")         return { label: "BUG" };
  if (lower === "help wanted") return { label: "HELP WANTED" };
  if (lower === "enhancement") return { label: "ENHANCEMENT" };

  return { label: label.toUpperCase() };
}

function makeShortDate(dateString) {
  if (!dateString) return "-";
  const d = new Date(dateString);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function showSpinner() {
  document.getElementById("spinner")?.classList.remove("hidden");
}

function hideSpinner() {
  document.getElementById("spinner")?.classList.add("hidden");
}

function showModalSpinner() {
  document.getElementById("modal-spinner")?.classList.remove("hidden");
  document.getElementById("modal-content")?.classList.add("hidden");
}

function hideModalSpinner() {
  document.getElementById("modal-spinner")?.classList.add("hidden");
  document.getElementById("modal-content")?.classList.remove("hidden");
}

function showError(message) {
  const el = document.getElementById("empty-state");
  if (!el) return;
  el.textContent = message;
  el.classList.remove("hidden");
}

function setTab(tab) {
  currentTab = tab;

  const tabs = ["all", "open", "closed"];
  tabs.forEach((t) => {
    const btn = document.getElementById("tab-" + t);
    if (!btn) return;

    if (t === tab) {
      btn.classList.add("bg-indigo-600", "text-white");
    } else {
      btn.classList.remove("bg-indigo-600", "text-white");
    }
  });

  showIssues();
}

function getFilteredIssues() {
  if (currentTab === "all") return allIssues;
  return allIssues.filter((issue) => issue.status === currentTab);
}

function showIssues() {
  const list = getFilteredIssues();
  renderCards(list);
  updateIssueCount(list.length);
}

function updateIssueCount(count) {
  const el = document.getElementById("issue-count");
  if (!el) return;
  el.textContent = count + (count === 1 ? " Issue" : " Issues");
}

function makeLabelBadge(label) {
  const text = label.label.toUpperCase();

  let cssClass = "badge-default";
  let iconHTML  = "";

  if (text === "BUG") {
    cssClass = "badge-bug";
    iconHTML  = `<img src="assets/bug-icon.png" class="w-3.5 h-3.5"/>`;
  } else if (text === "HELP WANTED") {
    cssClass = "badge-help-wanted";
    iconHTML  = `<img src="assets/help-icon.png" class="w-3.5 h-3.5"/>`;
  } else if (text === "ENHANCEMENT") {
    cssClass = "badge-enhancement";
    iconHTML  = `<img src="assets/enhancement-icon.png" class="w-3.5 h-3.5"/>`;
  }

  return `<span class="${cssClass} inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            ${iconHTML}${text}
          </span>`;
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

  function getBorderClass(priority) {
    if (priority === "HIGH")   return "card-high";
    if (priority === "MEDIUM") return "card-medium";
    if (priority === "LOW")    return "card-low";
    return "";
  }

  function getPriorityColor(priority) {
    if (priority === "HIGH")   return "pri-high";
    if (priority === "MEDIUM") return "pri-medium";
    if (priority === "LOW")    return "pri-low";
    return "text-gray-400";
  }

  grid.innerHTML = issueList.map((issue) => {
    const badgesHTML = issue.labels.map(makeLabelBadge).join("");
    const statusIcon = issue.status === "open"
      ? `<img src="assets/Open-status.png"   class="w-5 h-5"/>`
      : `<img src="assets/Closed-status.png" class="w-5 h-5"/>`;

    return `
      <div onclick="openDetail(${issue.id})"
           class="bg-white border border-gray-200 rounded-xl p-3 cursor-pointer hover:shadow-md ${getBorderClass(issue.priority)}">

        <div class="flex justify-between mb-2">
          ${statusIcon}
          <span class="text-xs font-bold ${getPriorityColor(issue.priority)}">${issue.priority}</span>
        </div>

        <div class="font-semibold text-sm mb-1 text-gray-900">${issue.title}</div>
        <div class="text-xs text-gray-500 mb-2 line-clamp-2">${issue.desc}</div>
        <div class="flex flex-wrap gap-2">${badgesHTML}</div>
        <div class="text-xs text-gray-400 mt-2">#${issue.id} by ${issue.author}<br>${issue.date}</div>

      </div>`;
  }).join("");
}

function searchIssues() {
  const query = document.getElementById("search-input")?.value.trim().toLowerCase();

  if (!query) {
    showIssues();
    return;
  }

  const results = allIssues.filter((issue) =>
    issue.title.toLowerCase().includes(query)
  );

  renderCards(results);
  updateIssueCount(results.length);
}

function openDetail(id) {
  document.getElementById("detail-overlay")?.classList.add("open");
  loadSingleIssue(id);
}

function closeDetail() {
  document.getElementById("detail-overlay")?.classList.remove("open");
}

function fillModal(issue) {
  document.getElementById("m-title").textContent    = issue.title;
  document.getElementById("m-desc").textContent     = issue.desc;
  document.getElementById("m-assignee").textContent = issue.assignee;

  const pill   = document.getElementById("m-pill");
  const isOpen = issue.status === "open";
  if (pill) {
    pill.className   = `px-4 py-1.5 rounded-full text-[13px] font-semibold text-white ${isOpen ? "bg-green-500" : "bg-purple-500"}`;
    pill.textContent = isOpen ? "Opened" : "Closed";
  }

  const dateText = issue.createdAt
    ? new Date(issue.createdAt).toLocaleDateString("en-GB")
    : issue.date;
  document.getElementById("m-byline").innerHTML =
    `Opened by <strong class="text-gray-700 font-medium">${issue.author}</strong> &nbsp;•&nbsp; ${dateText}`;

  document.getElementById("m-tags").innerHTML = issue.labels.map((label) => {
    const text = label.label.toUpperCase();
    let cssClass = "badge-default";
    let iconHTML  = "";

    if (text === "BUG") {
      cssClass = "badge-bug";
      iconHTML  = `<img src="assets/bug-icon.png" class="w-3.5 h-3.5"/>`;
    } else if (text === "HELP WANTED") {
      cssClass = "badge-help-wanted";
      iconHTML  = `<img src="assets/help-icon.png" class="w-3.5 h-3.5"/>`;
    } else if (text === "ENHANCEMENT") {
      cssClass = "badge-enhancement";
      iconHTML  = `<img src="assets/enhancement-icon.png" class="w-3.5 h-3.5"/>`;
    }

    return `<span class="${cssClass} inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold">
              ${iconHTML}${text}
            </span>`;
  }).join("");

  let priorityBg = "bg-gray-400";
  if (issue.priority === "HIGH")   priorityBg = "bg-red-500";
  if (issue.priority === "MEDIUM") priorityBg = "bg-amber-400";

  document.getElementById("m-priority").innerHTML =
    `<span class="${priorityBg} text-white inline-block px-4 py-1.5 rounded-full text-[12px] font-bold">
       ${issue.priority || "—"}
     </span>`;
}