import SessionManager from "../Utils/sessionManager.js";
import CampaignAPI from "../Utils/campaignApi.js";
import PledgeAPI from "../Utils/pledgeApi.js";
import { calculateDaysLeft, setupAuthHeader } from "../Utils/campaignUi.js";

const currentUser = SessionManager.getUser();

if (!currentUser) {
  window.location.href = "../login/login.html";
}

const userMenu = document.getElementById("user-menu");
const userMenuBtn = document.getElementById("user-menu-btn");
const userDropdown = document.getElementById("user-dropdown");
const userInitials = document.getElementById("user-initials");
const dropdownUserName = document.getElementById("dropdown-user-name");
const dropdownUserEmail = document.getElementById("dropdown-user-email");
const dropdownAdminDashboardLink = document.getElementById(
  "dropdown-admin-dashboard-link",
);
const dropdownLogoutBtn = document.getElementById("dropdown-logout-btn");
const investDialog = document.getElementById("invest-dialog");
const investForm = document.getElementById("invest-form");
const investAmountInput = document.getElementById("invest-amount");
const investCampaignLabel = document.getElementById("invest-dialog-campaign");
const investError = document.getElementById("invest-error");
const investCancelBtn = document.getElementById("invest-cancel-btn");
const investCancelTop = document.getElementById("invest-cancel-top");
const investConfirmBtn = document.getElementById("invest-confirm-btn");
const appToast = document.getElementById("app-toast");

const MIN_INVESTMENT = 1;
let toastTimeoutId;

function showToast(message, type = "success") {
  appToast.textContent = message;
  appToast.className = `app-toast ${type}`;
  requestAnimationFrame(() => {
    appToast.classList.add("show");
  });

  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
  }

  toastTimeoutId = setTimeout(() => {
    appToast.classList.remove("show");
  }, 2800);
}

function formatMoney(value) {
  return `$${Number(value).toLocaleString()}`;
}

function getUrlParam(param) {
  return new URLSearchParams(window.location.search).get(param);
}


function getFundingState(campaign) {
  const goal = Number(campaign.goal);
  const raised = Number(campaign.raised);
  const roundedPct = goal > 0 ? Math.round((raised / goal) * 100) : 0;
  const progress = Math.max(0, Math.min(100, roundedPct));
  const goalReached = goal > 0 && roundedPct >= 100;
  return { goal, raised, progress, goalReached };
}

function updateInvestButtons(goalReached) {
  document.querySelectorAll(".btn-invest, .btn-invest-sidebar").forEach((btn) => {
    btn.disabled = goalReached;
    btn.textContent = goalReached ? "Goal Reached" : "Invest Now";
  });
}

async function loadCampaignDetails() {
  const campaign = await CampaignAPI.getById(getUrlParam("id"));
  const pledges = await PledgeAPI.getByCampaignId(campaign.id);

  document.title = `${campaign.title} | Fundly`;

  const { goal, raised, progress, goalReached } = getFundingState(campaign);

  document.querySelector(".campaign-hero h1").textContent = campaign.title;
  document.querySelector(".hero-sector").textContent = campaign.category;

  const heroDescription = document.querySelector(".hero-description");
  heroDescription.textContent = campaign.description;
  heroDescription.style.display = campaign.description ? "block" : "none";

  document.querySelector(".hero-icon").textContent =
    campaign.category.charAt(0).toUpperCase();

  document.querySelector(".campaign-progress").value = progress;
  document.querySelector(".amount-raised").textContent =
    `${formatMoney(raised)} of ${formatMoney(goal)}`;
  document.querySelector(".progress-percentage").textContent = `${progress}%`;

  updateInvestButtons(goalReached);

  document.getElementById("overview-text").textContent = campaign.description;

  document.getElementById("creator-value").textContent = campaign.creatorName;
  document.getElementById("category-value").textContent = campaign.category;
  document.getElementById("deadline-value").textContent = campaign.deadline;
  document.getElementById("created-value").textContent = campaign.createdAt;

  const image = document.getElementById("campaign-image");
  image.src = campaign.image;
  image.alt = campaign.title;

  document.getElementById("stat-investors").textContent = pledges.length;
  document.getElementById("stat-days-left").textContent = calculateDaysLeft(
    campaign.deadline,
  );
  document.getElementById("stat-close-date").textContent = campaign.deadline;

  document.getElementById("quick-goal").textContent = formatMoney(goal);
  document.getElementById("quick-raised").textContent = formatMoney(raised);
  document.getElementById("quick-progress").textContent = `${progress}%`;

  const statusBadge = document.querySelector(".status-badge");
  const statusDetailText = document.getElementById("status-detail-text");

  if (campaign.isApproved) {
    statusBadge.textContent = "Active - Funding";
    statusBadge.style.color = "#1a9a58";
    statusDetailText.textContent = goalReached
      ? "Funding goal reached"
      : "Accepting investments";
  } else {
    statusBadge.textContent = "Pending Approval";
    statusBadge.style.color = "#d86c00";
    statusDetailText.textContent = "Waiting for admin approval";
  }

  window.currentCampaign = campaign;
}

function bindInvestButton() {
  document
    .querySelectorAll(".btn-invest, .btn-invest-sidebar")
    .forEach((btn) => btn.addEventListener("click", openInvestDialog));
}

function resetInvestDialogState() {
  investError.textContent = "";
  investError.classList.add("hidden");
  investAmountInput.value = "";
  investConfirmBtn.disabled = false;
  investConfirmBtn.textContent = "Confirm Investment";
}

function closeInvestDialog() {
  investDialog.close();
  resetInvestDialogState();
}

function openInvestDialog() {
  resetInvestDialogState();
  investCampaignLabel.textContent = window.currentCampaign.title;
  investDialog.showModal();
  setTimeout(() => investAmountInput.focus(), 0);
}

function bindInvestDialog() {
  investCancelBtn.addEventListener("click", closeInvestDialog);
  investCancelTop.addEventListener("click", closeInvestDialog);

  investDialog.addEventListener("click", (e) => {
    const rect = investDialog.getBoundingClientRect();
    const clickedOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;
    if (clickedOutside) {
      closeInvestDialog();
    }
  });

  investForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const pledgeAmount = Number(investAmountInput?.value || 0);
    if (!Number.isFinite(pledgeAmount) || pledgeAmount < MIN_INVESTMENT) {
      investError.textContent = `Amount must be at least $${MIN_INVESTMENT.toLocaleString()}.`;
      investError.classList.remove("hidden");
      return;
    }

    const latestCampaign = await CampaignAPI.getById(window.currentCampaign.id);
    if (getFundingState(latestCampaign).goalReached) {
      investError.textContent =
        "This campaign already reached 100% of its goal.";
      investError.classList.remove("hidden");
      return;
    }

    investError.textContent = "";
    investError.classList.add("hidden");

    investConfirmBtn.disabled = true;
    investConfirmBtn.textContent = "Processing...";

    try {
      await PledgeAPI.create(
        window.currentCampaign.id,
        currentUser.id,
        pledgeAmount,
      );

      closeInvestDialog();
      showToast(
        "Investment successful! Your pledge has been recorded. Thank you for supporting this campaign.",
        "success",
      );
      await loadCampaignDetails();
    } catch (error) {
      investError.textContent = `Failed to create pledge: ${error.message}`;
      investError.classList.remove("hidden");
      investConfirmBtn.disabled = false;
      investConfirmBtn.textContent = "Confirm Investment";
    }
  });
}

setupAuthHeader({
  userMenu,
  userMenuBtn,
  userDropdown,
  userInitials,
  dropdownUserName,
  dropdownUserEmail,
  dropdownAdminDashboardLink,
  dropdownLogoutBtn,
});
bindInvestButton();
bindInvestDialog();
await loadCampaignDetails();
