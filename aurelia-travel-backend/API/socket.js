const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");

let io;
// Map to store active user connections: { userId: [socketId1, socketId2] }
const userSockets = new Map();

exports.init = (server) => {
  io = socketIo(server, {
    cors: {
      origin: "http://localhost:5173", // Your Frontend URL
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.use((socket, next) => {
    try {
      // ✅ Manually parse cookies from the handshake headers
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

      // Fallback if provided via auth payload
      if (!token) token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication error"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`⚡ Client connected: User ${socket.userId}`);

    // Store user socket
    const existing = userSockets.get(socket.userId) || [];
    userSockets.set(socket.userId, [...existing, socket.id]);

    socket.on("disconnect", () => {
      // Remove socket on disconnect
      const current = userSockets.get(socket.userId) || [];
      userSockets.set(socket.userId, current.filter(id => id !== socket.id));
    });
  });

  return io;
};

// Helper to push to a specific user
exports.notifyUser = (userId, notification) => {
  if (!io) return;
  
  // Ensure userId is integer if your map keys are integers
  const targetId = parseInt(userId);
  const socketIds = userSockets.get(targetId);
  
  if (socketIds && socketIds.length > 0) {
    socketIds.forEach(socketId => {
      io.to(socketId).emit("notification", notification);
    });
  }
};