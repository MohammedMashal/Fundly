import SessionManager from "../Utils/sessionManager.js";
import CampaignAPI from "../Utils/campaignApi.js";

if (!SessionManager.isAuthenticated()) {
  window.location.href = "../login/login.html";
} else {
  boot();
}

function boot() {
  const currentUser = SessionManager.getUser();
  const form = document.getElementById("campaign-form");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const nextBtnLabel = document.getElementById("next-btn-label");
  const nextBtnArrow = document.querySelector(".btn-next-arrow");
  const imageFileInput = document.getElementById("image-file");
  const stepIndicator = document.getElementById("step-indicator");
  const errorMsg = document.getElementById("error-msg");
  const successMsg = document.getElementById("success-msg");

  const stepPanels = [...document.querySelectorAll(".step-panel")];
  const stepMarkers = [...document.querySelectorAll(".step-item")];

  let currentStep = 1;
  const TOTAL_STEPS = 4;

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }
        reject(new Error("Invalid image file."));
      };
      reader.onerror = () => reject(new Error("Failed to read selected image."));
      reader.readAsDataURL(file);
    });
  }

  function showMessage(type, text) {
    errorMsg.style.display = "none";
    successMsg.style.display = "none";

    if (!type || !text) {
      return;
    }

    if (type === "error") {
      errorMsg.textContent = text;
      errorMsg.style.display = "block";
    } else {
      successMsg.textContent = text;
      successMsg.style.display = "block";
    }
  }

  function updateReview() {
    document.getElementById("review-title").textContent =
      document.getElementById("campaign-title").value || "-";
    document.getElementById("review-category").textContent =
      document.getElementById("category").value || "-";

    const goal = Number(document.getElementById("goal").value || 0);
    document.getElementById("review-goal").textContent = goal
      ? `$${goal.toLocaleString()}`
      : "-";

    document.getElementById("review-deadline").textContent =
      document.getElementById("deadline").value || "-";
  }

  function updateWizardUI() {
    stepPanels.forEach((panel) => {
      panel.classList.toggle(
        "active",
        Number(panel.dataset.step) === currentStep,
      );
    });

    stepMarkers.forEach((marker) => {
      const markerStep = Number(marker.dataset.stepMarker);
      marker.classList.toggle("completed", markerStep < currentStep);
      marker.classList.toggle("active", markerStep === currentStep);
    });

    prevBtn.disabled = currentStep === 1;
    stepIndicator.textContent = `Step ${currentStep} of ${TOTAL_STEPS}`;

    const onLastStep = currentStep === TOTAL_STEPS;
    nextBtnLabel.textContent = onLastStep ? "Publish Campaign" : "Next";
    nextBtnArrow.style.display = onLastStep ? "none" : "inline";

    if (onLastStep) {
      updateReview();
    }
  }

  function validateStep(step) {
    const fieldsByStep = {
      1: ["campaign-title", "category", "description"],
      2: ["goal", "deadline"],
      3: ["image-file"],
      4: [],
    };

    const fields = fieldsByStep[step] || [];

    for (const fieldId of fields) {
      const el = document.getElementById(fieldId);
      if (!el) continue;

      if (!el.value || String(el.value).trim() === "") {
        el.focus();
        showMessage(
          "error",
          "Please complete all required fields before continuing.",
        );
        return false;
      }
    }

    if (step === 2) {
      const goal = Number(document.getElementById("goal").value);
      if (!Number.isFinite(goal) || goal <= 0) {
        showMessage(
          "error",
          "Funding goal must be a valid number greater than 0.",
        );
        return false;
      }

      const deadline = document.getElementById("deadline").value;
      if (new Date(deadline) <= new Date()) {
        showMessage("error", "Please choose a future deadline date.");
        return false;
      }
    }

    if (step === 3) {
      const imageFile = imageFileInput?.files?.[0];
      if (!imageFile) {
        showMessage(
          "error",
          "Please choose a campaign image before continuing.",
        );
        return false;
      }
    }

    return true;
  }

  async function submitCampaign() {
    const title = document.getElementById("campaign-title").value.trim();
    const shortDescription = document
      .getElementById("short-description")
      .value.trim();
    const longDescription = document.getElementById("description").value.trim();
    const category = document.getElementById("category").value;
    const goal = Number(document.getElementById("goal").value);
    const deadline = document.getElementById("deadline").value;
    const imageFile = imageFileInput?.files?.[0];

    const safeShortDescription =
      shortDescription || longDescription.slice(0, 140);
    const combinedDescription = `${safeShortDescription}\n\n${longDescription}`;

    if (!imageFile) {
      showMessage("error", "Please choose a campaign image before publishing.");
      currentStep = 3;
      updateWizardUI();
      return;
    }

    let imageDataUrl = "";
    try {
      imageDataUrl = await readFileAsDataUrl(imageFile);
    } catch (error) {
      showMessage("error", error.message || "Failed to process selected image.");
      return;
    }

    const payload = {
      title,
      description: combinedDescription,
      category,
      goal,
      deadline,
      image: imageDataUrl,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
    };

    nextBtn.disabled = true;
    prevBtn.disabled = true;
    nextBtnLabel.textContent = "Publishing...";
    nextBtnArrow.style.display = "none";

    try {
      await CampaignAPI.create(payload);
      showMessage(
        "success",
        "Campaign created successfully and submitted for admin approval.",
      );
      setTimeout(() => {
        window.location.href = "../User-dashboard/userDashboard.html";
      }, 1400);
    } catch (error) {
      showMessage("error", error.message || "Failed to create campaign.");
      nextBtn.disabled = false;
      prevBtn.disabled = false;
      nextBtnLabel.textContent = "Publish Campaign";
      nextBtnArrow.style.display = "none";
    }
  }

  prevBtn.addEventListener("click", () => {
    if (currentStep > 1) {
      currentStep -= 1;
      showMessage("", "");
      updateWizardUI();
    }
  });

  nextBtn.addEventListener("click", async () => {
    if (currentStep < TOTAL_STEPS) {
      if (!validateStep(currentStep)) return;
      showMessage("", "");
      currentStep += 1;
      updateWizardUI();
      return;
    }

    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;
    await submitCampaign();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
  });

  updateWizardUI();
}
