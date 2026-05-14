const { parse } = require("csv-parse/sync");
const Lead = require("../models/Lead");
const Campaign = require("../models/Campaign");
const WhatsAppMessage = require("../models/WhatsAppMessage");
exports.importLeads = async (buffer, user) => {
  const rows = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  const report = { total: rows.length, created: 0, skipped: 0, errors: [] };
  for (const [i, row] of rows.entries()) {
    try {
      if (!row.phone) {
        report.skipped++;
        report.errors.push({ row: i + 2, error: "phone is required" });
        continue;
      }
      const exists = await Lead.findOne({ phone: row.phone });
      if (exists) {
        report.skipped++;
        continue;
      }
      await Lead.create({
        name: row.name,
        phone: row.phone,
        email: row.email,
        tags: row.tags?.split("|").filter(Boolean),
        source: "csv",
        importedBy: user,
      });
      report.created++;
    } catch (err) {
      report.skipped++;
      report.errors.push({ row: i + 2, error: err.message });
    }
  }
  return report;
};
exports.createCampaign = (data) => Campaign.create(data);
exports.listCampaigns = () => Campaign.find().sort("-createdAt");
exports.sendCampaign = async (id, io) => {
  const campaign = await Campaign.findById(id).populate("leads");
  campaign.status = "running";
  campaign.stats.queued = campaign.leads.length;
  await campaign.save();
  for (const lead of campaign.leads) {
    await WhatsAppMessage.create({
      lead: lead._id,
      campaign: campaign._id,
      direction: "outbound",
      to: lead.phone,
      body: campaign.messageTemplate,
      status: "sent",
    });
    campaign.stats.sent++;
  }
  campaign.status = "completed";
  campaign.sentAt = new Date();
  await campaign.save();
  io?.emit("whatsapp:campaign:updated", campaign);
  return campaign;
};
exports.webhook = async (payload, io) => {
  const phone = payload.from || payload.phone;
  const lead = phone
    ? await Lead.findOneAndUpdate(
        { phone },
        { $setOnInsert: { phone, source: "whatsapp" } },
        { upsert: true, new: true },
      )
    : null;
  const msg = await WhatsAppMessage.create({
    lead: lead?._id,
    direction: "inbound",
    from: phone,
    to: payload.to,
    body: payload.text || payload.body,
    status: "received",
    providerMessageId: payload.id,
    raw: payload,
  });
  io?.emit("whatsapp:inbox:new", msg);
  return msg;
};
exports.analytics = async () => ({
  leads: await Lead.countDocuments(),
  campaigns: await Campaign.countDocuments(),
  messages: await WhatsAppMessage.countDocuments(),
  unread: await WhatsAppMessage.countDocuments({
    direction: "inbound",
    assignedTo: null,
  }),
});
