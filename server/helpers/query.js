exports.pageParams = (query) => ({
  page: Math.max(parseInt(query.page || "1", 10), 1),
  limit: Math.min(Math.max(parseInt(query.limit || "20", 10), 1), 100),
});
exports.searchRegex = (value) =>
  value
    ? new RegExp(String(value).replace(/[.*+?^$%{}()|[\]\\]/g, "\\$&"), "i")
    : null;
