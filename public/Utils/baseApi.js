const API_BASE = "http://localhost:3000";

class API {
  async get(endpoint) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`);
      if (!response.ok) throw new Error(response.status);
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async post(endpoint, data) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(response.status);
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async patch(endpoint, data) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(response.status);
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async delete(endpoint) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(response.status);
      return await response.json();
    } catch (error) {
      throw error;
    }
  }
}

export default new API();
