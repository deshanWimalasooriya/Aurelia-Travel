const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

// ✅ Added your working Redis Labs configuration here!
const redisConfig = {
    username: 'default',
    password: 'OTTHFaLuIOjMNgaBw9bkJfOvlhVX0rJj',
    socket: {
        host: 'redis-11990.c14.us-east-1-3.ec2.cloud.redislabs.com',
        port: 11990
    }
};

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

        try {
            // ✅ Pass the configuration to the clients!
            const pubClient = createClient(redisConfig);
            const subClient = pubClient.duplicate();

            await Promise.all([pubClient.connect(), subClient.connect()]);
            
            io.adapter(createAdapter(pubClient, subClient));
            console.log("✅ Socket.io Redis Adapter Connected (With Auth)!");

        } catch (error) {
            console.error("❌ Redis Adapter Error:", error.message);
            console.log("⚠️ Falling back to local memory adapter.");
        }

        io.on("connection", (socket) => {
            // ... your existing socket connection logic ...
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