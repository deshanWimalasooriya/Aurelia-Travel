const { Server } = require("socket.io");

let io;

module.exports = {
    init: async (httpServer) => {
        io = new Server(httpServer, {
            cors: {
                origin: "http://localhost:5173", 
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        console.log("✅ Socket.io Connected (In-Memory Local Adapter)");

        io.on("connection", (socket) => {
            socket.on("register_user", (userId) => {
                if (userId) {
                    const roomName = userId.toString();
                    socket.join(roomName);
                }
            });

            socket.on("send_message", (data) => {
                io.to(data.receiverId.toString()).emit("receive_message", data);
            });

            socket.on("send_notification", (data) => {
                io.to(data.userId.toString()).emit("new_notification", data);
            });
        });

        return io;
    },
    getIO: () => {
        if (!io) throw new Error("Socket.io not initialized!");
        return io;
    }
};