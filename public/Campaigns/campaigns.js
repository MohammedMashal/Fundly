import CampaignAPI from "../Utils/campaignApi.js";
import { createCampaignCard, setupAuthHeader } from "../Utils/campaignUi.js";

const searchInput = document.getElementById("search-input");
const container = document.getElementById("campaigns-container");
const categoryChips = document.querySelectorAll(".category-chip");
const statusFilter = document.getElementById("status-filter");

let allCampaigns = [];
let selectedCategory = "All";

async function loadCampaigns() {
  try {
    allCampaigns = await CampaignAPI.getAll({ isApproved: true });
    applyFilters();
  } catch (error) {
    container.innerHTML =
      '<div class="empty-state"><h3>Failed to load campaigns</h3><p>Please try again later.</p></div>';
  }
}

function applyFilters() {
  const searchQuery = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;

  let filtered = [...allCampaigns];

  if (searchQuery) {
    filtered = filtered.filter((campaign) => {
      const inTitle = campaign.title.toLowerCase().includes(searchQuery);
      const inDescription = campaign.description
        .toLowerCase()
        .includes(searchQuery);
      const inCategory = campaign.category.toLowerCase().includes(searchQuery);
      return inTitle || inDescription || inCategory;
    });
  }

  if (selectedCategory !== "All") {
    const choosedCategory = selectedCategory.toLowerCase();
    filtered = filtered.filter((campaign) =>
      campaign.category.toLowerCase().includes(choosedCategory),
    );
  }

  if (selectedStatus) {
    const now = new Date();
    filtered = filtered.filter((campaign) => {
      const isOpen = new Date(campaign.deadline) >= now;
      return selectedStatus === "open" ? isOpen : !isOpen;
    });
  }

  renderCampaigns(filtered);
}

function renderCampaigns(campaigns) {
  container.innerHTML = "";
  if (!campaigns.length) {
    container.innerHTML =
      '<div class="empty-state"><h3>No campaigns found</h3><p>Try changing your filters or search term.</p></div>';
    return;
  }

  campaigns.forEach((campaign) => {
    container.appendChild(createCampaignCard(campaign));
  });
}

function getSearchQueryFromUrl() {
  return new URLSearchParams(window.location.search).get("search");
}

function bindCategoryFilter() {
  categoryChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      selectedCategory = chip.dataset.category;
      categoryChips.forEach((btn) => btn.classList.remove("active"));
      chip.classList.add("active");
      applyFilters();
    });
  });

  statusFilter.addEventListener("change", applyFilters);
}

function bindSearch() {
  searchInput.value = getSearchQueryFromUrl();
  searchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      const query = searchInput.value.trim();
      const url = new URL(window.location.href);
      if (query) {
        url.searchParams.set("search", query);
      } else {
        url.searchParams.delete("search");
      }
      window.history.replaceState({}, "", url);
      applyFilters();
    }
  });
}

setupAuthHeader({
  loginLink: document.getElementById("login-link"),
  signupLink: document.getElementById("signup-link"),
  userMenu: document.getElementById("user-menu"),
  userMenuBtn: document.getElementById("user-menu-btn"),
  userDropdown: document.getElementById("user-dropdown"),
  userInitials: document.getElementById("user-initials"),
  dropdownUserName: document.getElementById("dropdown-user-name"),
  dropdownUserEmail: document.getElementById("dropdown-user-email"),
  dropdownAdminDashboardLink: document.getElementById(
    "dropdown-admin-dashboard-link",
  ),
  dropdownLogoutBtn: document.getElementById("dropdown-logout-btn"),
});
bindSearch();
bindCategoryFilter();
await loadCampaigns();
