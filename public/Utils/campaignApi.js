import API from "./baseApi.js";
import UserApi from "./userApi.js";

class CampaignAPI {
  async create(campaignData) {
    const campaigns = await API.get("/campaigns");
    const newCampaign = {
      ...campaignData,
      id: campaigns[campaigns.length - 1].id + 1,
      raised: 0,
      isApproved: false,
      createdAt: new Date().toISOString().split("T")[0],
    };
    return await API.post("/campaigns", newCampaign);
  }

  async getAll(filters = {}) {
    const campaigns = await API.get("/campaigns");
    const activeFilters = Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    );

    const filteredCampaigns =
      activeFilters.length === 0
        ? campaigns
        : campaigns.filter((campaign) =>
            activeFilters.every(([key, value]) => {
              if (Array.isArray(value)) {
                return value.includes(campaign[key]);
              }
              return campaign[key] === value;
            }),
          );

    const users = await UserApi.getAll();
    const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

    return filteredCampaigns.map((c) => ({
      ...c,
      creatorName: userMap[c.creatorId],
    }));
  }

  async getById(id) {
    return await API.get(`/campaigns/${id}`);
  }

  async update(id, data) {
    return await API.patch(`/campaigns/${id}`, data);
  }

  async approve(id) {
    return await API.patch(`/campaigns/${id}`, { isApproved: true });
  }

  async reject(id) {
    return await API.patch(`/campaigns/${id}`, { isApproved: false });
  }

  async delete(id) {
    return await API.delete(`/campaigns/${id}`);
  }
}

export default new CampaignAPI();
