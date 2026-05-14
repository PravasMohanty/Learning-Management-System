const Ticket = require("../models/Ticket");
const TicketReply = require("../models/TicketReply");
exports.createTicket = async (data, io) => {
  const ticket = await Ticket.create(data);
  io?.emit("ticket:new", ticket);
  return ticket;
};
exports.listTickets = (query) =>
  Ticket.find(query.status ? { status: query.status } : {})
    .populate("user assignedTo", "name email")
    .sort("-createdAt");
exports.getTicket = async (id) => ({
  ticket: await Ticket.findById(id).populate("user assignedTo", "name email"),
  replies: await TicketReply.find({ ticket: id })
    .populate("user", "name role avatar")
    .sort("createdAt"),
});
exports.reply = async (data, io) => {
  const reply = await TicketReply.create(data);
  io?.to(String(data.ticket)).emit("ticket:reply", reply);
  return reply;
};
exports.setStatus = async (id, status, io) => {
  const patch = { status };
  if (status === "resolved") patch.resolvedAt = new Date();
  if (status === "closed") patch.closedAt = new Date();
  const ticket = await Ticket.findByIdAndUpdate(id, patch, { new: true });
  io?.emit("ticket:updated", ticket);
  return ticket;
};
