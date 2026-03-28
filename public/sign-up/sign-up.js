import UserAPI from "../Utils/userApi.js";
import SessionManager from "../Utils/sessionManager.js";

if (SessionManager.isAuthenticated()) {
  window.location.href = "../index.html";
}

document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("fullName").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const errorMsg = document.getElementById("error-message");
  const submitBtn = document.getElementById("submit-btn");

  if (password !== confirmPassword) {
    errorMsg.style.display = "block";
    errorMsg.textContent = "Passwords do not match";
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Creating account...";

  try {
    const user = await UserAPI.signup(name, email, password);
    user.password = undefined;
    SessionManager.setUser(user);
    window.location.href = "../index.html";
  } catch (error) {
    errorMsg.style.display = "block";
    errorMsg.textContent = error.message;
    submitBtn.disabled = false;
    submitBtn.textContent = "Create account";
  }
});
