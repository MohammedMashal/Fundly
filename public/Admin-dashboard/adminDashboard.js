import SessionManager from "../Utils/sessionManager.js";
import CampaignAPI from "../Utils/campaignApi.js";
import UserAPI from "../Utils/userApi.js";
import PledgeAPI from "../Utils/pledgeApi.js";
import { calculateDaysLeft, getInitials } from "../Utils/campaignUi.js";

const usersLink = document.getElementById("nav-users");
const campaignsLink = document.getElementById("nav-campaigns");
const pledgesLink = document.getElementById("nav-pledges");

const usersView = document.getElementById("users-view");
const campaignsView = document.getElementById("campaigns-view");
const pledgesView = document.getElementById("pledges-view");

const usersGrid = document.getElementById("users-grid");
const campaignsGrid = document.getElementById("campaigns-grid");
const pledgesGrid = document.getElementById("pledges-grid");

const editDialog = document.getElementById("admin-edit-campaign-dialog");
const editForm = document.getElementById("admin-edit-campaign-form");
const editIdInput = document.getElementById("admin-edit-id");
const editTitleInput = document.getElementById("admin-edit-title");
const editCategoryInput = document.getElementById("admin-edit-category");
const editDescriptionInput = document.getElementById("admin-edit-description");
const editGoalInput = document.getElementById("admin-edit-goal");
const editDeadlineInput = document.getElementById("admin-edit-deadline");
const editMessage = document.getElementById("admin-edit-message");
const editCloseTopBtn = document.getElementById("admin-edit-close-top");
const editCancelBtn = document.getElementById("admin-edit-cancel");
const deleteDialog = document.getElementById("admin-delete-campaign-dialog");
const deleteForm = document.getElementById("admin-delete-campaign-form");
const deleteCloseTopBtn = document.getElementById("admin-delete-close-top");
const deleteCancelBtn = document.getElementById("admin-delete-cancel");
const deleteCampaignTitle = document.getElementById(
  "admin-delete-campaign-title",
);

let usersCache = [];
let campaignsCache = [];
let pledgesCache = [];
let campaignBackersMap = new Map();
let campaignIdPendingDelete = null;

function clearEditMessage() {
  editMessage.textContent = "";
}

function closeEditDialog() {
  editDialog.close();
  clearEditMessage();
}

function openEditDialog(campaignId) {
  const campaign = campaignsCache.find(
    (item) => String(item.id) === String(campaignId),
  );
  if (!campaign) return;

  editIdInput.value = String(campaign.id);
  editTitleInput.value = campaign.title || "";
  editCategoryInput.value = campaign.category || "Technology";
  editDescriptionInput.value = campaign.description || "";
  editGoalInput.value = Number(campaign.goal || 0);
  editDeadlineInput.value = campaign.deadline || "";

  clearEditMessage();
  editDialog.showModal();
}

function closeDeleteDialog() {
  deleteDialog.close();
  campaignIdPendingDelete = null;
}

function openDeleteDialog(campaignId) {
  const campaign = campaignsCache.find(
    (item) => String(item.id) === String(campaignId),
  );
  if (!campaign) return;

  campaignIdPendingDelete = String(campaign.id);
  deleteCampaignTitle.textContent = campaign.title || "this campaign";
  deleteDialog.showModal();
}

function setAvatar(initials) {
  document.querySelectorAll(".avatar").forEach((el) => {
    el.textContent = initials;
  });
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setActiveView(hash) {
  const targetHash = hash || "#users-view";

  const views = {
    "#users-view": usersView,
    "#campaigns-view": campaignsView,
    "#pledges-view": pledgesView,
  };

  const links = {
    "#users-view": usersLink,
    "#campaigns-view": campaignsLink,
    "#pledges-view": pledgesLink,
  };

  Object.values(views).forEach((view) => view.classList.remove("active-view"));
  Object.values(links).forEach((link) => link.classList.remove("active"));

  const activeView = views[targetHash] || usersView;
  const activeLink = links[targetHash] || usersLink;

  activeView.classList.add("active-view");
  activeLink.classList.add("active");
}

function bindNavigation() {
  window.addEventListener("hashchange", () => {
    setActiveView(window.location.hash);
  });

  if (!window.location.hash) {
    window.location.hash = "#users-view";
  }
  setActiveView(window.location.hash);
}

function bindLogout() {
  document.getElementById("logout-btn").addEventListener("click", (e) => {
    e.preventDefault();
    SessionManager.logout();
    window.location.href = "../login/login.html";
  });
}

function bindEditDialog() {
  editCloseTopBtn.addEventListener("click", closeEditDialog);
  editCancelBtn.addEventListener("click", closeEditDialog);

  editDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeEditDialog();
  });

  editForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const campaignId = editIdInput.value;
    if (!campaignId) return;

    const goal = Number(editGoalInput.value || 0);
    if (goal <= 0) {
      editMessage.textContent = "Goal must be greater than 0.";
      return;
    }

    const payload = {
      title: String(editTitleInput.value || "").trim(),
      category: String(editCategoryInput.value || "").trim(),
      description: String(editDescriptionInput.value || "").trim(),
      goal,
      deadline: String(editDeadlineInput.value || "").trim(),
    };

    if (
      !payload.title ||
      !payload.category ||
      !payload.description ||
      !payload.deadline
    ) {
      editMessage.textContent = "Please fill all required fields.";
      return;
    }

    try {
      await CampaignAPI.update(campaignId, payload);
      await loadAllData();
      closeEditDialog();
    } catch (error) {
      editMessage.textContent = "Failed to save changes. Try again.";
      console.error("Failed to update campaign:", error);
    }
  });
}

function bindDeleteDialog() {
  deleteCloseTopBtn.addEventListener("click", closeDeleteDialog);
  deleteCancelBtn.addEventListener("click", closeDeleteDialog);

  deleteDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDeleteDialog();
  });

  deleteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!campaignIdPendingDelete) return;

    try {
      await CampaignAPI.delete(campaignIdPendingDelete);
      await loadAllData();
      closeDeleteDialog();
    } catch (error) {
      console.error("Failed to delete campaign:", error);
    }
  });
}

function renderUsers(users) {
  if (!users.length) {
    usersGrid.innerHTML = '<div class="empty-state">No users found.</div>';
    return;
  }

  usersGrid.innerHTML = users
    .map((user) => {
      const isActive = Boolean(user.isActive);
      return `
        <article class="card user-card">
          <header class="card-head">
            <div>
              <h3 class="card-name">${escapeHtml(user.name || "Unknown User")}</h3>
              <p class="card-email">${escapeHtml(user.email || "No email")}</p>
            </div>
            <span class="chip ${isActive ? "chip-active" : "chip-banned"}">${isActive ? "ACTIVE" : "BANNED"}</span>
          </header>

          <div class="card-sep"></div>

          <div class="info-row">
            <span>Role</span>
            <strong>${escapeHtml(user.role || "user")}</strong>
          </div>

          <button class="btn btn-user ${isActive ? "ban" : "unban"}" data-user-id="${escapeHtml(user.id)}" data-action="toggle-user">
            <span class="material-symbols-outlined" aria-hidden="true">settings</span>
            ${isActive ? "Ban User" : "Unban User"}
          </button>
        </article>
      `;
    })
    .join("");
}

function renderCampaigns(campaigns) {
  if (!campaigns.length) {
    campaignsGrid.innerHTML =
      '<div class="empty-state">No campaigns found.</div>';
    return;
  }

  campaignsGrid.innerHTML = campaigns
    .map((campaign) => {
      const goal = Number(campaign.goal || 0);
      const raised = Number(campaign.raised || 0);
      const progress =
        goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
      const backers = campaignBackersMap.get(String(campaign.id)) || 0;
      const statusClass = campaign.isApproved
        ? "chip-approved"
        : "chip-pending";
      const statusText = campaign.isApproved ? "APPROVED" : "PENDING APPROVAL";
      const imageSrc =
        campaign.image ||
        "https://placehold.co/900x500/e5e7eb/1a1c1a?text=Campaign";

      return `
        <article class="card campaign-card">
          <div class="campaign-media">
            <img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(campaign.title || "Campaign image")}" />
            <span class="category-badge">${escapeHtml(campaign.category || "General")}</span>
          </div>

          <div class="campaign-content">
            <h3 class="campaign-title">${escapeHtml(campaign.title || "Untitled Campaign")}</h3>
            <p class="campaign-desc">${escapeHtml(campaign.description || "No description provided.")}</p>

            <div class="meta-line">
              <span>by ${escapeHtml(campaign.creatorName || "Unknown")}</span>
              <span class="muted">${escapeHtml(campaign.location || "Egypt")}</span>
            </div>

            <div class="progress"><span style="width: ${progress}%;"></span></div>

            <div class="money-row">
              <div>
                <strong class="money-main">${formatMoney(raised)}</strong>
                <span class="money-sub">raised of ${formatMoney(goal)}</span>
              </div>
              <div class="backers">
                <strong>${backers}</strong>
                <small>backers</small>
              </div>
            </div>

            <div class="campaign-foot">
              <span class="days-left">${campaign.deadline ? calculateDaysLeft(campaign.deadline) : 0} days left</span>
              <span class="chip ${statusClass}">${statusText}</span>
            </div>

            <div class="btn-row">
              ${
                campaign.isApproved
                  ? `<button class="btn btn-danger" data-action="delete-campaign" data-campaign-id="${escapeHtml(campaign.id)}">Delete</button>
                     <button class="btn btn-edit" data-action="edit-campaign" data-campaign-id="${escapeHtml(campaign.id)}">Edit</button>`
                  : `<button class="btn btn-approve" data-action="approve-campaign" data-campaign-id="${escapeHtml(campaign.id)}">Approve</button>
                     <button class="btn btn-danger" data-action="delete-campaign" data-campaign-id="${escapeHtml(campaign.id)}">Delete</button>
                     <button class="btn btn-edit" data-action="edit-campaign" data-campaign-id="${escapeHtml(campaign.id)}">Edit</button>`
              }
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderPledges(pledges) {
  if (!pledges.length) {
    pledgesGrid.innerHTML = '<div class="empty-state">No pledges found.</div>';
    return;
  }

  pledgesGrid.innerHTML = pledges
    .map((pledge) => {
      const user = usersCache.find(
        (u) => String(u.id) === String(pledge.userId),
      );
      const campaign = campaignsCache.find(
        (c) => String(c.id) === String(pledge.campaignId),
      );

      return `
        <article class="card pledge-card">
          <header class="card-head">
            <div>
              <h3 class="card-name">${escapeHtml(user?.name || "Unknown User")}</h3>
              <p class="card-email">${escapeHtml(user?.email || "No email")}</p>
            </div>
          </header>

          <div class="card-sep"></div>

          <div class="pledge-body">
            <div class="info-row"><span>Amount</span><strong>${formatMoney(pledge.amount)}</strong></div>
            <div class="info-row"><span>Date</span><strong>${escapeHtml(pledge.createdAt || "-")}</strong></div>
          </div>

          <a class="pledge-campaign" href="../Campaign-Details/campaignDetails.html?id=${escapeHtml(campaign?.id || "")}">
            ${escapeHtml(campaign?.title || "Campaign unavailable")}
          </a>
        </article>
      `;
    })
    .join("");
}

async function loadAllData() {
  try {
    const [users, campaigns, pledges] = await Promise.all([
      UserAPI.getAll(),
      CampaignAPI.getAll(),
      PledgeAPI.getAll(),
    ]);

    usersCache = users;
    campaignsCache = campaigns;
    pledgesCache = pledges;

    campaignBackersMap = new Map();
    pledges.forEach((pledge) => {
      const campaignId = String(pledge.campaignId ?? "");
      if (!campaignId) return;
      campaignBackersMap.set(
        campaignId,
        Number(campaignBackersMap.get(campaignId) || 0) + 1,
      );
    });

    renderUsers(usersCache);
    renderCampaigns(campaignsCache);
    renderPledges(pledgesCache);
  } catch (error) {
    console.error("Failed to load admin data:", error);
    usersGrid.innerHTML =
      '<div class="empty-state">Failed to load users.</div>';
    campaignsGrid.innerHTML =
      '<div class="empty-state">Failed to load campaigns.</div>';
    pledgesGrid.innerHTML =
      '<div class="empty-state">Failed to load pledges.</div>';
  }
}

function bindActions() {
  document.addEventListener("click", async (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;

    const action = target.dataset.action;

    try {
      if (action === "toggle-user") {
        const userId = target.dataset.userId;
        const user = usersCache.find((u) => String(u.id) === String(userId));
        if (!user) return;

        await UserAPI.update(userId, { isActive: !user.isActive });
        await loadAllData();
        return;
      }

      if (action === "approve-campaign") {
        const campaignId = target.dataset.campaignId;
        await CampaignAPI.update(campaignId, { isApproved: true });
        await loadAllData();
        return;
      }

      if (action === "delete-campaign") {
        const campaignId = target.dataset.campaignId;
        openDeleteDialog(campaignId);
        return;
      }

      if (action === "edit-campaign") {
        const campaignId = target.dataset.campaignId;
        openEditDialog(campaignId);
      }
    } catch (error) {
      console.error("Failed to process admin action:", error);
    }
  });
}

async function init() {
  if (!SessionManager.isAuthenticated()) {
    window.location.href = "../login/login.html";
    return;
  }

  const currentUser = SessionManager.getUser();
  if (String(currentUser.role || "").toLowerCase() !== "admin") {
    window.location.href = "../User-dashboard/userDashboard.html";
    return;
  }

  setAvatar(getInitials(currentUser.name || "Admin"));
  bindNavigation();
  bindLogout();
  bindEditDialog();
  bindDeleteDialog();
  bindActions();
  await loadAllData();
}

await init();
