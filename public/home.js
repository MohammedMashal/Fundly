import CampaignAPI from "./Utils/campaignApi.js";
import SessionManager from "./Utils/sessionManager.js";
import { createCampaignCard, setupAuthHeader } from "./Utils/campaignUi.js";

const loginLink = document.getElementById("login-link");
const signupLink = document.getElementById("signup-link");
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
const container = document.getElementById("campaigns-container");
const searchInput = document.querySelector(".header-search input");

setupAuthHeader({
  loginLink,
  signupLink,
  userMenu,
  userMenuBtn,
  userDropdown,
  userInitials,
  dropdownUserName,
  dropdownUserEmail,
  dropdownAdminDashboardLink,
  dropdownLogoutBtn,
});

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const query = searchInput.value;
    if (query) {
      window.location.href = `./Campaigns/campaigns.html?search=${query}`;
    }
  }
});

try {
  const campaigns = await CampaignAPI.getAll({ isApproved: true });

  campaigns.slice(0, 4).forEach((campaign) => {
    container.appendChild(createCampaignCard(campaign));
  });
} catch (error) {
  container.innerHTML =
    '<div class="empty-state"><h3>Failed to load campaigns</h3><p>Please try again later.</p></div>';
}
