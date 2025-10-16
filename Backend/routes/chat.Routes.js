const express = require('express');
const router = express.Router();

// Import controllers
const chatController = require('../controllers/chat.Controller');

// Import middleware
const { protect, authorize } = require('../middleware/auth');

// ===========================================================================================================================
// ================================================ Chat Routes (Basic) ======================================================
// ===========================================================================================================================

/**
 * @desc    Send message in a chat room
 * @route   POST /api/chat/rooms/:id/messages
 * @access  Private
 */
router.post('/rooms/:id/messages',
  protect,
  chatController.sendMessage
);

/**
 * @desc    Get message history for a chat room
 * @route   GET /api/chat/rooms/:id/messages
 * @access  Private
 */
router.get('/rooms/:id/messages',
  protect,
  chatController.getMessageHistory
);

/**
 * @desc    Delete message in a chat room
 * @route   DELETE /api/chat/rooms/:id/messages/:messageId
 * @access  Private
 */
router.delete('/rooms/:id/messages/:messageId',
  protect,
  chatController.deleteMessage
);

/**
 * @desc    Edit message in a chat room
 * @route   PUT /api/chat/rooms/:id/messages/:messageId
 * @access  Private
 */
router.put('/rooms/:id/messages/:messageId',
  protect,
  chatController.editMessage
);

/**
 * @desc    Create chat room
 * @route   POST /api/chat/rooms
 * @access  Private
 */
router.post('/rooms',
  protect,
  chatController.createChatRoom
);

/**
 * @desc    Join chat room
 * @route   POST /api/chat/rooms/:roomId/join
 * @access  Private
 */
router.post('/rooms/:roomId/join',
  protect,
  chatController.joinChatRoom
);

/**
 * @desc    Leave chat room
 * @route   POST /api/chat/rooms/:roomId/leave
 * @access  Private
 */
router.post('/rooms/:roomId/leave',
  protect,
  chatController.leaveChatRoom
);

/**
 * @desc    Get chat rooms
 * @route   GET /api/chat/rooms
 * @access  Private
 */
router.get('/rooms',
  protect,
  chatController.getChatRooms
);

/**
 * @desc    Test chat endpoint - verify chat system is working
 * @route   GET /api/chat/test
 * @access  Private
 */
router.get('/test',
  protect,
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Chat system is working properly',
      data: {
        user: {
          id: req.user.userId,
          role: req.user.role,
          name: req.user.name
        },
        routes: {
          getChatRooms: 'GET /api/chat/rooms',
          createChatRoom: 'POST /api/chat/rooms (Admin/Recruiter only)',
          sendMessage: 'POST /api/chat/rooms/:id/messages',
          getMessages: 'GET /api/chat/rooms/:id/messages',
          joinRoom: 'POST /api/chat/rooms/:roomId/join',
          leaveRoom: 'POST /api/chat/rooms/:roomId/leave'
        },
        timestamp: new Date()
      }
    });
  }
);

/**
 * @desc    Broadcast message to a chat room
 * @route   POST /api/chat/rooms/:id/broadcast
 * @access  Private (Moderators only)
 */
router.post('/rooms/:id/broadcast',
  protect,
  authorize('Admin', 'Recruiter'),
  chatController.broadcastMessage
);

module.exports = router;
