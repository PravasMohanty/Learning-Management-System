const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/health", require("./routes/healthRouter"));

app.get("/", (req, res) => {
  res.send("API running");
});

module.exports = app;