const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const initSockets = require("./sockets");
const PORT = process.env.PORT || 5000;
(async () => {
  await connectDB();
  const server = http.createServer(app);
  const io = initSockets(server);
  app.set("io", io);
  server.listen(PORT, () =>
    console.log("API running on http://localhost:" + PORT),
  );
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
