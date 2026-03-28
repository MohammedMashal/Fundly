import API from "./baseApi.js";
let bcrypt = dcodeIO.bcrypt;

class UserAPI {
  async signin(email, password) {
    const user = await this.getByEmail(email);
    if (user.length === 0) throw new Error("Wrong email or password!");
    if (!(await bcrypt.compare(password, user[0].password)))
      throw new Error("Wrong email or password!");
    if (!user[0].isActive) throw new Error("Sorry, Your account is suspended!");
    return user[0];
  }

  async signup(name, email, password) {
    const users = await this.getAll();
    if (users.some((u) => u.email === email))
      throw new Error("This email already exist");

    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = {
      name,
      email,
      password: hashPassword,
      role: "user",
      isActive: true,
      createdAt: new Date().toISOString().split("T")[0],
    };
    return await API.post("/users", newUser);
  }

  async getAll() {
    return await API.get("/users");
  }

  async getById(id) {
    return await API.get(`/users/${id}`);
  }

  async getByEmail(email) {
    return await API.get(`/users?email=${email}`);
  }

  async update(id, data) {
    return await API.patch(`/users/${id}`, data);
  }

  async banUser(userId) {
    return await API.patch(`/users/${userId}`, { isActive: false });
  }

  async unbanUser(userId) {
    return await API.patch(`/users/${userId}`, { isActive: true });
  }
}

export default new UserAPI();
