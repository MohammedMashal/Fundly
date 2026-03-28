class SessionManager {
   setUser(user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
  }

   getUser() {
    const user = localStorage.getItem("currentUser");
    return user ? JSON.parse(user) : null;
  }

   isAuthenticated() {
    return this.getUser() !== null;
  }

   logout() {
    localStorage.removeItem("currentUser");
  }
}
export default new SessionManager();
