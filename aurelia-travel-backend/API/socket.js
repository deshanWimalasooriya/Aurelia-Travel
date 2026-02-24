const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

let io;

module.exports = {
    init: async (httpServer) => {
        io = new Server(httpServer, {
            cors: {
                origin: "http://localhost:5173", // Your React frontend
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        try {
            // 1. Create Pub/Sub clients for the adapter
            const pubClient = createClient();
            const subClient = pubClient.duplicate();

            await Promise.all([pubClient.connect(), subClient.connect()]);
            
            // 2. Attach the Redis adapter to Socket.io
            io.adapter(createAdapter(pubClient, subClient));
            console.log("✅ Socket.io Redis Adapter Connected!");

        } catch (error) {
            console.error("❌ Redis Adapter Error:", error.message);
            console.log("⚠️ Falling back to local memory adapter.");
        }

        io.on("connection", (socket) => {
            console.log(`⚡ New client connected: ${socket.id}`);

            // 3. THE INDUSTRY FIX: Use Rooms instead of a local Map()
            socket.on("register_user", (userId) => {
                if (userId) {
                    const roomName = userId.toString();
                    socket.join(roomName);
                    console.log(`👤 User ${userId} joined personal room: ${roomName}`);
                }
            });

            // Handling a chat message
            socket.on("send_message", (data) => {
                io.to(data.receiverId.toString()).emit("receive_message", data);
            });

            // Handling a notification
            socket.on("send_notification", (data) => {
                io.to(data.userId.toString()).emit("new_notification", data);
            });

            socket.on("disconnect", () => {
                console.log(`❌ Client disconnected: ${socket.id}`);
            });
        });

        return io;
    },
    
    getIO: () => {
        if (!io) {
            throw new Error("Socket.io not initialized!");
        }
        return io;
    }
};