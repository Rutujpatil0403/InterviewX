require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Import DB
const connectDB = require('./utils/db');

// Import routes
const userRoute = require('./routes/user.Routes');
const templateRoute = require('./routes/template.Routes');
const interviewRoute = require('./routes/interview.Routes');
const evaluationRoute = require('./routes/evaluation.Routes');
const feedbackRoute = require('./routes/feedback.Routes');
const analyticsRoute = require('./routes/analytics.Routes');
const notificationRoute = require('./routes/notification.Routes');
const aiInterviewRoute = require('./routes/aiInterview.Routes');
const chatRoute = require('./routes/chat.Routes');

const app = express();
const port = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// CORS origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://192.168.43.133:3000/',
  process.env.FRONTEND_URL
].filter(Boolean);

// Attach socket.io to HTTP server
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  },
  // Add ping timeout and interval for better connection handling
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middlewares
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(limiter);

// Routes
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
  });
});
app.use('/api/users', userRoute);
app.use('/api/templates', templateRoute);
app.use('/api/interviews', interviewRoute);
app.use('/api/evaluations', evaluationRoute);
app.use('/api/feedback', feedbackRoute);
app.use('/api/analytics', analyticsRoute);
app.use('/api/notifications', notificationRoute);
app.use('/api/ai-interviews', aiInterviewRoute);
app.use('/api/chat', chatRoute);

// =====================
// Socket.IO handlers
// =====================
const useridtosocketMapping = new Map();
const socketidtouseridMapping = new Map();
const roomParticipants = new Map(); // Track all participants in each room

io.on("connection", (socket) => {
  console.log(`⚡ Socket connected: ${socket.id}`);

  socket.on("join-room", (data) => {
    const { roomId, userId, userName } = data;
    console.log(`👤 ${userName} (${userId}) joining room: ${roomId}`);

    // Store bidirectional mappings
    useridtosocketMapping.set(userId, { socketId: socket.id, userName, roomId });
    socketidtouseridMapping.set(socket.id, userId);

    // Track room participants
    if (!roomParticipants.has(roomId)) {
      roomParticipants.set(roomId, new Set());
    }
    roomParticipants.get(roomId).add(userId);

    socket.join(roomId);

    // Get list of existing users in the room (excluding the joining user)
    const existingUsers = Array.from(roomParticipants.get(roomId))
      .filter(id => id !== userId)
      .map(id => {
        const info = useridtosocketMapping.get(id);
        return { userId: id, userName: info?.userName };
      });

    // Confirm joining to the user and send list of existing participants
    socket.emit("joined-room", { roomId, existingUsers });

    // Broadcast new user to others already in the room
    socket.broadcast.to(roomId).emit("User-joined", { userId, userName });

    console.log(`📊 Room ${roomId} now has ${roomParticipants.get(roomId).size} participants`);
  });

  socket.on("call-user", (data) => {
    const { toUserId, offer } = data;
    const fromUserId = socketidtouseridMapping.get(socket.id);
    const fromUserInfo = useridtosocketMapping.get(fromUserId);
    const toUserInfo = useridtosocketMapping.get(toUserId);

    console.log(`📞 Call from ${fromUserInfo?.userName} (${fromUserId}) to ${toUserInfo?.userName} (${toUserId})`);

    if (!toUserInfo) {
      console.error(`❌ User ${toUserId} not found`);
      socket.emit("call-error", { error: "User not found", toUserId });
      return;
    }

    if (!offer) {
      console.error(`❌ No offer provided`);
      socket.emit("call-error", { error: "No offer provided" });
      return;
    }

    // Forward the call with offer to the target user
    io.to(toUserInfo.socketId).emit("incoming-call", {
      fromUserId,
      fromUsername: fromUserInfo?.userName || "Unknown",
      offer
    });
  });

  socket.on("call-answer", (data) => {
    const { toUserId, answer } = data;
    const fromUserId = socketidtouseridMapping.get(socket.id);
    const fromUserInfo = useridtosocketMapping.get(fromUserId);
    const toUserInfo = useridtosocketMapping.get(toUserId);

    console.log(`✅ Answer from ${fromUserInfo?.userName} (${fromUserId}) to ${toUserInfo?.userName} (${toUserId})`);

    if (!toUserInfo) {
      console.error(`❌ User ${toUserId} not found`);
      socket.emit("call-error", { error: "User not found", toUserId });
      return;
    }

    if (!answer) {
      console.error(`❌ No answer provided`);
      socket.emit("call-error", { error: "No answer provided" });
      return;
    }

    // Forward the answer back to the caller
    io.to(toUserInfo.socketId).emit("call-answered", {
      fromUserId,
      fromUsername: fromUserInfo?.userName || "Unknown",
      answer
    });
  });

  socket.on("ice-candidate", (data) => {
    const { toUserId, candidate } = data;
    const fromUserId = socketidtouseridMapping.get(socket.id);
    const toUserInfo = useridtosocketMapping.get(toUserId);

    console.log(`🧊 ICE candidate from ${fromUserId} to ${toUserId}`);

    if (!toUserInfo) {
      console.error(`❌ User ${toUserId} not found for ICE candidate`);
      return;
    }

    if (!candidate) {
      console.error(`❌ No candidate provided`);
      return;
    }

    // Forward ICE candidate to the target peer
    io.to(toUserInfo.socketId).emit("ice-candidate", {
      fromUserId,
      candidate
    });
  });

  // Optional: Handle explicit leave-room event
  socket.on("leave-room", (data) => {
    const { roomId } = data;
    const userId = socketidtouseridMapping.get(socket.id);
    const userInfo = useridtosocketMapping.get(userId);

    if (userInfo && roomId) {
      console.log(`👋 ${userInfo.userName} leaving room: ${roomId}`);
      
      socket.leave(roomId);
      
      // Remove from room participants
      if (roomParticipants.has(roomId)) {
        roomParticipants.get(roomId).delete(userId);
        if (roomParticipants.get(roomId).size === 0) {
          roomParticipants.delete(roomId);
        }
      }

      // Notify others in the room
      socket.broadcast.to(roomId).emit("user-left-room", {
        userId,
        userName: userInfo.userName
      });
    }
  });

  socket.on("disconnect", () => {
    const userId = socketidtouseridMapping.get(socket.id);
    const userInfo = useridtosocketMapping.get(userId);

    if (userInfo) {
      console.log(`❌ ${userInfo.userName} (${userId}) disconnected`);

      // Notify others in the room
      if (userInfo.roomId) {
        socket.broadcast.to(userInfo.roomId).emit("user-disconnected", {
          userId,
          userName: userInfo.userName
        });

        // Remove from room participants
        if (roomParticipants.has(userInfo.roomId)) {
          roomParticipants.get(userInfo.roomId).delete(userId);
          if (roomParticipants.get(userInfo.roomId).size === 0) {
            roomParticipants.delete(userInfo.roomId);
            console.log(`🗑️  Room ${userInfo.roomId} is now empty`);
          }
        }
      }

      // Clean up mappings
      useridtosocketMapping.delete(userId);
      socketidtouseridMapping.delete(socket.id);
    }
  });

  // Handle socket errors
  socket.on("error", (error) => {
    console.error(`🔴 Socket error for ${socket.id}:`, error);
  });
});

// Helper functions
const sendNotificationToUser = (userId, notification) => {
  io.to(`notifications-${userId}`).emit('notification', {
    id: Date.now().toString(),
    ...notification,
    timestamp: new Date().toISOString(),
  });
};

const sendNotificationToUsers = (userIds, notification) => {
  userIds.forEach(userId => sendNotificationToUser(userId, notification));
};

// Get room info (useful for debugging)
const getRoomInfo = (roomId) => {
  const participants = roomParticipants.get(roomId);
  if (!participants) return null;
  
  return {
    roomId,
    participantCount: participants.size,
    participants: Array.from(participants).map(userId => {
      const info = useridtosocketMapping.get(userId);
      return { userId, userName: info?.userName, socketId: info?.socketId };
    })
  };
};

// Export io and helpers if needed
module.exports = { io, sendNotificationToUser, sendNotificationToUsers, getRoomInfo };

// Start server
(async () => {
  try {
    await connectDB();
    server.listen(port, () => {
      console.log(`🚀 Server running at http://localhost:${port}`);
      console.log(`🔌 Socket.IO ready for WebRTC signaling`);
    });
  } catch (err) {
    console.error("❌ Failed to connect to DB:", err.message);
    process.exit(1);
  }
})();