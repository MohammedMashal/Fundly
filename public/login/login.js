import UserAPI from "../Utils/userApi.js";
import SessionManager from "../Utils/sessionManager.js";

if (SessionManager.isAuthenticated()) {
  window.location.href = "../index.html";
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("error-message");
  const submitBtn = document.getElementById("submit-btn");

  submitBtn.disabled = true;
  submitBtn.textContent = "Signing in...";

  try {
    const user = await UserAPI.signin(email, password);
    user.password = undefined;
    SessionManager.setUser(user);

    window.location.href = "../index.html";
  } catch (error) {
    errorMsg.style.display = "block";
    errorMsg.textContent = error.message;
    submitBtn.disabled = false;
    submitBtn.textContent = "Sign in";
  }
});
