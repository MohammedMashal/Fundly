import SessionManager from "./sessionManager.js";

export const getInitials = (name) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

export const setupAuthHeader = ({
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
}) => {
  const user = SessionManager.getUser();
  if (!user) return;

  loginLink?.classList.add("hidden");
  signupLink?.classList.add("hidden");
  userMenu.classList.remove("hidden");

  userInitials.textContent = getInitials(user.name);
  dropdownUserName.textContent = user.name;
  dropdownUserEmail.textContent = user.email;

  if (user.role === "admin")
    dropdownAdminDashboardLink.classList.remove("hidden");
  else dropdownAdminDashboardLink.classList.add("hidden");

  userMenuBtn.addEventListener("click", () => {
    userDropdown.classList.toggle("hidden");
  });

  dropdownLogoutBtn.addEventListener("click", () => {
    SessionManager.logout();
    window.location.href = "../login/login.html";
  });
};

export const calculateDaysLeft = (deadline) => {
  const daysLeft = Math.ceil(
    (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24),
  );
  return daysLeft > 0 ? daysLeft : 0;
};

export const createCampaignCard = (campaign) => {
  const raised = Number(campaign.raised);
  const goal = Number(campaign.goal);
  const percentage = goal > 0 ? Math.round((raised / goal) * 100) : 0;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  const imageSrc = campaign.image;

  const card = document.createElement("article");
  card.className = "campaign-tile";

  const daysMarkup = `<span>${calculateDaysLeft(campaign.deadline)} days left</span>`;

  card.innerHTML = `
    <div class="tile-media">
      <img alt="${campaign.title}" src="${imageSrc}" />
    </div>
    <div class="tile-body">
      <h3>${campaign.title}</h3>
      <p class="tile-sector">${campaign.category}</p>
      <p class="tile-text">${campaign.description}</p>
      <div class="tile-progress">
        <progress value="${clampedPercentage}" max="100"></progress>
        <div class="progress-text">
          <span>$${raised.toLocaleString()} of $${goal.toLocaleString()}</span>
          <span>${clampedPercentage}%</span>
        </div>
      </div>
      <div class="tile-footer">
        ${daysMarkup}
        <a href="../Campaign-Details/campaignDetails.html?id=${campaign.id}" class="btn-primary">View Details</a>
      </div>
    </div>
  `;

  return card;
};
