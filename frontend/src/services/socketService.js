


// services/SocketService.js
class SocketService {
  constructor(socket) {
    this.socket = socket;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // Join a room
  joinRoom(roomId, userId, userName) {

    console.log(`UserId : ${userId}   roomId : ${roomId} userName : ${userName}`)
    if (!this.socket) {
      console.error("❌ Socket is not initialized");
      return;
    }

    this.socket.emit("join-room", {
      roomId,
      userId,
      userName,
    });

    console.log(`📡 Emitted join-room -> roomId:${roomId}, userId:${userId}`);
  }

  // Leave a room
  leaveRoom(roomId, userId) {
    if (!this.socket) return;

    this.socket.emit("leave-room", { roomId, userId });
    console.log(`📡 Emitted leave-room -> roomId:${roomId}, userId:${userId}`);
  }
}

export default SocketService;
