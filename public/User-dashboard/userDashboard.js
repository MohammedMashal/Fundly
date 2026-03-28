import SessionManager from "../Utils/sessionManager.js";
import CampaignAPI from "../Utils/campaignApi.js";
import PledgeAPI from "../Utils/pledgeApi.js";
import UserAPI from "../Utils/userApi.js";
import { calculateDaysLeft, getInitials } from "../Utils/campaignUi.js";

let currentUser = SessionManager.getUser();

const dashboardLink = document.getElementById("nav-dashboard");
const historyLink = document.getElementById("nav-history");
const settingsLink = document.getElementById("nav-settings");
const dashboardView = document.getElementById("dashboard-view");
const historyView = document.getElementById("history-view");
const settingsView = document.getElementById("settings-view");
const campaignsGrid = document.getElementById("my-campaigns-grid");
const historyBody = document.getElementById("investment-history-body");
const welcomeTitle = document.getElementById("welcome-title");
const profileForm = document.getElementById("profile-form");
const profileMessage = document.getElementById("profile-message");
const editCampaignDialog = document.getElementById("edit-campaign-dialog");
const editCampaignForm = document.getElementById("edit-campaign-form");
const editCampaignIdInput = document.getElementById("edit-campaign-id");
const editTitleInput = document.getElementById("edit-title");
const editCategoryInput = document.getElementById("edit-category");
const editDescriptionInput = document.getElementById("edit-description");
const editGoalInput = document.getElementById("edit-goal");
const editDeadlineInput = document.getElementById("edit-deadline");
const editCampaignMessage = document.getElementById("edit-campaign-message");
const editCancelBtn = document.getElementById("edit-cancel-btn");
const editCancelTop = document.getElementById("edit-cancel-top");
const editSaveBtn = document.getElementById("edit-save-btn");
const deleteCampaignDialog = document.getElementById("delete-campaign-dialog");
const deleteCampaignForm = document.getElementById("delete-campaign-form");
const deleteCancelBtn = document.getElementById("delete-cancel-btn");
const deleteCancelTop = document.getElementById("delete-cancel-top");
const deleteConfirmBtn = document.getElementById("delete-confirm-btn");

let myCampaigns = [];
let pendingDeleteCampaignId = null;

function setAvatarAndHeader() {
  const initials = getInitials(currentUser.name || "US");
  document.querySelectorAll(".avatar").forEach((el) => {
    el.textContent = initials;
  });

  welcomeTitle.textContent = "My Campaigns";
}

function daysLeftLabel(deadline) {
  if (!deadline) return "N/A";
  return String(calculateDaysLeft(deadline));
}

function truncate(text, max = 78) {
  const content = String(text || "No description provided.");
  return content.length > max ? `${content.slice(0, max)}...` : content;
}

function renderCampaigns(campaigns) {
  if (!campaigns.length) {
    campaignsGrid.innerHTML =
      '<div class="empty-state">No campaigns found. Try a different search.</div>';
    return;
  }

  campaignsGrid.innerHTML = campaigns
    .map((campaign) => {
      const goal = Number(campaign.goal || 0);
      const raised = Number(campaign.raised || 0);
      const progress =
        goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
      const statusClass = campaign.isApproved ? "approved" : "pending";
      const statusLabel = campaign.isApproved ? "APPROVED" : "PENDING APPROVAL";
      const imageSrc =
        campaign.image ||
        "https://placehold.co/960x540/e5e7eb/0f172a?text=Campaign";

      return `
        <article class="campaign-card">
          <div class="card-image-wrap">
            <img src="${imageSrc}" alt="${campaign.title}" />
            <span class="card-category">${campaign.category || "General"}</span>
          </div>
          <div class="card-body">
            <h3 class="card-title">${truncate(campaign.title, 30)}</h3>
            <p class="card-desc">${truncate(campaign.description, 88)}</p>
            <div class="card-meta">
              <span>by ${campaign.creatorName || currentUser.name || "User"}</span>
              <span class="card-location">
                <span class="material-symbols-outlined" aria-hidden="true">location_on</span>
                Egypt
              </span>
            </div>
            <div class="card-progress">
              <div class="card-progress-fill" style="width:${progress}%"></div>
            </div>
            <div class="card-stats">
              <div>
                <div class="money">$${raised.toLocaleString()}</div>
                <p class="money-sub">raised of $${goal.toLocaleString()}</p>
              </div>
              <div class="backers">
                <strong>${Number(campaign.backers || 0)}</strong>
                <span>backers</span>
              </div>
            </div>
            <div class="card-footer">
              <span class="days-left">${daysLeftLabel(campaign.deadline)} days left</span>
              <span class="status-pill ${statusClass}">${statusLabel}</span>
            </div>
            <div class="card-actions">
              <button type="button" class="edit-btn" data-campaign-id="${campaign.id}">Edit</button>
              <button type="button" class="delete-btn" data-campaign-id="${campaign.id}">Delete</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function handleDeleteCampaign(campaignId) {
  pendingDeleteCampaignId = campaignId;
  deleteCampaignDialog.showModal();
}

function closeDeleteDialog() {
  pendingDeleteCampaignId = null;
  deleteCampaignDialog.close();
}

function bindCampaignGridActions() {
  campaignsGrid.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".edit-btn[data-campaign-id]");
    if (editBtn) {
      openEditDialog(editBtn.dataset.campaignId);
      return;
    }
    const delBtn = e.target.closest(".delete-btn[data-campaign-id]");
    if (delBtn) {
      handleDeleteCampaign(delBtn.dataset.campaignId);
    }
  });
}

function bindDeleteDialog() {
  deleteCancelBtn.addEventListener("click", closeDeleteDialog);
  deleteCancelTop.addEventListener("click", closeDeleteDialog);

  deleteCampaignDialog.addEventListener("click", (e) => {
    const rect = deleteCampaignDialog.getBoundingClientRect();
    const clickedOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;
    if (clickedOutside) {
      closeDeleteDialog();
    }
  });

  deleteCampaignForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!pendingDeleteCampaignId) {
      closeDeleteDialog();
      return;
    }

    deleteConfirmBtn.disabled = true;
    deleteConfirmBtn.textContent = "Deleting...";

    try {
      await CampaignAPI.delete(pendingDeleteCampaignId);
      myCampaigns = myCampaigns.filter(
        (campaign) => String(campaign.id) !== String(pendingDeleteCampaignId),
      );
      renderCampaigns(myCampaigns);
      closeDeleteDialog();
    } catch (error) {
      console.error("Failed to delete campaign:", error);
    } finally {
      deleteConfirmBtn.disabled = false;
      deleteConfirmBtn.textContent = "Delete";
    }
  });
}

function closeEditDialog() {
  editCampaignDialog.close();
  editCampaignMessage.textContent = "";
  editCampaignMessage.classList.remove("error");
}

function openEditDialog(campaignId) {
  const campaign = myCampaigns.find(
    (item) => String(item.id) === String(campaignId),
  );
  if (!campaign) return;

  editCampaignIdInput.value = String(campaign.id);
  editTitleInput.value = campaign.title || "";
  editCategoryInput.value = campaign.category || "Technology";
  editDescriptionInput.value = campaign.description || "";
  editGoalInput.value = Number(campaign.goal || 0);
  editDeadlineInput.value = campaign.deadline || "";

  editCampaignMessage.textContent = "";
  editCampaignMessage.classList.remove("error");

  editCampaignDialog.showModal();
}

function bindEditDialog() {
  editCancelBtn.addEventListener("click", closeEditDialog);
  editCancelTop.addEventListener("click", closeEditDialog);

  editCampaignDialog.addEventListener("click", (e) => {
    const rect = editCampaignDialog.getBoundingClientRect();
    const clickedOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;
    if (clickedOutside) {
      closeEditDialog();
    }
  });

  editCampaignForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const campaignId = editCampaignIdInput.value;
    const title = editTitleInput.value.trim();
    const category = editCategoryInput.value;
    const description = editDescriptionInput.value.trim();
    const goal = Number(editGoalInput.value);
    const deadline = editDeadlineInput.value;

    if (!title || !category || !description || !goal || !deadline) {
      editCampaignMessage.textContent = "Please fill all fields.";
      editCampaignMessage.classList.add("error");
      return;
    }

    editSaveBtn.disabled = true;
    editSaveBtn.textContent = "Saving...";

    try {
      const updated = await CampaignAPI.update(campaignId, {
        title,
        category,
        description,
        goal,
        deadline,
      });

      myCampaigns = myCampaigns.map((campaign) =>
        String(campaign.id) === String(campaignId)
          ? { ...campaign, ...updated }
          : campaign,
      );

      renderCampaigns(myCampaigns);
      closeEditDialog();
    } catch (error) {
      editCampaignMessage.textContent = "Failed to update campaign.";
      editCampaignMessage.classList.add("error");
    } finally {
      editSaveBtn.disabled = false;
      editSaveBtn.textContent = "Save Changes";
    }
  });
}

async function loadMyCampaigns() {
  campaignsGrid.innerHTML =
    '<div class="empty-state">Loading your campaigns...</div>';

  try {
    const campaigns = await CampaignAPI.getAll();

    myCampaigns = campaigns.filter(
      (campaign) => String(campaign.creatorId) === String(currentUser.id),
    );

    const campaignsWithBackers = await Promise.all(
      myCampaigns.map(async (campaign) => {
        try {
          const campaignPledges = await PledgeAPI.getByCampaignId(campaign.id);
          return {
            ...campaign,
            backers: Array.isArray(campaignPledges)
              ? campaignPledges.length
              : 0,
          };
        } catch {
          return { ...campaign, backers: 0 };
        }
      }),
    );

    myCampaigns = campaignsWithBackers;

    renderCampaigns(myCampaigns);
  } catch (error) {
    campaignsGrid.innerHTML =
      '<div class="empty-state">Failed to load campaigns. Please try again.</div>';
  }
}

async function loadInvestmentHistory() {
  historyBody.innerHTML = "";

  try {
    const [pledges, campaigns] = await Promise.all([
      PledgeAPI.getByUserId(currentUser.id),
      CampaignAPI.getAll(),
    ]);

    const campaignMap = Object.fromEntries(
      campaigns.map((campaign) => [String(campaign.id), campaign.title]),
    );

    if (!pledges.length) {
      historyBody.innerHTML =
        '<tr><td colspan="4">No investments yet.</td></tr>';
      return;
    }

    pledges
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .forEach((pledge) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>#PLG-${pledge.id}</td>
          <td>${pledge.createdAt}</td>
          <td>${campaignMap[String(pledge.campaignId)] || "Campaign"}</td>
          <td>$${Number(pledge.amount).toLocaleString()}</td>
        `;
        historyBody.appendChild(row);
      });
  } catch (error) {
    historyBody.innerHTML =
      '<tr><td colspan="4">Failed to load pledge history.</td></tr>';
  }
}

function bindNavigation() {
  function setActiveView() {
    const hash = window.location.hash;
    const showHistory = hash === "#history-view";
    const showSettings = hash === "#settings-view";
    const showDashboard = !showHistory && !showSettings;

    dashboardView.classList.toggle("active-view", showDashboard);
    historyView.classList.toggle("active-view", showHistory);
    settingsView.classList.toggle("active-view", showSettings);

    dashboardLink.classList.toggle("active", showDashboard);
    historyLink.classList.toggle("active", showHistory);
    settingsLink.classList.toggle("active", showSettings);

    if (showHistory) {
      welcomeTitle.textContent = "Pledge History";
    } else if (showSettings) {
      welcomeTitle.textContent = "Settings";
    } else {
      welcomeTitle.textContent = "My Campaigns";
    }
  }

  window.addEventListener("hashchange", setActiveView);
  setActiveView();
}

function populateProfileForm() {
  document.getElementById("full-name").value = currentUser.name || "";
  document.getElementById("email").value = currentUser.email || "";
}

function bindProfileSave() {
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    profileMessage.textContent = "";
    profileMessage.classList.remove("error");

    const name = document.getElementById("full-name").value.trim();
    const email = document.getElementById("email").value.trim();

    if (!name || !email) {
      profileMessage.textContent = "Name and email are required.";
      profileMessage.classList.add("error");
      return;
    }

    try {
      const updatedUser = await UserAPI.update(currentUser.id, { name, email });
      currentUser = { ...currentUser, ...updatedUser };
      SessionManager.setUser(currentUser);
      setAvatarAndHeader();

      profileMessage.textContent = "Profile updated successfully.";
      profileMessage.classList.remove("error");
    } catch (error) {
      profileMessage.textContent = "Failed to update profile.";
      profileMessage.classList.add("error");
    }
  });
}

function bindLogout() {
  document.getElementById("logout-btn").addEventListener("click", (e) => {
    e.preventDefault();
    SessionManager.logout();
    window.location.href = "../login/login.html";
  });
}

async function init() {
  if (!SessionManager.isAuthenticated()) {
    window.location.href = "../login/login.html";
    return;
  }

  currentUser = SessionManager.getUser();

  setAvatarAndHeader();
  bindNavigation();
  bindLogout();
  bindCampaignGridActions();
  populateProfileForm();
  bindProfileSave();
  bindEditDialog();
  bindDeleteDialog();
  await loadMyCampaigns();
  await loadInvestmentHistory();
}

await init();
