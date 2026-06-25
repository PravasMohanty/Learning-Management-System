const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const http = require("http");
const app = require("./app");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check available at http://localhost:${PORT}/api/health`);
    });

    process.on("unhandledRejection", (err) => {
      console.error("Unhandled Rejection:", err);
      process.exit(1);
    });

    process.on("uncaughtException", (err) => {
      console.error("Uncaught Exception:", err);
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();