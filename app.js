// Global Application State
let state = {
  contacts: [],
  deals: [],
  tasks: [],
  interactions: []
};

// Sorting configuration for contacts table
let currentSortField = "dateCreated";
let currentSortDirection = "desc";

// Global chart references to prevent rendering overlap
let revenueChartInstance = null;
let pipelineChartInstance = null;

// Temporary tags array for contact modal
let currentModalTags = [];

// Initialize the Application
document.addEventListener("DOMContentLoaded", () => {
  initData();
  initTheme();
  setupEventListeners();
  
  // Auth check
  const isLoggedIn = sessionStorage.getItem("nexus_logged_in") === "true";
  const container = document.getElementById("app-container");
  if (isLoggedIn) {
    container.classList.add("logged-in");
    navigateToView("dashboard");
  } else {
    container.classList.remove("logged-in");
  }
  
  // Initialize Lucide Icons
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
});

// 1. Data Initialization & Persistence
function initData() {
  const storedContacts = localStorage.getItem("nexus_contacts");
  const storedDeals = localStorage.getItem("nexus_deals");
  const storedTasks = localStorage.getItem("nexus_tasks");
  const storedInteractions = localStorage.getItem("nexus_interactions");

  if (storedContacts && storedDeals && storedTasks && storedInteractions) {
    state.contacts = JSON.parse(storedContacts);
    state.deals = JSON.parse(storedDeals);
    state.tasks = JSON.parse(storedTasks);
    state.interactions = JSON.parse(storedInteractions);
  } else {
    // Seed data from mockData.js (window.CRM_SEED_DATA)
    const seed = window.CRM_SEED_DATA || { contacts: [], deals: [], tasks: [], interactions: [] };
    state.contacts = [...seed.contacts];
    state.deals = [...seed.deals];
    state.tasks = [...seed.tasks];
    state.interactions = [...seed.interactions];
    saveStateToStorage();
  }
}

function saveStateToStorage() {
  localStorage.setItem("nexus_contacts", JSON.stringify(state.contacts));
  localStorage.setItem("nexus_deals", JSON.stringify(state.deals));
  localStorage.setItem("nexus_tasks", JSON.stringify(state.tasks));
  localStorage.setItem("nexus_interactions", JSON.stringify(state.interactions));
}

// 2. Theme Management (Dark / Light Mode)
function initTheme() {
  const themeToggle = document.getElementById("theme-toggle");
  const savedTheme = localStorage.getItem("nexus_theme") || "dark";
  
  document.documentElement.setAttribute("data-theme", savedTheme);
  
  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("nexus_theme", newTheme);
    
    // Re-render charts with correct theme colors
    renderDashboardCharts();
    showToast(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode`, "info");
  });
}

// 3. Navigation / Tab Router
function setupEventListeners() {
  // Sidebar Links
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetView = link.getAttribute("data-view");
      navigateToView(targetView);
    });
  });

  // Global Search
  const searchInput = document.getElementById("global-search");
  searchInput.addEventListener("input", (e) => {
    handleGlobalSearch(e.target.value);
  });

  // Contextual Header Button Action
  const headerActionBtn = document.getElementById("btn-header-action");
  headerActionBtn.addEventListener("click", () => {
    const activeView = getActiveView();
    if (activeView === "dashboard" || activeView === "contacts") {
      openContactModal();
    } else if (activeView === "deals") {
      openDealModal();
    } else if (activeView === "tasks") {
      document.getElementById("task-title-input").focus();
      showToast("Add a new task using the side panel", "info");
    } else if (activeView === "history") {
      document.getElementById("inter-contact-select").focus();
      showToast("Select a contact to log an activity", "info");
    }
  });

  // Contacts View Add & Export Buttons
  const addContactBtn = document.getElementById("btn-add-contact");
  const exportCsvBtn = document.getElementById("btn-export-csv");
  const importInput = document.getElementById("import-csv-input");
  const importBtn = document.getElementById("btn-import-csv");
  
  if (addContactBtn) addContactBtn.addEventListener("click", () => openContactModal());
  if (exportCsvBtn) exportCsvBtn.addEventListener("click", exportContactsToCSV);
  if (importBtn && importInput) {
    importBtn.addEventListener("click", () => importInput.click());
    importInput.addEventListener("change", handleCSVImport);
  }

  // Deals View Create Deal Button
  document.getElementById("btn-add-deal").addEventListener("click", () => {
    openDealModal();
  });

  // Dashboard Nav Shortcuts
  document.getElementById("dashboard-view-history-btn").addEventListener("click", () => {
    navigateToView("history");
  });
  document.getElementById("dashboard-view-tasks-btn").addEventListener("click", () => {
    navigateToView("tasks");
  });

  // Form Submissions
  document.getElementById("contact-form").addEventListener("submit", handleContactSubmit);
  document.getElementById("deal-form").addEventListener("submit", handleDealSubmit);
  document.getElementById("task-add-form").addEventListener("submit", handleTaskSubmit);
  document.getElementById("log-interaction-form").addEventListener("submit", handleInteractionSubmit);

  // Filters for contacts
  document.getElementById("contact-status-filter").addEventListener("change", renderContactsList);
  document.getElementById("contact-tag-filter").addEventListener("change", renderContactsList);
  
  // Filter for tasks
  document.getElementById("task-filter-status").addEventListener("change", renderTasksList);

  // Tags input field handler (Contact Modal)
  const tagsInput = document.getElementById("contact-tags-input");
  tagsInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagsInput.value.trim().replace(",", "");
      if (val && !currentModalTags.includes(val)) {
        currentModalTags.push(val);
        renderModalTags();
        tagsInput.value = "";
      }
    }
  });

  // Kanban Column drag-over behaviors
  const kanbanContainers = document.querySelectorAll(".kanban-cards-container");
  kanbanContainers.forEach(container => {
    container.addEventListener("dragover", (e) => {
      e.preventDefault();
      container.classList.add("drag-over");
    });

    container.addEventListener("dragleave", () => {
      container.classList.remove("drag-over");
    });

    container.addEventListener("drop", (e) => {
      e.preventDefault();
      container.classList.remove("drag-over");
      const dealId = e.dataTransfer.getData("text/plain");
      const targetStage = container.id.replace("container-", "");
      moveDealStage(dealId, targetStage);
    });
  });

  // Login & Logout Event Listeners
  const loginForm = document.getElementById("login-form");
  const logoutBtn = document.getElementById("btn-logout");
  
  if (loginForm) loginForm.addEventListener("submit", handleLoginSubmit);
  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
}

function getActiveView() {
  const activeLink = document.querySelector(".nav-link.active");
  return activeLink ? activeLink.getAttribute("data-view") : "dashboard";
}

function navigateToView(viewName) {
  // Update nav-link active styles
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach(link => {
    if (link.getAttribute("data-view") === viewName) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Switch display panels
  const views = document.querySelectorAll(".view-section");
  views.forEach(view => {
    if (view.id === `${viewName}-view`) {
      view.classList.add("active");
    } else {
      view.classList.remove("active");
    }
  });

  // Set Header Title & Customize Context Action Button
  const viewTitle = document.getElementById("view-title");
  const headerActionBtnText = document.getElementById("btn-header-action-text");
  const headerActionBtn = document.getElementById("btn-header-action");
  
  viewTitle.textContent = viewName.charAt(0).toUpperCase() + viewName.slice(1) + (viewName === "deals" ? " Board" : "");
  
  if (viewName === "dashboard" || viewName === "contacts") {
    headerActionBtn.style.display = "inline-flex";
    headerActionBtnText.textContent = "New Lead";
  } else if (viewName === "deals") {
    headerActionBtn.style.display = "inline-flex";
    headerActionBtnText.textContent = "Create Deal";
  } else {
    // Hide contextual button for other tabs as they have their own inline actions
    headerActionBtn.style.display = "none";
  }

  // Refresh target view visual components
  refreshViewData(viewName);

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

// Refresh view components depending on selection
function refreshViewData(viewName) {
  if (viewName === "dashboard") {
    renderDashboardMetrics();
    renderDashboardCharts();
    renderDashboardActivities();
    renderDashboardTasks();
  } else if (viewName === "contacts") {
    populateTagFilterDropdown();
    renderContactsList();
  } else if (viewName === "deals") {
    renderKanbanBoard();
  } else if (viewName === "tasks") {
    populateAssociationsDropdowns();
    renderTasksList();
  } else if (viewName === "history") {
    populateInteractionsContactDropdown();
    renderInteractionsTimeline();
  }
}

// 4. Global Search Logic
function handleGlobalSearch(query) {
  const q = query.toLowerCase().trim();
  const activeView = getActiveView();

  if (activeView === "contacts") {
    // Filter contacts table directly
    const rows = document.querySelectorAll("#contacts-table-body tr");
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(q) ? "" : "none";
    });
  } else if (activeView === "deals") {
    // Filter Kanban cards
    const cards = document.querySelectorAll(".kanban-card");
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(q) ? "" : "none";
    });
  } else if (activeView === "tasks") {
    // Filter tasks
    const items = document.querySelectorAll(".task-item");
    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(q) ? "" : "none";
    });
  } else if (activeView === "history") {
    // Filter interactions timeline
    const items = document.querySelectorAll("#full-history-timeline .timeline-item");
    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(q) ? "" : "none";
    });
  }
}

// 5. Dashboard Views Renderer
function renderDashboardMetrics() {
  // Total Contacts
  document.getElementById("metric-total-contacts").textContent = state.contacts.length;

  // Active Deals (stage: qualification, proposal, negotiation)
  const activeDealsCount = state.deals.filter(d => d.stage !== "won" && d.stage !== "lost").length;
  document.getElementById("metric-active-deals").textContent = activeDealsCount;

  // Won Revenue
  const wonRevenueSum = state.deals
    .filter(d => d.stage === "won")
    .reduce((sum, d) => sum + Number(d.value || 0), 0);
  document.getElementById("metric-won-revenue").textContent = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(wonRevenueSum);

  // Tasks Completed Rate
  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter(t => t.status === "completed").length;
  const rate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  document.getElementById("metric-tasks-rate").textContent = `${rate}%`;

  // Update Sales Target Card progress
  updateSalesGoalProgress();
}

function renderDashboardCharts() {
  // Chart Colors based on current theme styling
  const isDark = document.documentElement.getAttribute("data-theme") !== "light";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)";
  const textColor = isDark ? "#94a3b8" : "#64748b";

  // 1. Pipeline Stage Distribution Chart
  const pipelineCanvas = document.getElementById("pipelineChart");
  if (pipelineCanvas) {
    if (pipelineChartInstance) pipelineChartInstance.destroy();
    
    // Group deals by stage
    const stages = { qualification: 0, proposal: 0, negotiation: 0, won: 0, lost: 0 };
    state.deals.forEach(d => {
      if (stages[d.stage] !== undefined) {
        stages[d.stage]++;
      }
    });

    pipelineChartInstance = new Chart(pipelineCanvas, {
      type: "doughnut",
      data: {
        labels: ["Qualification", "Proposal", "Negotiation", "Won", "Lost"],
        datasets: [{
          data: [stages.qualification, stages.proposal, stages.negotiation, stages.won, stages.lost],
          backgroundColor: [
            "#6366f1", // indigo
            "#8b5cf6", // violet
            "#f59e0b", // amber
            "#10b981", // emerald
            "#ef4444"  // rose
          ],
          borderWidth: isDark ? 2 : 1,
          borderColor: isDark ? "#0f1322" : "#ffffff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: textColor,
              font: { family: "Inter", size: 11 }
            }
          }
        },
        cutout: "70%"
      }
    });
  }

  // 2. Revenue Trend Line Chart (Last 6 months won deals cumulative)
  const revenueCanvas = document.getElementById("revenueChart");
  if (revenueCanvas) {
    if (revenueChartInstance) revenueChartInstance.destroy();

    // Map month names
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Get last 6 months list
    const chartLabels = [];
    const monthlyWon = {};
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const tempDate = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const label = `${months[tempDate.getMonth()]} ${tempDate.getFullYear()}`;
      chartLabels.push(label);
      monthlyWon[label] = 0;
    }

    // Filter deals that are won and compile by their close month
    state.deals.filter(deal => deal.stage === "won" && deal.closeDate).forEach(deal => {
      const cDate = new Date(deal.closeDate);
      const label = `${months[cDate.getMonth()]} ${cDate.getFullYear()}`;
      if (monthlyWon[label] !== undefined) {
        monthlyWon[label] += Number(deal.value || 0);
      }
    });

    // Make cumulative
    let runningSum = 0;
    const chartData = chartLabels.map(label => {
      runningSum += monthlyWon[label];
      return runningSum;
    });

    const ctx = revenueCanvas.getContext("2d");
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, "rgba(99, 102, 241, 0.4)");
    gradient.addColorStop(1, "rgba(99, 102, 241, 0.0)");

    revenueChartInstance = new Chart(revenueCanvas, {
      type: "line",
      data: {
        labels: chartLabels,
        datasets: [{
          label: "Cumulative Sales",
          data: chartData,
          fill: true,
          backgroundColor: gradient,
          borderColor: "#6366f1",
          borderWidth: 3,
          tension: 0.4,
          pointBackgroundColor: "#8b5cf6",
          pointBorderColor: "#ffffff",
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { family: "Inter", size: 11 } }
          },
          y: {
            grid: { color: gridColor },
            ticks: { 
              color: textColor,
              font: { family: "Inter", size: 11 },
              callback: (value) => "$" + new Intl.NumberFormat().format(value)
            }
          }
        }
      }
    });
  }
}

function renderDashboardActivities() {
  const container = document.getElementById("dashboard-activity-feed");
  if (!container) return;
  container.innerHTML = "";

  // Sort interactions by date descending and take top 5
  const sorted = [...state.interactions]
    .sort((a, b) => new Date(b.dateLogged) - new Date(a.dateLogged))
    .slice(0, 5);

  if (sorted.length === 0) {
    container.innerHTML = `<p class="text-muted" style="text-align:center; padding: 24px 0;">No activities logged yet.</p>`;
    return;
  }

  sorted.forEach(item => {
    const timeFormatted = formatDateRelative(item.dateLogged);
    let typeIcon = "message-square";
    if (item.type === "call") typeIcon = "phone";
    if (item.type === "email") typeIcon = "mail";
    if (item.type === "meeting") typeIcon = "calendar";
    if (item.type === "sms") typeIcon = "message-square-text";
    if (item.type === "linkedin") typeIcon = "linkedin";
    if (item.type === "whatsapp") typeIcon = "message-circle";
    if (item.type === "demo") typeIcon = "presentation";
    if (item.type === "note") typeIcon = "sticky-note";

    const itemHtml = `
      <div class="timeline-item">
        <div class="timeline-badge ${item.type}">
          <i data-lucide="${typeIcon}" style="width: 16px; height: 16px;"></i>
        </div>
        <div class="timeline-content">
          <div class="timeline-meta">
            <span class="timeline-title">${item.contactName}</span>
            <span class="timeline-time">${timeFormatted}</span>
          </div>
          <p class="timeline-desc"><strong>${item.type.toUpperCase()}:</strong> ${item.details}</p>
        </div>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", itemHtml);
  });

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

function renderDashboardTasks() {
  const container = document.getElementById("dashboard-tasks-feed");
  if (!container) return;
  container.innerHTML = "";

  // Show pending tasks with High/Medium priority sorted by date
  const filterTasks = state.tasks
    .filter(t => t.status === "pending")
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  if (filterTasks.length === 0) {
    container.innerHTML = `<p class="text-muted" style="text-align:center; padding: 24px 0;">All caught up! No pending tasks.</p>`;
    return;
  }

  filterTasks.forEach(task => {
    const dateStr = new Date(task.dueDate).toLocaleDateString("en-US", { month: 'short', day: 'numeric' });
    const isOverdue = new Date(task.dueDate) < new Date().setHours(0,0,0,0);
    const dateColor = isOverdue ? "color: var(--danger); font-weight:600;" : "";

    const html = `
      <div class="task-item">
        <div class="task-left">
          <input type="checkbox" class="task-checkbox" data-id="${task.id}" onchange="toggleTaskStatus('${task.id}')">
          <div class="task-details">
            <span class="task-title">${task.title}</span>
            <div class="task-meta">
              <span style="${dateColor}"><i data-lucide="calendar" style="width: 12px; height:12px;"></i> ${dateStr} ${isOverdue ? '(Overdue)' : ''}</span>
              <span><i data-lucide="link" style="width: 12px; height:12px;"></i> ${task.associatedName || 'Global'}</span>
            </div>
          </div>
        </div>
        <span class="badge badge-priority-${task.priority}">${task.priority}</span>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", html);
  });

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

// 6. Contacts Management View Logic
function populateTagFilterDropdown() {
  const tagFilter = document.getElementById("contact-tag-filter");
  if (!tagFilter) return;

  const currentVal = tagFilter.value;
  tagFilter.innerHTML = `<option value="all">All Tags</option>`;

  // Collect unique tags
  const tagsSet = new Set();
  state.contacts.forEach(c => {
    if (c.tags && Array.isArray(c.tags)) {
      c.tags.forEach(t => tagsSet.add(t));
    }
  });

  tagsSet.forEach(tag => {
    const opt = document.createElement("option");
    opt.value = tag;
    opt.textContent = tag;
    tagFilter.appendChild(opt);
  });

  // Keep selection
  tagFilter.value = currentVal;
}

function renderContactsList() {
  const tbody = document.getElementById("contacts-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  const statusFilter = document.getElementById("contact-status-filter").value;
  const tagFilter = document.getElementById("contact-tag-filter").value;

  // Filter contacts
  const filtered = state.contacts.filter(c => {
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchTag = tagFilter === "all" || (c.tags && c.tags.includes(tagFilter));
    return matchStatus && matchTag;
  });

  // Apply Sort
  filtered.sort((a, b) => {
    let valA = a[currentSortField] || "";
    let valB = b[currentSortField] || "";
    
    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();
    
    if (valA < valB) return currentSortDirection === "asc" ? -1 : 1;
    if (valA > valB) return currentSortDirection === "asc" ? 1 : -1;
    return 0;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 32px; color: var(--text-muted);">No contacts found matching the filters.</td></tr>`;
    return;
  }

  filtered.forEach(c => {
    const formattedVal = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(c.value || 0);

    const tagsHtml = (c.tags || []).map(t => `<span class="tag-pill">${t}</span>`).join("");
    const dateFormatted = new Date(c.dateCreated).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });

    const tr = `
      <tr id="row-${c.id}">
        <td>
          <div style="font-weight:600; font-size:15px; display:flex; align-items:center; gap:8px;">
            <div class="user-avatar" style="width:28px; height:28px; font-size:11px;">
              ${c.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
            </div>
            ${c.name}
          </div>
        </td>
        <td><span style="font-weight:500;">${c.company || "-"}</span></td>
        <td>
          <div style="font-size:13px; color:var(--text-main);">${c.email}</div>
          <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${c.phone || "-"}</div>
        </td>
        <td><span class="badge badge-${c.status.toLowerCase()}">${c.status}</span></td>
        <td><span style="font-weight:600; color:var(--text-main);">${formattedVal}</span></td>
        <td>${tagsHtml}</td>
        <td><span style="color:var(--text-muted); font-size:13px;">${dateFormatted}</span></td>
        <td>
          <div class="actions-cell">
            <button class="btn-icon" onclick="openInteractionFormFor('${c.id}')" title="Log Interaction">
              <i data-lucide="message-square" style="width:14px; height:14px;"></i>
            </button>
            <button class="btn-icon" onclick="openContactModal('${c.id}')" title="Edit Contact">
              <i data-lucide="edit-3" style="width:14px; height:14px;"></i>
            </button>
            <button class="btn-icon" style="color:var(--danger);" onclick="deleteContact('${c.id}')" title="Delete Contact">
              <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
    tbody.insertAdjacentHTML("beforeend", tr);
  });

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

function deleteContact(id) {
  if (confirm("Are you sure you want to delete this contact? This will delete associated deals and tasks.")) {
    state.contacts = state.contacts.filter(c => c.id !== id);
    state.deals = state.deals.filter(d => d.contactId !== id);
    state.tasks = state.tasks.filter(t => (t.associatedType === 'contact' && t.associatedId !== id) || t.associatedType !== 'contact');
    state.interactions = state.interactions.filter(i => i.contactId !== id);
    
    saveStateToStorage();
    populateTagFilterDropdown();
    renderContactsList();
    showToast("Contact deleted successfully", "warning");
  }
}

// 7. Deal Modals & Kanban Board Pipeline
function renderKanbanBoard() {
  const stages = ["qualification", "proposal", "negotiation", "won", "lost"];
  
  stages.forEach(stage => {
    const container = document.getElementById(`container-${stage}`);
    const badgeCount = document.getElementById(`badge-count-${stage}`);
    const sumValue = document.getElementById(`sum-value-${stage}`);
    
    if (!container) return;
    container.innerHTML = "";

    const stageDeals = state.deals.filter(d => d.stage === stage);
    badgeCount.textContent = stageDeals.length;

    const totalVal = stageDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);
    sumValue.textContent = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(totalVal);

    if (stageDeals.length === 0) {
      container.innerHTML = `<div class="text-muted" style="text-align:center; padding: 24px 0; font-size: 12px; border:1px dashed var(--border-color); border-radius:8px;">Drop here</div>`;
      return;
    }

    stageDeals.forEach(deal => {
      const valFormatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
      }).format(deal.value);

      const html = `
        <div class="kanban-card" draggable="true" id="deal-card-${deal.id}" ondragstart="handleDealDragStart(event, '${deal.id}')">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
            <div class="kanban-card-title">${deal.title}</div>
            <button class="btn-icon" style="padding: 2px; border-radius: 4px; background: transparent; border:none;" onclick="openDealModal('${deal.id}')" title="Edit Deal">
              <i data-lucide="edit-2" style="width:12px; height:12px; color:var(--text-muted);"></i>
            </button>
          </div>
          <div class="kanban-card-client">
            <i data-lucide="user" style="width:12px; height:12px;"></i>
            <span>${deal.contactName}</span>
          </div>
          <div class="kanban-card-footer">
            <span class="kanban-card-value">${valFormatted}</span>
            <span class="badge badge-priority-${deal.priority}">${deal.priority}</span>
          </div>
        </div>
      `;
      container.insertAdjacentHTML("beforeend", html);
    });
  });

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

// HTML5 Drag and Drop events
function handleDealDragStart(e, id) {
  e.dataTransfer.setData("text/plain", id);
  e.dataTransfer.effectAllowed = "move";
}

function moveDealStage(dealId, targetStage) {
  const dealIndex = state.deals.findIndex(d => d.id === dealId);
  if (dealIndex !== -1) {
    const oldStage = state.deals[dealIndex].stage;
    state.deals[dealIndex].stage = targetStage;
    
    // Auto-update associated contact values for won deals
    if (targetStage === "won") {
      const contact = state.contacts.find(c => c.id === state.deals[dealIndex].contactId);
      if (contact) {
        contact.value = Number(contact.value || 0) + Number(state.deals[dealIndex].value);
        contact.status = "Customer";
      }
    }
    
    saveStateToStorage();
    renderKanbanBoard();
    
    // Log activity feed auto-interaction
    const interaction = {
      id: "i_" + Date.now(),
      contactId: state.deals[dealIndex].contactId,
      contactName: state.deals[dealIndex].contactName,
      type: "note",
      details: `Deal "${state.deals[dealIndex].title}" moved from ${oldStage.toUpperCase()} to ${targetStage.toUpperCase()}.`,
      dateLogged: new Date().toISOString()
    };
    state.interactions.push(interaction);
    saveStateToStorage();

    showToast(`Deal moved to ${targetStage.toUpperCase()}`, "success");
  }
}

// 8. Contact Add/Edit Modals Handlers
function openContactModal(editId = "") {
  const modal = document.getElementById("contact-modal");
  const modalTitle = document.getElementById("contact-modal-title");
  const form = document.getElementById("contact-form");
  
  form.reset();
  currentModalTags = [];
  document.getElementById("contact-edit-id").value = editId;

  if (editId) {
    modalTitle.textContent = "Edit Contact";
    const contact = state.contacts.find(c => c.id === editId);
    if (contact) {
      document.getElementById("contact-name").value = contact.name;
      document.getElementById("contact-company").value = contact.company || "";
      document.getElementById("contact-email").value = contact.email || "";
      document.getElementById("contact-phone").value = contact.phone || "";
      document.getElementById("contact-status").value = contact.status;
      document.getElementById("contact-value").value = contact.value || 0;
      currentModalTags = [...(contact.tags || [])];
    }
  } else {
    modalTitle.textContent = "Add New Contact";
  }

  renderModalTags();
  modal.classList.add("open");
}

function renderModalTags() {
  const container = document.getElementById("contact-tags-container");
  const input = document.getElementById("contact-tags-input");
  
  // Remove existing badges
  const existingBadges = container.querySelectorAll(".tag-badge");
  existingBadges.forEach(b => b.remove());

  // Insert current modal tags before input element
  currentModalTags.forEach(tag => {
    const badge = document.createElement("span");
    badge.className = "tag-badge";
    badge.innerHTML = `${tag} <span onclick="removeModalTag('${tag}')">&times;</span>`;
    container.insertBefore(badge, input);
  });
}

function removeModalTag(tag) {
  currentModalTags = currentModalTags.filter(t => t !== tag);
  renderModalTags();
}

function handleContactSubmit(e) {
  e.preventDefault();
  
  const editId = document.getElementById("contact-edit-id").value;
  const name = document.getElementById("contact-name").value.trim();
  const company = document.getElementById("contact-company").value.trim();
  const email = document.getElementById("contact-email").value.trim();
  const phone = document.getElementById("contact-phone").value.trim();
  const status = document.getElementById("contact-status").value;
  const value = Number(document.getElementById("contact-value").value || 0);

  if (editId) {
    // Update contact
    const idx = state.contacts.findIndex(c => c.id === editId);
    if (idx !== -1) {
      state.contacts[idx] = {
        ...state.contacts[idx],
        name,
        company,
        email,
        phone,
        status,
        value,
        tags: [...currentModalTags]
      };
      
      // Update deals contactName helper
      state.deals.forEach(d => {
        if (d.contactId === editId) {
          d.contactName = name;
        }
      });
      showToast("Contact updated successfully", "success");
    }
  } else {
    // Add contact
    const newContact = {
      id: "c_" + Date.now(),
      name,
      company,
      email,
      phone,
      status,
      value,
      tags: [...currentModalTags],
      dateCreated: new Date().toISOString().split("T")[0]
    };
    state.contacts.push(newContact);
    showToast("New Contact added", "success");
  }

  saveStateToStorage();
  closeModal("contact-modal");
  
  // Refresh current views
  const activeView = getActiveView();
  refreshViewData(activeView);
}

// 9. Deal Add/Edit Modals Handlers
function openDealModal(editId = "") {
  const modal = document.getElementById("deal-modal");
  const modalTitle = document.getElementById("deal-modal-title");
  const form = document.getElementById("deal-form");
  const contactSelect = document.getElementById("deal-contact");
  
  form.reset();
  document.getElementById("deal-edit-id").value = editId;

  // Populate associated contacts list
  contactSelect.innerHTML = `<option value="" disabled selected>Select Associated Contact</option>`;
  state.contacts.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = `${c.name} (${c.company || 'No Company'})`;
    contactSelect.appendChild(opt);
  });

  if (editId) {
    modalTitle.textContent = "Edit Deal Details";
    const deal = state.deals.find(d => d.id === editId);
    if (deal) {
      document.getElementById("deal-title").value = deal.title;
      contactSelect.value = deal.contactId;
      document.getElementById("deal-value").value = deal.value;
      document.getElementById("deal-stage").value = deal.stage;
      document.getElementById("deal-close-date").value = deal.closeDate;
      document.getElementById("deal-priority").value = deal.priority;
    }
  } else {
    modalTitle.textContent = "Create New Deal";
    // Set default close date to 30 days from now
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    document.getElementById("deal-close-date").value = nextMonth.toISOString().split("T")[0];
  }

  modal.classList.add("open");
}

function handleDealSubmit(e) {
  e.preventDefault();
  
  const editId = document.getElementById("deal-edit-id").value;
  const title = document.getElementById("deal-title").value.trim();
  const contactId = document.getElementById("deal-contact").value;
  const value = Number(document.getElementById("deal-value").value || 0);
  const stage = document.getElementById("deal-stage").value;
  const closeDate = document.getElementById("deal-close-date").value;
  const priority = document.getElementById("deal-priority").value;

  const contact = state.contacts.find(c => c.id === contactId);
  const contactName = contact ? contact.name : "Unknown Contact";

  if (editId) {
    const idx = state.deals.findIndex(d => d.id === editId);
    if (idx !== -1) {
      state.deals[idx] = {
        ...state.deals[idx],
        title,
        contactId,
        contactName,
        value,
        stage,
        closeDate,
        priority
      };
      showToast("Deal details updated", "success");
    }
  } else {
    const newDeal = {
      id: "d_" + Date.now(),
      title,
      contactId,
      contactName,
      value,
      stage,
      closeDate,
      priority,
      dateCreated: new Date().toISOString().split("T")[0]
    };
    state.deals.push(newDeal);
    showToast("Deal created successfully", "success");
  }

  saveStateToStorage();
  closeModal("deal-modal");
  
  const activeView = getActiveView();
  refreshViewData(activeView);
}

function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

// 10. Tasks Check List & Manager View
function populateAssociationsDropdowns() {
  const select = document.getElementById("task-assoc-select");
  const contactsGroup = document.getElementById("task-assoc-contacts-group");
  const dealsGroup = document.getElementById("task-assoc-deals-group");

  contactsGroup.innerHTML = "";
  dealsGroup.innerHTML = "";

  state.contacts.forEach(c => {
    const opt = document.createElement("option");
    opt.value = `contact:${c.id}:${c.name}`;
    opt.textContent = c.name;
    contactsGroup.appendChild(opt);
  });

  state.deals.forEach(d => {
    const opt = document.createElement("option");
    opt.value = `deal:${d.id}:${d.title}`;
    opt.textContent = d.title;
    dealsGroup.appendChild(opt);
  });
}

function renderTasksList() {
  const container = document.getElementById("tasks-list-container");
  if (!container) return;
  container.innerHTML = "";

  const filterStatus = document.getElementById("task-filter-status").value;

  // Filter list
  const filtered = state.tasks.filter(t => {
    if (filterStatus === "all") return true;
    return t.status === filterStatus;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-muted" style="text-align:center; padding:48px 0;">No tasks found.</p>`;
    return;
  }

  // Sort by due date (pending first, completed at the bottom)
  filtered.sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "completed" ? 1 : -1;
    }
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  filtered.forEach(task => {
    const isCompleted = task.status === "completed";
    const dateFormatted = new Date(task.dueDate).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
    const isOverdue = !isCompleted && new Date(task.dueDate) < new Date().setHours(0,0,0,0);
    const dateColor = isOverdue ? "color: var(--danger); font-weight:600;" : "";

    const html = `
      <div class="task-item ${isCompleted ? 'completed' : ''}">
        <div class="task-left">
          <input type="checkbox" class="task-checkbox" ${isCompleted ? 'checked' : ''} onchange="toggleTaskStatus('${task.id}')">
          <div class="task-details">
            <span class="task-title">${task.title}</span>
            <div class="task-meta">
              <span style="${dateColor}">
                <i data-lucide="calendar" style="width:12px; height:12px;"></i> ${dateFormatted} ${isOverdue ? '(Overdue)' : ''}
              </span>
              <span>
                <i data-lucide="link" style="width:12px; height:12px;"></i> ${task.associatedName || 'Global'} (${task.associatedType || 'Task'})
              </span>
            </div>
          </div>
        </div>
        <div class="task-right">
          <span class="badge badge-priority-${task.priority}">${task.priority}</span>
          <button class="btn-icon" style="color:var(--danger);" onclick="deleteTask('${task.id}')" title="Delete Task">
            <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
          </button>
        </div>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", html);
  });

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

function toggleTaskStatus(id) {
  const idx = state.tasks.findIndex(t => t.id === id);
  if (idx !== -1) {
    const isNowCompleted = state.tasks[idx].status === "pending";
    state.tasks[idx].status = isNowCompleted ? "completed" : "pending";
    saveStateToStorage();
    
    // Refresh current views
    const activeView = getActiveView();
    refreshViewData(activeView);
    
    showToast(isNowCompleted ? "Task completed" : "Task marked as pending", "info");
  }
}

function deleteTask(id) {
  if (confirm("Delete this task?")) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveStateToStorage();
    
    const activeView = getActiveView();
    refreshViewData(activeView);
    showToast("Task deleted", "warning");
  }
}

function handleTaskSubmit(e) {
  e.preventDefault();

  const title = document.getElementById("task-title-input").value.trim();
  const assocVal = document.getElementById("task-assoc-select").value;
  const dueDate = document.getElementById("task-due-input").value;
  const priority = document.getElementById("task-priority-select").value;

  let associatedType = "general";
  let associatedId = "";
  let associatedName = "";

  if (assocVal !== "none") {
    const parts = assocVal.split(":");
    associatedType = parts[0];
    associatedId = parts[1];
    associatedName = parts[2];
  }

  const newTask = {
    id: "t_" + Date.now(),
    title,
    associatedType,
    associatedId,
    associatedName,
    dueDate,
    priority,
    status: "pending",
    dateCreated: new Date().toISOString().split("T")[0]
  };

  state.tasks.push(newTask);
  saveStateToStorage();
  
  e.target.reset();
  renderTasksList();
  showToast("Task created", "success");
}

// 11. Interactions History Logs View
function populateInteractionsContactDropdown() {
  const select = document.getElementById("inter-contact-select");
  if (!select) return;

  select.innerHTML = `<option value="" disabled selected>Choose a Contact reference</option>`;
  state.contacts.forEach(c => {
    const opt = document.createElement("option");
    opt.value = `${c.id}:${c.name}`;
    opt.textContent = `${c.name} (${c.company || 'No Company'})`;
    select.appendChild(opt);
  });
}

function renderInteractionsTimeline() {
  const container = document.getElementById("full-history-timeline");
  if (!container) return;
  container.innerHTML = "";

  // Sort interactions descending
  const sorted = [...state.interactions].sort((a, b) => new Date(b.dateLogged) - new Date(a.dateLogged));

  if (sorted.length === 0) {
    container.innerHTML = `<p class="text-muted" style="text-align:center; padding: 48px 0;">No activities logged yet.</p>`;
    return;
  }

  sorted.forEach(item => {
    const dt = new Date(item.dateLogged);
    const dateFormatted = dt.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
    const timeFormatted = dt.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });

    let typeIcon = "message-square";
    if (item.type === "call") typeIcon = "phone";
    if (item.type === "email") typeIcon = "mail";
    if (item.type === "meeting") typeIcon = "calendar";
    if (item.type === "sms") typeIcon = "message-square-text";
    if (item.type === "linkedin") typeIcon = "linkedin";
    if (item.type === "whatsapp") typeIcon = "message-circle";
    if (item.type === "demo") typeIcon = "presentation";
    if (item.type === "note") typeIcon = "sticky-note";

    const html = `
      <div class="timeline-item">
        <div class="timeline-badge ${item.type}">
          <i data-lucide="${typeIcon}" style="width: 16px; height: 16px;"></i>
        </div>
        <div class="timeline-content">
          <div class="timeline-meta">
            <span class="timeline-title" style="font-size:15px; font-weight:600;">${item.contactName}</span>
            <span class="timeline-time">${dateFormatted} at ${timeFormatted}</span>
          </div>
          <p class="timeline-desc" style="margin-top:6px; font-size:14px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 12px; border-radius:8px;">
            <strong>${item.type.toUpperCase()}:</strong> ${item.details}
          </p>
        </div>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", html);
  });

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

function handleInteractionSubmit(e) {
  e.preventDefault();

  const contactVal = document.getElementById("inter-contact-select").value;
  const type = document.getElementById("inter-type-select").value;
  const details = document.getElementById("inter-desc-textarea").value.trim();

  if (!contactVal) return;

  const parts = contactVal.split(":");
  const contactId = parts[0];
  const contactName = parts[1];

  const newInteraction = {
    id: "i_" + Date.now(),
    contactId,
    contactName,
    type,
    details,
    dateLogged: new Date().toISOString()
  };

  state.interactions.push(newInteraction);
  saveStateToStorage();
  
  e.target.reset();
  renderInteractionsTimeline();
  showToast("Interaction logged successfully", "success");
}

function openInteractionFormFor(contactId) {
  navigateToView("history");
  
  // Wait a microsecond for select options to populate
  setTimeout(() => {
    const select = document.getElementById("inter-contact-select");
    const contact = state.contacts.find(c => c.id === contactId);
    if (contact && select) {
      select.value = `${contact.id}:${contact.name}`;
    }
  }, 10);
}

// 12. Helper Utilities & Notification Toasts
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const id = "toast_" + Date.now();
  
  let icon = "info";
  if (type === "success") icon = "check-circle";
  if (type === "warning") icon = "alert-circle";
  if (type === "danger") icon = "x-circle";

  const toastHtml = `
    <div class="toast ${type}" id="${id}">
      <i data-lucide="${icon}" style="width:16px; height:16px;"></i>
      <span>${message}</span>
    </div>
  `;
  container.insertAdjacentHTML("beforeend", toastHtml);
  
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  // Remove after 3.5 seconds
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) {
      el.style.opacity = "0";
      el.style.transform = "translateX(50px)";
      el.style.transition = "opacity 0.4s ease, transform 0.4s ease";
      setTimeout(() => el.remove(), 400);
    }
  }, 3500);
}

function formatDateRelative(isoString) {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now - date;
  
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Attach helpers to global window scope so HTML attributes can trigger them
window.closeModal = closeModal;
window.deleteContact = deleteContact;
window.deleteTask = deleteTask;
window.toggleTaskStatus = toggleTaskStatus;
window.openContactModal = openContactModal;
window.openDealModal = openDealModal;
window.openInteractionFormFor = openInteractionFormFor;
window.removeModalTag = removeModalTag;
window.handleDealDragStart = handleDealDragStart;

function exportContactsToCSV() {
  if (state.contacts.length === 0) {
    showToast("No contacts available to export", "warning");
    return;
  }

  const headers = ["Name", "Company", "Email", "Phone", "Status", "Estimated Value", "Tags", "Date Added"];
  const csvRows = [headers.join(",")];

  state.contacts.forEach(c => {
    const row = [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${(c.company || "").replace(/"/g, '""')}"`,
      `"${c.email || ""}"`,
      `"${c.phone || ""}"`,
      `"${c.status || ""}"`,
      c.value || 0,
      `"${(c.tags || []).join(", ")}"`,
      c.dateCreated || ""
    ];
    csvRows.push(row.join(","));
  });

  const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `nexus_contacts_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("CSV export completed successfully!", "success");
}

window.exportContactsToCSV = exportContactsToCSV;


function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const pass = document.getElementById("login-password").value;

  if (email === "admin@nexus.com" && pass === "password") {
    sessionStorage.setItem("nexus_logged_in", "true");
    document.getElementById("app-container").classList.add("logged-in");
    
    // Refresh dashboard to show initialized elements
    navigateToView("dashboard");
    showToast("Welcome back, Ayan Sarguru!", "success");
  } else {
    showToast("Invalid credentials. Try admin@nexus.com / password", "danger");
  }
}

function handleLogout() {
  if (confirm("Are you sure you want to sign out?")) {
    sessionStorage.removeItem("nexus_logged_in");
    document.getElementById("app-container").classList.remove("logged-in");
    
    // Clear search bar and fields
    document.getElementById("login-email").value = "admin@nexus.com";
    document.getElementById("login-password").value = "password";
    
    showToast("You have been signed out.", "info");
  }
}

function updateSalesGoalProgress() {
  const target = 50000;
  const wonRevenueSum = state.deals
    .filter(d => d.stage === "won")
    .reduce((sum, d) => sum + Number(d.value || 0), 0);
    
  const percentage = Math.min(100, Math.round((wonRevenueSum / target) * 100));
  
  const percentageEl = document.getElementById("target-progress-percentage");
  const barEl = document.getElementById("target-progress-bar");
  const labelEl = document.getElementById("target-progress-label");
  
  if (percentageEl) percentageEl.textContent = `${percentage}%`;
  if (barEl) barEl.style.width = `${percentage}%`;
  if (labelEl) {
    labelEl.textContent = `${new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(wonRevenueSum)} / ${new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(target)} won`;
  }
}

function handleCSVImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const text = evt.target.result;
      const lines = text.split(/\r?\n/);
      if (lines.length <= 1) {
        showToast("CSV file is empty or missing data", "warning");
        return;
      }
      
      const parseCSVLine = (line) => {
        const result = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result.map(val => val.replace(/^"|"$/g, '').replace(/""/g, '"'));
      };
      
      const headers = parseCSVLine(lines[0]);
      const headerMap = {};
      headers.forEach((h, idx) => {
        const norm = h.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (norm === "name" || norm === "fullname") headerMap.name = idx;
        else if (norm === "company" || norm === "organization") headerMap.company = idx;
        else if (norm === "email" || norm === "emailaddress") headerMap.email = idx;
        else if (norm === "phone" || norm === "phonenumber") headerMap.phone = idx;
        else if (norm === "status") headerMap.status = idx;
        else if (norm === "value" || norm === "estimatedvalue") headerMap.value = idx;
        else if (norm === "tags") headerMap.tags = idx;
      });
      
      if (headerMap.name === undefined) {
        showToast("CSV must contain a 'Name' column", "danger");
        return;
      }
      
      let importCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const cols = parseCSVLine(line);
        if (cols.length < headers.length) continue;
        
        const name = cols[headerMap.name];
        if (!name) continue;
        
        const company = headerMap.company !== undefined ? cols[headerMap.company] : "";
        const email = headerMap.email !== undefined ? cols[headerMap.email] : "";
        const phone = headerMap.phone !== undefined ? cols[headerMap.phone] : "";
        
        let status = "Lead";
        if (headerMap.status !== undefined) {
          const rawStatus = cols[headerMap.status];
          if (["Lead", "Contact", "Customer", "Partner", "Vendor", "Inactive"].includes(rawStatus)) {
            status = rawStatus;
          }
        }
        
        const value = headerMap.value !== undefined ? Number(cols[headerMap.value]) || 0 : 0;
        
        let tags = ["Imported"];
        if (headerMap.tags !== undefined && cols[headerMap.tags]) {
          tags = cols[headerMap.tags].split(/[;,]/).map(t => t.trim()).filter(Boolean);
          if (!tags.includes("Imported")) tags.push("Imported");
        }
        
        const newContact = {
          id: "c_imp_" + Date.now() + "_" + i,
          name,
          company,
          email,
          phone,
          status,
          value,
          tags,
          dateCreated: new Date().toISOString().split("T")[0]
        };
        state.contacts.push(newContact);
        importCount++;
      }
      
      if (importCount > 0) {
        saveStateToStorage();
        populateTagFilterDropdown();
        renderContactsList();
        showToast(`Successfully imported ${importCount} contacts!`, "success");
      } else {
        showToast("No valid contacts imported", "warning");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to parse CSV file", "danger");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
}

function toggleSort(field) {
  if (currentSortField === field) {
    currentSortDirection = currentSortDirection === "asc" ? "desc" : "asc";
  } else {
    currentSortField = field;
    currentSortDirection = "asc";
  }
  
  const fields = ["name", "company", "status", "value", "dateCreated"];
  fields.forEach(f => {
    const iconEl = document.getElementById(`sort-icon-${f}`);
    if (iconEl) {
      if (f === currentSortField) {
        iconEl.setAttribute("data-lucide", currentSortDirection === "asc" ? "chevron-up" : "chevron-down");
      } else {
        iconEl.setAttribute("data-lucide", "chevrons-up-down");
      }
    }
  });
  
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
  
  renderContactsList();
}

window.toggleSort = toggleSort;


