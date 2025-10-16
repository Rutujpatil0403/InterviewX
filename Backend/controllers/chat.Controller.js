const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;

// Import models
const User = require('../models/User');
const Interview = require('../models/Interview');
const ChatMessage = require('../models/ChatMessage');

// Import utilities
const AppError = require('../utils/AppError');

// ===========================================================================================================================
// ================================================ Chat Controller ==========================================================
// ===========================================================================================================================

class ChatController {

  // ===========================================================================================================================
  // -------------------------------------------------- Core Chat Operations --------------------------------------------------
  // ===========================================================================================================================

  /**
   * @desc    Send chat message in interview room
   * @route   POST /api/chat/rooms/:id/messages
   * @access  Private (Room participants only)
   */
  sendMessage = asyncHandler(async (req, res) => {
    const { id: roomId } = req.params;
    const { message, messageType = 'text', replyToId = null, metadata = {} } = req.body;

    // Validate room exists and user has access
    const room = await this.validateRoomAccess(roomId, req.user.userId);

    // Check if user is muted
    const participant = room.participants.find(p => p.userId.toString() === req.user.userId);
    if (participant && participant.isMuted) {
      throw new AppError('You are muted in this chat room', 403);
    }

    // Create message object
    const newMessage = {
      _id: new mongoose.Types.ObjectId(),
      senderId: req.user.userId,
      senderName: req.user.name,
      senderRole: req.user.role,
      message: message.trim(),
      messageType,
      replyToId,
      timestamp: new Date(),
      isEdited: false,
      editHistory: [],
      readBy: [{ userId: req.user.userId, readAt: new Date() }],
      reactions: [],
      metadata
    };

    // Add message to room
    room.messages.push(newMessage);
    room.lastActivity = new Date();
    room.messageCount = (room.messageCount || 0) + 1;
    await room.save();

    // Broadcast to all room participants (would integrate with Socket.IO)
    await this.broadcastToRoom(roomId, 'new_message', {
      messageId: newMessage._id,
      senderId: newMessage.senderId,
      senderName: newMessage.senderName,
      senderRole: newMessage.senderRole,
      message: newMessage.message,
      messageType: newMessage.messageType,
      timestamp: newMessage.timestamp,
      replyToId,
      metadata
    });

    // Update user's last seen
    await this.updateUserLastSeen(roomId, req.user.userId);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        messageId: newMessage._id,
        timestamp: newMessage.timestamp,
        roomId,
        message: newMessage.message,
        messageType: newMessage.messageType
      }
    });
  });

  /**
   * @desc    Get chat message history with pagination
   * @route   GET /api/chat/rooms/:id/messages
   * @access  Private (Room participants only)
   */
  getMessageHistory = asyncHandler(async (req, res) => {
    const { id: roomId } = req.params;
    const { 
      page = 1, 
      limit = 50, 
      before = null, 
      after = null,
      messageType = null,
      senderId = null 
    } = req.query;

    // Validate room access
    const room = await this.validateRoomAccess(roomId, req.user.userId);

    // Build message filter
    let messageFilter = {};
    if (before) messageFilter.timestamp = { $lt: new Date(before) };
    if (after) messageFilter.timestamp = { $gt: new Date(after) };
    if (messageType) messageFilter.messageType = messageType;
    if (senderId) messageFilter.senderId = senderId;

    // Get messages with pagination
    const messages = room.messages
      .filter(msg => {
        if (messageType && msg.messageType !== messageType) return false;
        if (senderId && msg.senderId.toString() !== senderId) return false;
        if (before && msg.timestamp >= new Date(before)) return false;
        if (after && msg.timestamp <= new Date(after)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice((page - 1) * limit, page * limit);

    // Mark messages as read
    await this.markMessagesAsRead(roomId, req.user.userId);

    // Get participant info for context
    const participants = room.participants.map(p => ({
      userId: p.userId,
      name: p.name,
      role: p.role,
      isOnline: p.isOnline,
      lastSeen: p.lastSeen
    }));

    res.status(200).json({
      success: true,
      message: 'Message history retrieved successfully',
      data: {
        messages: messages.reverse(), // Return in chronological order
        pagination: {
          currentPage: parseInt(page),
          totalMessages: room.messages.length,
          hasMore: room.messages.length > page * limit
        },
        roomInfo: {
          roomId: room._id,
          roomName: room.roomName,
          roomType: room.roomType,
          createdAt: room.createdAt,
          lastActivity: room.lastActivity,
          messageCount: room.messageCount
        },
        participants
      }
    });
  });

  /**
   * @desc    Delete chat message
   * @route   DELETE /api/chat/messages/:messageId
   * @access  Private (Message sender or Admin/Recruiter)
   */
  deleteMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { deleteForEveryone = false } = req.body;

    // Find the room containing this message
    const room = await this.findRoomByMessageId(messageId);
    if (!room) {
      throw new AppError('Message not found', 404);
    }

    // Validate room access
    await this.validateRoomAccess(room._id, req.user.userId);

    // Find the message
    const messageIndex = room.messages.findIndex(msg => msg._id.toString() === messageId);
    if (messageIndex === -1) {
      throw new AppError('Message not found', 404);
    }

    const message = room.messages[messageIndex];

    // Check permissions
    const isMessageSender = message.senderId.toString() === req.user.userId;
    const isModerator = ['Admin', 'Recruiter'].includes(req.user.role);

    if (!isMessageSender && !isModerator) {
      throw new AppError('Not authorized to delete this message', 403);
    }

    // Delete message based on type
    if (deleteForEveryone && isModerator) {
      // Complete removal for moderators
      room.messages.splice(messageIndex, 1);
      room.messageCount = Math.max(0, (room.messageCount || 0) - 1);
    } else {
      // Soft delete - replace content but keep structure
      message.message = '[Message deleted]';
      message.isDeleted = true;
      message.deletedAt = new Date();
      message.deletedBy = req.user.userId;
      message.metadata = { ...message.metadata, originalMessageType: message.messageType };
      message.messageType = 'deleted';
    }

    room.lastActivity = new Date();
    await room.save();

    // Broadcast deletion
    await this.broadcastToRoom(room._id, 'message_deleted', {
      messageId,
      deletedBy: req.user.userId,
      deleteType: deleteForEveryone ? 'complete' : 'soft'
    });

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
      data: {
        messageId,
        deleteType: deleteForEveryone ? 'complete' : 'soft',
        deletedAt: new Date()
      }
    });
  });

  /**
   * @desc    Edit existing message
   * @route   PUT /api/chat/messages/:messageId
   * @access  Private (Message sender only, within time limit)
   */
  editMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { newMessage, editReason = null } = req.body;

    // Find the room containing this message
    const room = await this.findRoomByMessageId(messageId);
    if (!room) {
      throw new AppError('Message not found', 404);
    }

    // Validate room access
    await this.validateRoomAccess(room._id, req.user.userId);

    // Find the message
    const message = room.messages.find(msg => msg._id.toString() === messageId);
    if (!message) {
      throw new AppError('Message not found', 404);
    }

    // Check if user owns the message
    if (message.senderId.toString() !== req.user.userId) {
      throw new AppError('You can only edit your own messages', 403);
    }

    // Check if message is too old to edit (15 minutes limit)
    const editTimeLimit = 15 * 60 * 1000; // 15 minutes in milliseconds
    const timeSinceMessage = new Date() - new Date(message.timestamp);
    if (timeSinceMessage > editTimeLimit) {
      throw new AppError('Message is too old to edit (15 minute limit)', 400);
    }

    // Check if message was already deleted
    if (message.isDeleted) {
      throw new AppError('Cannot edit deleted message', 400);
    }

    // Store edit history
    if (!message.editHistory) message.editHistory = [];
    message.editHistory.push({
      previousMessage: message.message,
      editedAt: new Date(),
      editReason
    });

    // Update message
    const originalMessage = message.message;
    message.message = newMessage.trim();
    message.isEdited = true;
    message.lastEditedAt = new Date();

    room.lastActivity = new Date();
    await room.save();

    // Broadcast edit
    await this.broadcastToRoom(room._id, 'message_edited', {
      messageId,
      newMessage: message.message,
      isEdited: true,
      lastEditedAt: message.lastEditedAt,
      editedBy: req.user.userId
    });

    res.status(200).json({
      success: true,
      message: 'Message edited successfully',
      data: {
        messageId,
        originalMessage,
        newMessage: message.message,
        isEdited: true,
        lastEditedAt: message.lastEditedAt,
        editHistory: message.editHistory
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Room Management -------------------------------------------------------
  // ===========================================================================================================================

  /**
   * @desc    Create chat room for interview
   * @route   POST /api/chat/rooms
   * @access  Private (Admin/Recruiter only)
   */
  createChatRoom = asyncHandler(async (req, res) => {
    const { 
      interviewId, 
      roomName, 
      roomType = 'interview',
      participants = [],
      settings = {} 
    } = req.body;

    // Only admin and recruiters can create rooms
    if (!['Admin', 'Recruiter'].includes(req.user.role)) {
      throw new AppError('Not authorized to create chat rooms', 403);
    }

    // Validate interview exists if provided
    let interview = null;
    if (interviewId) {
      interview = await Interview.findById(interviewId);
      if (!interview) {
        throw new AppError('Interview not found', 404);
      }
    }

    // Validate participants exist
    const participantUsers = await User.find({ 
      _id: { $in: participants } 
    }).select('_id name email role');

    if (participantUsers.length !== participants.length) {
      throw new AppError('Some participants not found', 400);
    }

    // Create room object (this would be stored in a ChatRoom model)
    const roomData = {
      _id: new mongoose.Types.ObjectId(),
      roomName: roomName || `Interview Chat - ${interview?.candidateId || 'General'}`,
      roomType,
      interviewId,
      createdBy: req.user.userId,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true,
      participants: [
        // Always include room creator
        {
          userId: req.user.userId,
          name: req.user.name,
          role: req.user.role,
          joinedAt: new Date(),
          isOnline: true,
          isMuted: false,
          isModerator: true,
          lastSeen: new Date()
        },
        // Add other participants
        ...participantUsers.filter(p => p._id.toString() !== req.user.userId).map(participant => ({
          userId: participant._id,
          name: participant.name,
          role: participant.role,
          joinedAt: new Date(),
          isOnline: false,
          isMuted: false,
          isModerator: participant.role === 'Admin',
          lastSeen: null
        }))
      ],
      messages: [],
      messageCount: 0,
      settings: {
        allowFileSharing: settings.allowFileSharing !== false,
        allowVoiceMessages: settings.allowVoiceMessages !== false,
        moderationEnabled: settings.moderationEnabled !== false,
        maxParticipants: settings.maxParticipants || 10,
        messageRetentionDays: settings.messageRetentionDays || 30,
        ...settings
      },
      metadata: {
        interviewDate: interview?.interviewDate,
        candidateId: interview?.candidateId,
        recruiterId: interview?.recruiterId
      }
    };

    // Store room (this would save to ChatRoom collection)
    await this.saveChatRoom(roomData);

    // Send welcome message
    await this.sendSystemMessage(roomData._id, `Chat room "${roomData.roomName}" has been created. Welcome to the conversation!`);

    // Notify participants
    await this.notifyParticipants(roomData._id, 'room_created', {
      roomId: roomData._id,
      roomName: roomData.roomName,
      createdBy: req.user.name
    });

    res.status(201).json({
      success: true,
      message: 'Chat room created successfully',
      data: {
        roomId: roomData._id,
        roomName: roomData.roomName,
        roomType: roomData.roomType,
        interviewId: roomData.interviewId,
        participants: roomData.participants.map(p => ({
          userId: p.userId,
          name: p.name,
          role: p.role,
          isModerator: p.isModerator
        })),
        settings: roomData.settings,
        createdAt: roomData.createdAt
      }
    });
  });

  /**
   * @desc    Join existing chat room
   * @route   POST /api/chat/rooms/:id/join
   * @access  Private (Authorized participants only)
   */
  joinChatRoom = asyncHandler(async (req, res) => {
    const { id: roomId } = req.params;

    // Get room
    const room = await this.getChatRoom(roomId);
    if (!room) {
      throw new AppError('Chat room not found', 404);
    }

    // Check if room is active
    if (!room.isActive) {
      throw new AppError('Chat room is no longer active', 400);
    }

    // Check if user is already in the room
    const existingParticipant = room.participants.find(p => p.userId.toString() === req.user.userId);
    
    if (existingParticipant) {
      // User rejoining - update online status
      existingParticipant.isOnline = true;
      existingParticipant.lastSeen = new Date();
    } else {
      // Check if user is authorized to join
      const canJoin = await this.checkJoinPermission(room, req.user);
      if (!canJoin) {
        throw new AppError('Not authorized to join this chat room', 403);
      }

      // Check room capacity
      if (room.participants.length >= room.settings.maxParticipants) {
        throw new AppError('Chat room is at maximum capacity', 400);
      }

      // Add user to room
      room.participants.push({
        userId: req.user.userId,
        name: req.user.name,
        role: req.user.role,
        joinedAt: new Date(),
        isOnline: true,
        isMuted: false,
        isModerator: req.user.role === 'Admin',
        lastSeen: new Date()
      });
    }

    room.lastActivity = new Date();
    await this.saveChatRoom(room);

    // Send system message about user joining
    if (!existingParticipant) {
      await this.sendSystemMessage(roomId, `${req.user.name} joined the conversation`);
    }

    // Broadcast user join/rejoin
    await this.broadcastToRoom(roomId, existingParticipant ? 'user_online' : 'user_joined', {
      userId: req.user.userId,
      name: req.user.name,
      role: req.user.role,
      timestamp: new Date()
    });

    // Get recent messages for the joining user
    const recentMessages = room.messages
      .slice(-20) // Last 20 messages
      .map(msg => ({
        messageId: msg._id,
        senderId: msg.senderId,
        senderName: msg.senderName,
        message: msg.message,
        messageType: msg.messageType,
        timestamp: msg.timestamp,
        isEdited: msg.isEdited
      }));

    res.status(200).json({
      success: true,
      message: existingParticipant ? 'Rejoined chat room successfully' : 'Joined chat room successfully',
      data: {
        roomId: room._id,
        roomName: room.roomName,
        roomType: room.roomType,
        participants: room.participants.filter(p => p.isOnline).map(p => ({
          userId: p.userId,
          name: p.name,
          role: p.role,
          isOnline: p.isOnline,
          isModerator: p.isModerator
        })),
        recentMessages,
        settings: room.settings
      }
    });
  });

  /**
   * @desc    Leave chat room
   * @route   POST /api/chat/rooms/:id/leave
   * @access  Private (Room participants only)
   */
  leaveChatRoom = asyncHandler(async (req, res) => {
    const { id: roomId } = req.params;
    const { leaveType = 'temporary' } = req.body; // 'temporary' or 'permanent'

    // Validate room access
    const room = await this.validateRoomAccess(roomId, req.user.userId);

    // Find participant
    const participant = room.participants.find(p => p.userId.toString() === req.user.userId);
    if (!participant) {
      throw new AppError('You are not a participant in this room', 400);
    }

    if (leaveType === 'permanent') {
      // Remove participant completely
      room.participants = room.participants.filter(p => p.userId.toString() !== req.user.userId);
      await this.sendSystemMessage(roomId, `${req.user.name} left the conversation`);
    } else {
      // Just mark as offline
      participant.isOnline = false;
      participant.lastSeen = new Date();
    }

    room.lastActivity = new Date();
    await this.saveChatRoom(room);

    // Broadcast user leave
    await this.broadcastToRoom(roomId, leaveType === 'permanent' ? 'user_left' : 'user_offline', {
      userId: req.user.userId,
      name: req.user.name,
      leaveType,
      timestamp: new Date()
    }, req.user.userId); // Exclude the leaving user from broadcast

    res.status(200).json({
      success: true,
      message: `${leaveType === 'permanent' ? 'Left' : 'Disconnected from'} chat room successfully`,
      data: {
        roomId,
        leaveType,
        leftAt: new Date()
      }
    });
  });

  /**
   * @desc    Get available chat rooms for user
   * @route   GET /api/chat/rooms
   * @access  Private
   */
  getChatRooms = asyncHandler(async (req, res) => {
    const { 
      roomType = null, 
      isActive = true, 
      page = 1, 
      limit = 20 
    } = req.query;

    // Get rooms where user is a participant
    const rooms = await this.getUserChatRooms(req.user.userId, {
      roomType,
      isActive: isActive === 'true',
      page: parseInt(page),
      limit: parseInt(limit)
    });

    // Format room data
    const formattedRooms = rooms.map(room => ({
      roomId: room._id,
      roomName: room.roomName,
      roomType: room.roomType,
      interviewId: room.interviewId,
      lastActivity: room.lastActivity,
      messageCount: room.messageCount,
      unreadCount: this.getUnreadMessageCount(room, req.user.userId),
      participantCount: room.participants.filter(p => p.isOnline).length,
      totalParticipants: room.participants.length,
      isModerator: room.participants.find(p => p.userId.toString() === req.user.userId)?.isModerator || false,
      lastMessage: room.messages.length > 0 ? {
        message: room.messages[room.messages.length - 1].message,
        senderName: room.messages[room.messages.length - 1].senderName,
        timestamp: room.messages[room.messages.length - 1].timestamp
      } : null
    }));

    res.status(200).json({
      success: true,
      message: 'Chat rooms retrieved successfully',
      data: {
        rooms: formattedRooms,
        pagination: {
          currentPage: parseInt(page),
          totalRooms: formattedRooms.length,
          hasMore: formattedRooms.length === parseInt(limit)
        }
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Real-time Features ----------------------------------------------------
  // ===========================================================================================================================

  /**
   * @desc    Broadcast message to all room members
   * @route   POST /api/chat/rooms/:id/broadcast
   * @access  Private (Moderators only)
   */
  broadcastMessage = asyncHandler(async (req, res) => {
    const { id: roomId } = req.params;
    const { message, messageType = 'announcement', priority = 'normal' } = req.body;

    // Validate room access and moderator permission
    const room = await this.validateRoomAccess(roomId, req.user.userId);
    const participant = room.participants.find(p => p.userId.toString() === req.user.userId);
    
    if (!participant || !participant.isModerator) {
      throw new AppError('Only moderators can broadcast messages', 403);
    }

    // Create broadcast message
    const broadcastMsg = {
      _id: new mongoose.Types.ObjectId(),
      senderId: req.user.userId,
      senderName: req.user.name,
      senderRole: req.user.role,
      message: message.trim(),
      messageType,
      timestamp: new Date(),
      isBroadcast: true,
      priority,
      readBy: [{ userId: req.user.userId, readAt: new Date() }],
      metadata: {
        broadcastType: 'moderator',
        priority
      }
    };

    // Add to room
    room.messages.push(broadcastMsg);
    room.lastActivity = new Date();
    room.messageCount = (room.messageCount || 0) + 1;
    await this.saveChatRoom(room);

    // Broadcast to all participants
    await this.broadcastToRoom(roomId, 'broadcast_message', {
      messageId: broadcastMsg._id,
      senderId: broadcastMsg.senderId,
      senderName: broadcastMsg.senderName,
      message: broadcastMsg.message,
      messageType: broadcastMsg.messageType,
      priority: broadcastMsg.priority,
      timestamp: broadcastMsg.timestamp,
      isBroadcast: true
    });

    res.status(201).json({
      success: true,
      message: 'Broadcast message sent successfully',
      data: {
        messageId: broadcastMsg._id,
        timestamp: broadcastMsg.timestamp,
        priority: broadcastMsg.priority,
        recipientCount: room.participants.filter(p => p.isOnline).length
      }
    });
  });

  /**
   * @desc    Send private direct message
   * @route   POST /api/chat/private
   * @access  Private
   */
  sendPrivateMessage = asyncHandler(async (req, res) => {
    const { recipientId, message, messageType = 'text', roomId = null } = req.body;

    // Validate recipient exists
    const recipient = await User.findById(recipientId).select('_id name email role');
    if (!recipient) {
      throw new AppError('Recipient not found', 404);
    }

    // Check if users are in the same room (if roomId provided)
    if (roomId) {
      const room = await this.validateRoomAccess(roomId, req.user.userId);
      const recipientInRoom = room.participants.find(p => p.userId.toString() === recipientId);
      if (!recipientInRoom) {
        throw new AppError('Recipient is not in the specified room', 400);
      }
    }

    // Create private message (this would be stored in a separate PrivateMessage collection)
    const privateMessage = {
      _id: new mongoose.Types.ObjectId(),
      senderId: req.user.userId,
      senderName: req.user.name,
      recipientId,
      recipientName: recipient.name,
      message: message.trim(),
      messageType,
      roomId,
      timestamp: new Date(),
      isRead: false,
      readAt: null
    };

    // Store private message
    await this.savePrivateMessage(privateMessage);

    // Send to recipient in real-time
    await this.sendToUser(recipientId, 'private_message', {
      messageId: privateMessage._id,
      senderId: privateMessage.senderId,
      senderName: privateMessage.senderName,
      message: privateMessage.message,
      messageType: privateMessage.messageType,
      roomId: privateMessage.roomId,
      timestamp: privateMessage.timestamp
    });

    res.status(201).json({
      success: true,
      message: 'Private message sent successfully',
      data: {
        messageId: privateMessage._id,
        recipientId,
        recipientName: recipient.name,
        timestamp: privateMessage.timestamp
      }
    });
  });

  /**
   * @desc    Send typing indicator
   * @route   POST /api/chat/rooms/:id/typing
   * @access  Private (Room participants only)
   */
  sendTypingIndicator = asyncHandler(async (req, res) => {
    const { id: roomId } = req.params;
    const { isTyping = true } = req.body;

    // Validate room access
    await this.validateRoomAccess(roomId, req.user.userId);

    // Broadcast typing status
    await this.broadcastToRoom(roomId, 'typing_indicator', {
      userId: req.user.userId,
      name: req.user.name,
      isTyping,
      timestamp: new Date()
    }, req.user.userId); // Exclude sender

    res.status(200).json({
      success: true,
      message: 'Typing indicator sent',
      data: {
        isTyping,
        timestamp: new Date()
      }
    });
  });

  /**
   * @desc    Get online users in room
   * @route   GET /api/chat/rooms/:id/users
   * @access  Private (Room participants only)
   */
  getOnlineUsers = asyncHandler(async (req, res) => {
    const { id: roomId } = req.params;

    // Validate room access
    const room = await this.validateRoomAccess(roomId, req.user.userId);

    // Get online users
    const onlineUsers = room.participants
      .filter(p => p.isOnline)
      .map(p => ({
        userId: p.userId,
        name: p.name,
        role: p.role,
        isModerator: p.isModerator,
        joinedAt: p.joinedAt,
        lastSeen: p.lastSeen
      }));

    res.status(200).json({
      success: true,
      message: 'Online users retrieved successfully',
      data: {
        roomId,
        onlineUsers,
        totalOnline: onlineUsers.length,
        totalParticipants: room.participants.length
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- File & Media Sharing --------------------------------------------------
  // ===========================================================================================================================

  /**
   * @desc    Upload and share file in chat
   * @route   POST /api/chat/rooms/:id/files
   * @access  Private (Room participants only)
   */
  uploadChatFile = asyncHandler(async (req, res) => {
    const { id: roomId } = req.params;

    // Validate room access
    const room = await this.validateRoomAccess(roomId, req.user.userId);

    // Check if file sharing is allowed
    if (!room.settings.allowFileSharing) {
      throw new AppError('File sharing is disabled in this room', 403);
    }

    // Check if user is muted
    const participant = room.participants.find(p => p.userId.toString() === req.user.userId);
    if (participant && participant.isMuted) {
      throw new AppError('You are muted in this chat room', 403);
    }

    // File would be handled by multer middleware
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword'];
    const maxFileSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new AppError('File type not allowed', 400);
    }

    if (req.file.size > maxFileSize) {
      throw new AppError('File size too large (max 10MB)', 400);
    }

    // Store file info and create message
    const fileMessage = {
      _id: new mongoose.Types.ObjectId(),
      senderId: req.user.userId,
      senderName: req.user.name,
      senderRole: req.user.role,
      message: `Shared file: ${req.file.originalname}`,
      messageType: 'file',
      timestamp: new Date(),
      isEdited: false,
      readBy: [{ userId: req.user.userId, readAt: new Date() }],
      metadata: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        filePath: req.file.path,
        fileUrl: `/uploads/chat/${req.file.filename}`
      }
    };

    // Add to room
    room.messages.push(fileMessage);
    room.lastActivity = new Date();
    room.messageCount = (room.messageCount || 0) + 1;
    await this.saveChatRoom(room);

    // Broadcast file share
    await this.broadcastToRoom(roomId, 'file_shared', {
      messageId: fileMessage._id,
      senderId: fileMessage.senderId,
      senderName: fileMessage.senderName,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileUrl: fileMessage.metadata.fileUrl,
      mimeType: req.file.mimetype,
      timestamp: fileMessage.timestamp
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded and shared successfully',
      data: {
        messageId: fileMessage._id,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileUrl: fileMessage.metadata.fileUrl,
        timestamp: fileMessage.timestamp
      }
    });
  });

  /**
   * @desc    Send image message
   * @route   POST /api/chat/rooms/:id/images
   * @access  Private (Room participants only)
   */
  sendImageMessage = asyncHandler(async (req, res) => {
    const { id: roomId } = req.params;
    const { caption = '' } = req.body;

    // Validate room access
    const room = await this.validateRoomAccess(roomId, req.user.userId);

    // Check if file sharing is allowed
    if (!room.settings.allowFileSharing) {
      throw new AppError('Image sharing is disabled in this room', 403);
    }

    // Validate image file
    if (!req.file) {
      throw new AppError('No image uploaded', 400);
    }

    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedImageTypes.includes(req.file.mimetype)) {
      throw new AppError('Only image files are allowed', 400);
    }

    // Create image message
    const imageMessage = {
      _id: new mongoose.Types.ObjectId(),
      senderId: req.user.userId,
      senderName: req.user.name,
      senderRole: req.user.role,
      message: caption || `Shared an image: ${req.file.originalname}`,
      messageType: 'image',
      timestamp: new Date(),
      readBy: [{ userId: req.user.userId, readAt: new Date() }],
      metadata: {
        imageUrl: `/uploads/chat/${req.file.filename}`,
        originalName: req.file.originalname,
        size: req.file.size,
        dimensions: await this.getImageDimensions(req.file.path),
        caption
      }
    };

    // Add to room
    room.messages.push(imageMessage);
    room.lastActivity = new Date();
    room.messageCount = (room.messageCount || 0) + 1;
    await this.saveChatRoom(room);

    // Broadcast image
    await this.broadcastToRoom(roomId, 'image_shared', {
      messageId: imageMessage._id,
      senderId: imageMessage.senderId,
      senderName: imageMessage.senderName,
      imageUrl: imageMessage.metadata.imageUrl,
      caption,
      timestamp: imageMessage.timestamp
    });

    res.status(201).json({
      success: true,
      message: 'Image shared successfully',
      data: {
        messageId: imageMessage._id,
        imageUrl: imageMessage.metadata.imageUrl,
        caption,
        timestamp: imageMessage.timestamp
      }
    });
  });

  /**
   * @desc    Send voice message
   * @route   POST /api/chat/rooms/:id/voice
   * @access  Private (Room participants only)
   */
  sendVoiceMessage = asyncHandler(async (req, res) => {
    const { id: roomId } = req.params;
    const { duration = 0 } = req.body;

    // Validate room access
    const room = await this.validateRoomAccess(roomId, req.user.userId);

    // Check if voice messages are allowed
    if (!room.settings.allowVoiceMessages) {
      throw new AppError('Voice messages are disabled in this room', 403);
    }

    // Validate audio file
    if (!req.file) {
      throw new AppError('No voice message uploaded', 400);
    }

    const allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'];
    if (!allowedAudioTypes.includes(req.file.mimetype)) {
      throw new AppError('Only audio files are allowed', 400);
    }

    // Create voice message
    const voiceMessage = {
      _id: new mongoose.Types.ObjectId(),
      senderId: req.user.userId,
      senderName: req.user.name,
      senderRole: req.user.role,
      message: `Voice message (${Math.round(duration)}s)`,
      messageType: 'voice',
      timestamp: new Date(),
      readBy: [{ userId: req.user.userId, readAt: new Date() }],
      metadata: {
        audioUrl: `/uploads/chat/${req.file.filename}`,
        duration: parseFloat(duration),
        size: req.file.size,
        mimeType: req.file.mimetype
      }
    };

    // Add to room
    room.messages.push(voiceMessage);
    room.lastActivity = new Date();
    room.messageCount = (room.messageCount || 0) + 1;
    await this.saveChatRoom(room);

    // Broadcast voice message
    await this.broadcastToRoom(roomId, 'voice_message', {
      messageId: voiceMessage._id,
      senderId: voiceMessage.senderId,
      senderName: voiceMessage.senderName,
      audioUrl: voiceMessage.metadata.audioUrl,
      duration: voiceMessage.metadata.duration,
      timestamp: voiceMessage.timestamp
    });

    res.status(201).json({
      success: true,
      message: 'Voice message sent successfully',
      data: {
        messageId: voiceMessage._id,
        audioUrl: voiceMessage.metadata.audioUrl,
        duration: voiceMessage.metadata.duration,
        timestamp: voiceMessage.timestamp
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Moderation & Management -----------------------------------------------
  // ===========================================================================================================================

  /**
   * @desc    Mute user in chat room
   * @route   POST /api/chat/rooms/:id/mute/:userId
   * @access  Private (Moderators only)
   */
  muteUser = asyncHandler(async (req, res) => {
    const { id: roomId, userId } = req.params;
    const { duration = null, reason = 'Violating chat rules' } = req.body;

    // Validate room access and moderator permission
    const room = await this.validateRoomAccess(roomId, req.user.userId);
    const moderator = room.participants.find(p => p.userId.toString() === req.user.userId);
    
    if (!moderator || !moderator.isModerator) {
      throw new AppError('Only moderators can mute users', 403);
    }

    // Find target user
    const targetUser = room.participants.find(p => p.userId.toString() === userId);
    if (!targetUser) {
      throw new AppError('User not found in this room', 404);
    }

    // Cannot mute other moderators
    if (targetUser.isModerator && req.user.role !== 'Admin') {
      throw new AppError('Cannot mute other moderators', 403);
    }

    // Mute user
    targetUser.isMuted = true;
    targetUser.mutedAt = new Date();
    targetUser.mutedBy = req.user.userId;
    targetUser.muteReason = reason;
    
    if (duration) {
      targetUser.muteExpiresAt = new Date(Date.now() + duration * 60000); // duration in minutes
    }

    room.lastActivity = new Date();
    await this.saveChatRoom(room);

    // Send system message
    const muteMessage = duration 
      ? `${targetUser.name} has been muted for ${duration} minutes: ${reason}`
      : `${targetUser.name} has been muted: ${reason}`;
    
    await this.sendSystemMessage(roomId, muteMessage);

    // Notify muted user
    await this.sendToUser(userId, 'user_muted', {
      roomId,
      mutedBy: req.user.name,
      reason,
      duration,
      expiresAt: targetUser.muteExpiresAt
    });

    res.status(200).json({
      success: true,
      message: 'User muted successfully',
      data: {
        userId,
        userName: targetUser.name,
        mutedBy: req.user.name,
        reason,
        duration,
        mutedAt: targetUser.mutedAt,
        expiresAt: targetUser.muteExpiresAt
      }
    });
  });

  /**
   * @desc    Unmute user in chat room
   * @route   POST /api/chat/rooms/:id/unmute/:userId
   * @access  Private (Moderators only)
   */
  unmuteUser = asyncHandler(async (req, res) => {
    const { id: roomId, userId } = req.params;

    // Validate room access and moderator permission
    const room = await this.validateRoomAccess(roomId, req.user.userId);
    const moderator = room.participants.find(p => p.userId.toString() === req.user.userId);
    
    if (!moderator || !moderator.isModerator) {
      throw new AppError('Only moderators can unmute users', 403);
    }

    // Find target user
    const targetUser = room.participants.find(p => p.userId.toString() === userId);
    if (!targetUser) {
      throw new AppError('User not found in this room', 404);
    }

    if (!targetUser.isMuted) {
      throw new AppError('User is not muted', 400);
    }

    // Unmute user
    targetUser.isMuted = false;
    targetUser.unmutedAt = new Date();
    targetUser.unmutedBy = req.user.userId;
    delete targetUser.mutedAt;
    delete targetUser.mutedBy;
    delete targetUser.muteReason;
    delete targetUser.muteExpiresAt;

    room.lastActivity = new Date();
    await this.saveChatRoom(room);

    // Send system message
    await this.sendSystemMessage(roomId, `${targetUser.name} has been unmuted`);

    // Notify unmuted user
    await this.sendToUser(userId, 'user_unmuted', {
      roomId,
      unmutedBy: req.user.name,
      unmutedAt: targetUser.unmutedAt
    });

    res.status(200).json({
      success: true,
      message: 'User unmuted successfully',
      data: {
        userId,
        userName: targetUser.name,
        unmutedBy: req.user.name,
        unmutedAt: targetUser.unmutedAt
      }
    });
  });

  /**
   * @desc    Ban user from chat room
   * @route   POST /api/chat/rooms/:id/ban/:userId
   * @access  Private (Admin only)
   */
  banUser = asyncHandler(async (req, res) => {
    const { id: roomId, userId } = req.params;
    const { reason = 'Violating community guidelines', duration = null } = req.body;

    // Only admins can ban users
    if (req.user.role !== 'Admin') {
      throw new AppError('Only admins can ban users', 403);
    }

    // Validate room access
    const room = await this.validateRoomAccess(roomId, req.user.userId);

    // Find target user
    const targetUser = room.participants.find(p => p.userId.toString() === userId);
    if (!targetUser) {
      throw new AppError('User not found in this room', 404);
    }

    // Cannot ban other admins
    if (targetUser.role === 'Admin') {
      throw new AppError('Cannot ban other admins', 403);
    }

    // Add to banned list
    if (!room.bannedUsers) room.bannedUsers = [];
    
    const banEntry = {
      userId,
      userName: targetUser.name,
      bannedBy: req.user.userId,
      bannedByName: req.user.name,
      bannedAt: new Date(),
      reason,
      isActive: true
    };

    if (duration) {
      banEntry.expiresAt = new Date(Date.now() + duration * 60000); // duration in minutes
    }

    room.bannedUsers.push(banEntry);

    // Remove from participants
    room.participants = room.participants.filter(p => p.userId.toString() !== userId);

    room.lastActivity = new Date();
    await this.saveChatRoom(room);

    // Send system message
    await this.sendSystemMessage(roomId, `${targetUser.name} has been banned from the room: ${reason}`);

    // Notify banned user
    await this.sendToUser(userId, 'user_banned', {
      roomId,
      roomName: room.roomName,
      bannedBy: req.user.name,
      reason,
      duration,
      expiresAt: banEntry.expiresAt
    });

    res.status(200).json({
      success: true,
      message: 'User banned successfully',
      data: {
        userId,
        userName: targetUser.name,
        bannedBy: req.user.name,
        reason,
        duration,
        bannedAt: banEntry.bannedAt,
        expiresAt: banEntry.expiresAt
      }
    });
  });

  /**
   * @desc    Get chat room moderators
   * @route   GET /api/chat/rooms/:id/moderators
   * @access  Private (Room participants only)
   */
  getChatModerators = asyncHandler(async (req, res) => {
    const { id: roomId } = req.params;

    // Validate room access
    const room = await this.validateRoomAccess(roomId, req.user.userId);

    // Get moderators
    const moderators = room.participants
      .filter(p => p.isModerator)
      .map(p => ({
        userId: p.userId,
        name: p.name,
        role: p.role,
        joinedAt: p.joinedAt,
        isOnline: p.isOnline,
        lastSeen: p.lastSeen
      }));

    res.status(200).json({
      success: true,
      message: 'Moderators retrieved successfully',
      data: {
        roomId,
        moderators,
        totalModerators: moderators.length
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Analytics & Archive ---------------------------------------------------
  // ===========================================================================================================================

  /**
   * @desc    Get chat statistics for room
   * @route   GET /api/chat/rooms/:id/statistics
   * @access  Private (Moderators only)
   */
  getChatStatistics = asyncHandler(async (req, res) => {
    const { id: roomId } = req.params;
    const { period = '7d' } = req.query; // 1d, 7d, 30d

    // Validate room access and moderator permission
    const room = await this.validateRoomAccess(roomId, req.user.userId);
    const participant = room.participants.find(p => p.userId.toString() === req.user.userId);
    
    if (!participant || (!participant.isModerator && req.user.role !== 'Admin')) {
      throw new AppError('Only moderators can view chat statistics', 403);
    }

    // Calculate statistics
    const stats = await this.calculateChatStatistics(room, period);

    res.status(200).json({
      success: true,
      message: 'Chat statistics retrieved successfully',
      data: {
        roomId,
        period,
        statistics: stats
      }
    });
  });

  /**
   * @desc    Archive chat room
   * @route   POST /api/chat/rooms/:id/archive
   * @access  Private (Admin/Recruiter only)
   */
  archiveChatRoom = asyncHandler(async (req, res) => {
    const { id: roomId } = req.params;
    const { archiveReason = 'Interview completed' } = req.body;

    // Only admins and recruiters can archive rooms
    if (!['Admin', 'Recruiter'].includes(req.user.role)) {
      throw new AppError('Not authorized to archive chat rooms', 403);
    }

    // Validate room access
    const room = await this.validateRoomAccess(roomId, req.user.userId);

    // Archive room
    room.isActive = false;
    room.archivedAt = new Date();
    room.archivedBy = req.user.userId;
    room.archiveReason = archiveReason;
    room.lastActivity = new Date();

    await this.saveChatRoom(room);

    // Notify all participants
    await this.broadcastToRoom(roomId, 'room_archived', {
      roomId,
      roomName: room.roomName,
      archivedBy: req.user.name,
      reason: archiveReason,
      archivedAt: room.archivedAt
    });

    res.status(200).json({
      success: true,
      message: 'Chat room archived successfully',
      data: {
        roomId,
        roomName: room.roomName,
        archivedBy: req.user.name,
        reason: archiveReason,
        archivedAt: room.archivedAt,
        messageCount: room.messageCount
      }
    });
  });

  /**
   * @desc    Search messages in room
   * @route   GET /api/chat/rooms/:id/search
   * @access  Private (Room participants only)
   */
  searchMessages = asyncHandler(async (req, res) => {
    const { id: roomId } = req.params;
    const { 
      query, 
      senderId = null,
      messageType = null,
      dateFrom = null,
      dateTo = null,
      page = 1,
      limit = 20
    } = req.query;

    if (!query || query.trim().length < 2) {
      throw new AppError('Search query must be at least 2 characters long', 400);
    }

    // Validate room access
    const room = await this.validateRoomAccess(roomId, req.user.userId);

    // Search messages
    const searchResults = await this.searchRoomMessages(room, {
      query: query.trim(),
      senderId,
      messageType,
      dateFrom,
      dateTo,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      message: 'Message search completed successfully',
      data: {
        roomId,
        searchQuery: query.trim(),
        results: searchResults.messages,
        pagination: {
          currentPage: parseInt(page),
          totalResults: searchResults.total,
          hasMore: searchResults.total > page * limit
        },
        filters: {
          senderId,
          messageType,
          dateFrom,
          dateTo
        }
      }
    });
  });

  /**
   * @desc    Export chat log
   * @route   GET /api/chat/rooms/:id/export
   * @access  Private (Moderators only)
   */
  exportChatLog = asyncHandler(async (req, res) => {
    const { id: roomId } = req.params;
    const { 
      format = 'json',
      includeMetadata = true,
      dateFrom = null,
      dateTo = null
    } = req.query;

    // Validate room access and moderator permission
    const room = await this.validateRoomAccess(roomId, req.user.userId);
    const participant = room.participants.find(p => p.userId.toString() === req.user.userId);
    
    if (!participant || (!participant.isModerator && req.user.role !== 'Admin')) {
      throw new AppError('Only moderators can export chat logs', 403);
    }

    // Generate export
    const exportData = await this.generateChatExport(room, {
      format,
      includeMetadata: includeMetadata === 'true',
      dateFrom,
      dateTo
    });

    // Set appropriate headers
    const contentTypes = {
      json: 'application/json',
      csv: 'text/csv',
      txt: 'text/plain',
      pdf: 'application/pdf'
    };

    res.setHeader('Content-Type', contentTypes[format] || 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="chat_log_${roomId}_${new Date().toISOString().split('T')[0]}.${format}"`);

    res.status(200).json({
      success: true,
      message: 'Chat log exported successfully',
      data: {
        export: exportData,
        format,
        exportedAt: new Date(),
        exportedBy: req.user.name,
        roomId,
        roomName: room.roomName,
        messageCount: exportData.messageCount || 0
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Helper Methods --------------------------------------------------------
  // ===========================================================================================================================

  /**
   * Validate room access for user
   */
  validateRoomAccess = async (roomId, userId) => {
    const room = await this.getChatRoom(roomId);
    if (!room) {
      throw new AppError('Chat room not found', 404);
    }

    if (!room.isActive) {
      throw new AppError('Chat room is no longer active', 400);
    }

    const participant = room.participants.find(p => p.userId.toString() === userId);
    if (!participant) {
      throw new AppError('You are not a participant in this room', 403);
    }

    // Check if user is banned
    if (room.bannedUsers && room.bannedUsers.some(ban => 
      ban.userId.toString() === userId && 
      ban.isActive && 
      (!ban.expiresAt || ban.expiresAt > new Date())
    )) {
      throw new AppError('You are banned from this chat room', 403);
    }

    return room;
  };

  /**
   * Check if user can join room
   */
  checkJoinPermission = async (room, user) => {
    // Interview participants can always join
    if (room.interviewId) {
      const interview = await Interview.findById(room.interviewId);
      if (interview) {
        const isParticipant = 
          interview.candidateId.toString() === user.userId ||
          interview.recruiterId.toString() === user.userId ||
          user.role === 'Admin';
        if (isParticipant) return true;
      }
    }

    // Admins can always join
    if (user.role === 'Admin') return true;

    return false;
  };

  /**
   * Broadcast message to all room participants
   */
  broadcastToRoom = async (roomId, eventType, data, excludeUserId = null) => {
    // This would integrate with Socket.IO to send real-time updates
    // Mock implementation for now
    console.log(`Broadcasting to room ${roomId}:`, eventType, data);
    return true;
  };

  /**
   * Send message to specific user
   */
  sendToUser = async (userId, eventType, data) => {
    // This would integrate with Socket.IO to send to specific user
    // Mock implementation for now
    console.log(`Sending to user ${userId}:`, eventType, data);
    return true;
  };

  /**
   * Send system message to room
   */
  sendSystemMessage = async (roomId, message) => {
    const room = await this.getChatRoom(roomId);
    if (!room) return;

    const systemMessage = {
      _id: new mongoose.Types.ObjectId(),
      senderId: 'system',
      senderName: 'System',
      senderRole: 'system',
      message,
      messageType: 'system',
      timestamp: new Date(),
      readBy: [],
      metadata: { isSystemMessage: true }
    };

    room.messages.push(systemMessage);
    room.messageCount = (room.messageCount || 0) + 1;
    await this.saveChatRoom(room);

    await this.broadcastToRoom(roomId, 'system_message', {
      messageId: systemMessage._id,
      message: systemMessage.message,
      timestamp: systemMessage.timestamp
    });
  };

  /**
   * Mock methods for data persistence (would integrate with actual database)
   */
  getChatRoom = async (roomId) => {
    // This would query actual ChatRoom collection
    // Mock implementation
    return null;
  };

  saveChatRoom = async (roomData) => {
    // This would save to ChatRoom collection
    // Mock implementation
    return roomData;
  };

  getUserChatRooms = async (userId, filters) => {
    // This would query user's rooms from database
    // Mock implementation
    return [];
  };

  findRoomByMessageId = async (messageId) => {
    // This would find room containing the message
    // Mock implementation
    return null;
  };

  savePrivateMessage = async (messageData) => {
    // This would save to PrivateMessage collection
    // Mock implementation
    return messageData;
  };

  updateUserLastSeen = async (roomId, userId) => {
    // Update user's last seen timestamp
    return true;
  };

  markMessagesAsRead = async (roomId, userId) => {
    // Mark messages as read for user
    return true;
  };

  getUnreadMessageCount = (room, userId) => {
    // Calculate unread messages for user
    return 0;
  };

  notifyParticipants = async (roomId, eventType, data) => {
    // Send notifications to participants
    return true;
  };

  getImageDimensions = async (filePath) => {
    // Get image width/height
    return { width: 0, height: 0 };
  };

  calculateChatStatistics = async (room, period) => {
    // Calculate chat usage statistics
    return {
      totalMessages: room.messageCount || 0,
      activeUsers: room.participants.filter(p => p.isOnline).length,
      messagesByType: {},
      activityByHour: {},
      topParticipants: []
    };
  };

  searchRoomMessages = async (room, filters) => {
    // Search messages in room
    const query = filters.query.toLowerCase();
    const messages = room.messages.filter(msg => 
      msg.message.toLowerCase().includes(query)
    );

    return {
      messages: messages.slice((filters.page - 1) * filters.limit, filters.page * filters.limit),
      total: messages.length
    };
  };

  generateChatExport = async (room, options) => {
    // Generate export data in specified format
    return {
      roomName: room.roomName,
      exportDate: new Date(),
      messages: room.messages,
      messageCount: room.messages.length
    };
  };
}

module.exports = new ChatController();