const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");

let io;
const userSockets = new Map();

exports.init = (server) => {
  io = socketIo(server, {
    cors: {
      origin: "http://localhost:5173", 
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.use((socket, next) => {
    try {
      const cookieString = socket.handshake.headers.cookie;
      let token = null;

      if (cookieString) {
        const cookies = cookieString.split(';').reduce((res, c) => {
          const [key, val] = c.trim().split('=');
          res[key] = val;
          return res;
        }, {});
        token = cookies.token;
      }

      if (!token) token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication error"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      // ✅ FIX: Force strict integer mapping
      socket.userId = parseInt(decoded.userId, 10); 
      next();
    } catch (err) {
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const uid = socket.userId;
    const existing = userSockets.get(uid) || [];
    userSockets.set(uid, [...existing, socket.id]);

    socket.on("disconnect", () => {
      const current = userSockets.get(uid) || [];
      userSockets.set(uid, current.filter(id => id !== socket.id));
    });
  });

  return io;
};

exports.notifyUser = (userId, notification) => {
  if (!io) return;
  const targetId = parseInt(userId, 10);
  const socketIds = userSockets.get(targetId);
  if (socketIds && socketIds.length > 0) {
    socketIds.forEach(socketId => io.to(socketId).emit("notification", notification));
  }
};

exports.emitToUser = (userId, event, payload) => {
  if (!io) return;
  const targetId = parseInt(userId, 10);
  const socketIds = userSockets.get(targetId);
  if (socketIds && socketIds.length > 0) {
    socketIds.forEach(socketId => io.to(socketId).emit(event, payload));
  }
};