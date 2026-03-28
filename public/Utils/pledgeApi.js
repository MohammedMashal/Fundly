import API from "./baseApi.js";
import CampaignAPI from "./campaignApi.js";

class PledgeAPI {
  async getAll() {
    return await API.get("/pledges");
  }

  async create(campaignId, userId, amount) {
    const pledges = await API.get("/pledges");
    const newPledge = {
      id: pledges[pledges.length - 1].id + 1,
      campaignId,
      userId,
      amount,
      createdAt: new Date().toISOString().split("T")[0],
    };
    const pledge = await API.post("/pledges", newPledge);

    const campaign = await CampaignAPI.getById(campaignId);
    await CampaignAPI.update(campaignId, {
      raised: campaign.raised + amount,
    });

    return pledge;
  }

  async getByUserId(userId) {
    return await API.get(`/pledges?userId=${userId}`);
  }

  async getByCampaignId(campaignId) {
    return await API.get(`/pledges?campaignId=${campaignId}`);
  }
}

export default new PledgeAPI();
