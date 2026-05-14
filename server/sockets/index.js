const { Server } = require("socket.io");
const jwt = require("../utils/jwt");
function initSockets(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL?.split(",") || "*",
      credentials: true,
    },
  });
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (token) {
        const payload = jwt.verifyAccessToken(token);
        socket.user = payload;
        socket.join(payload.sub);
      }
      next();
    } catch (err) {
      next();
    }
  });
  io.on("connection", (socket) => {
    socket.on("ticket:join", (id) => socket.join(String(id)));
    socket.on("course:join", (id) => socket.join("course:" + id));
    socket.on("inbox:join", () => socket.join("whatsapp:inbox"));
  });
  return io;
}
module.exports = initSockets;
