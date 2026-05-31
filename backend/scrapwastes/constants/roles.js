const ROLES = Object.freeze({
  ADMIN: "admin",
  INSTRUCTOR: "instructor",
  STUDENT: "student",
  SUPPORT: "support_agent",
});
const TICKET_STATUS = Object.freeze({
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
  CLOSED: "closed",
});
const CAMPAIGN_STATUS = Object.freeze({
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
});
module.exports = { ROLES, TICKET_STATUS, CAMPAIGN_STATUS };
