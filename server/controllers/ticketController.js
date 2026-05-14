const Ticket = require("../models/Ticket");
const TicketReply = require("../models/TicketReply");
const ApiError = require("../utils/ApiError");
const { pageParams } = require("../helpers/query");
const logger = require("../config/logger");

exports.createTicket = async (studentId, data) => {
  const ticket = await Ticket.create({
    student: studentId,
    subject: data.subject,
    description: data.description,
    priority: data.priority || "medium",
    category: data.category,
    status: "open",
  });

  logger.info("Ticket created", { ticketId: ticket._id, studentId });

  return ticket;
};

exports.listTickets = async (query) => {
  const { page, limit } = pageParams(query);
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.student) filter.student = query.student;
  if (query.assignedTo) filter.assignedTo = query.assignedTo;

  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .populate("student", "name email")
      .populate("assignedTo", "name")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(limit),
    Ticket.countDocuments(filter),
  ]);

  return { items: tickets, total, page, limit };
};

exports.getTicketDetail = async (ticketId) => {
  const [ticket, replies] = await Promise.all([
    Ticket.findById(ticketId).populate("student", "name email").populate("assignedTo", "name"),
    TicketReply.find({ ticket: ticketId }).populate("author", "name avatar").sort("createdAt"),
  ]);

  if (!ticket) throw new ApiError(404, "Ticket not found");

  return { ...ticket.toObject(), replies };
};

exports.updateTicketStatus = async (ticketId, status, userId) => {
  const ticket = await Ticket.findByIdAndUpdate(ticketId, { status }, { new: true });
  if (!ticket) throw new ApiError(404, "Ticket not found");

  logger.info("Ticket status updated", { ticketId, newStatus: status, updatedBy: userId });

  return ticket;
};

exports.assignTicket = async (ticketId, agentId) => {
  const ticket = await Ticket.findByIdAndUpdate(ticketId, { assignedTo: agentId }, { new: true });
  if (!ticket) throw new ApiError(404, "Ticket not found");

  logger.info("Ticket assigned", { ticketId, assignedTo: agentId });

  return ticket;
};

exports.addTicketReply = async (ticketId, authorId, reply) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw new ApiError(404, "Ticket not found");

  const ticketReply = await TicketReply.create({
    ticket: ticketId,
    author: authorId,
    message: reply,
  });

  logger.info("Ticket reply added", { replyId: ticketReply._id, ticketId });

  return ticketReply;
};

exports.closeTicket = async (ticketId) => {
  const ticket = await Ticket.findByIdAndUpdate(ticketId, { status: "closed", closedAt: new Date() }, { new: true });
  if (!ticket) throw new ApiError(404, "Ticket not found");

  logger.info("Ticket closed", { ticketId });

  return ticket;
};
