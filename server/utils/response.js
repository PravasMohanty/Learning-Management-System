class ApiResponse {
  constructor(statusCode, message, data = null, meta = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    if (data) this.data = data;
    if (meta) this.meta = meta;
  }
}

module.exports = ApiResponse;
