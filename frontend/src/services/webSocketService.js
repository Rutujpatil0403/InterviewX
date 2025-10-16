// Import Socket.IO client library for real-time bidirectional communication
import { io } from 'socket.io-client';
// Import js-cookie library to handle browser cookies
import Cookies from 'js-cookie';

// Define a WebSocketService class to manage all WebSocket connections
class WebSocketService {
  constructor() {
    // Store the Socket.IO connection instance
    this.socket = null;
    
    // Track how many times we've tried to reconnect after disconnection
    this.reconnectAttempts = 0;
    
    // Maximum number of reconnection attempts before giving up
    this.maxReconnectAttempts = 5;
    
    // Initial delay (in milliseconds) between reconnection attempts
    this.reconnectInterval = 3000;
    
    // Map to store event listeners (key: event name, value: array of callback functions)
    this.listeners = new Map();
    
    // Store the current room ID the user is in
    this.roomId = null;
    
    // Store the current user's ID
    this.userId = null;
    
    // Flag to prevent multiple simultaneous connection attempts
    this.isConnecting = false;
  }

  // Main method to establish WebSocket connection
  connect() {
    // Check if socket is already connected or currently trying to connect
    if (this.socket?.connected || this.isConnecting) {
      console.log('Socket already connected or connecting');
      return; // Exit early to prevent duplicate connections
    }

    // Set flag to indicate connection is in progress
    this.isConnecting = true;

    // Try to get authentication token from multiple storage locations
    // Check localStorage first, then cookies, then sessionStorage
    const token = localStorage.getItem('token') ||
      Cookies.get('token') ||
      sessionStorage.getItem('token');

    // Log the token for debugging (be careful with this in production!)
    console.log("Token : ", token);

    // If no token is found anywhere, we can't authenticate
    if (!token) {
      console.error('No authentication token found');
      this.isConnecting = false; // Reset connecting flag
      
      // Emit an error event to notify listeners
      this.emit('error', {
        message: 'Authentication required',
        code: 'NO_TOKEN'
      });
      return; // Exit since we can't connect without a token
    }

    // Get the server URL from environment variables, fallback to localhost
    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    console.log('Connecting to WebSocket server:', serverUrl);

    try {
      // Create a new Socket.IO connection with configuration options
      this.socket = io(serverUrl, {
        // Send the authentication token with the connection
        auth: { token },
        
        // Specify transport methods: try WebSocket first, fallback to polling
        transports: ['websocket', 'polling'],
        
        // Don't force a new connection if one exists
        forceNew: false,
        
        // Connection timeout in milliseconds
        timeout: 10000,
        
        // Enable automatic reconnection
        reconnection: true,
        
        // Wait 2 seconds before first reconnection attempt
        reconnectionDelay: 2000,
        
        // Maximum number of reconnection attempts
        reconnectionAttempts: this.maxReconnectAttempts,
        
        // Maximum delay between reconnection attempts
        reconnectionDelayMax: 5000
      });

      // Listen for successful connection event
      this.socket.on('connect', () => {
        console.log('WebSocket connected successfully');
        
        // Reset the connecting flag
        this.isConnecting = false;
        
        // Reset reconnection counter on successful connection
        this.reconnectAttempts = 0;
        
        // Notify all listeners that connection is established
        this.emit('connected');
      });

      // Listen for connection errors
      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        
        // Reset connecting flag
        this.isConnecting = false;

        // Check if the error is related to authentication/token issues
        // Look for keywords in the error message
        if (error.message?.includes('Authentication') || 
            error.message?.includes('jwt') ||
            error.message?.includes('token')) {
          console.error('Auth failed - token may be invalid');
          
          // DON'T automatically delete tokens here!
          // Instead, emit an 'auth_error' event so UI components can handle it
          // This prevents accidentally deleting valid tokens due to network issues
          this.emit('auth_error', error);
        } else {
          // For non-auth errors, emit a general error event
          this.emit('error', error);
        }
      });

      // Set up all the event listeners for different socket events
      this.setupEventListeners();

      // Listen for disconnection events
      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        
        // Reset connecting flag
        this.isConnecting = false;
        
        // Notify listeners about disconnection
        this.emit('disconnected', reason);

        // List of disconnect reasons where we should NOT auto-reconnect
        const noReconnectReasons = [
          'io server disconnect', // Server intentionally closed the connection
          'io client disconnect'  // Client intentionally closed the connection
        ];

        // If disconnect reason allows reconnection and we haven't exceeded max attempts
        if (!noReconnectReasons.includes(reason) &&
          this.reconnectAttempts < this.maxReconnectAttempts) {
          
          // Use exponential backoff: wait longer after each failed attempt
          // Formula: reconnectInterval * 2^reconnectAttempts
          setTimeout(() => {
            this.reconnectAttempts++; // Increment attempt counter
            console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            this.connect(); // Try to reconnect
          }, this.reconnectInterval * Math.pow(2, this.reconnectAttempts));
        }
      });

      // Listen for successful reconnection
      this.socket.on('reconnect', (attemptNumber) => {
        console.log('Reconnected after', attemptNumber, 'attempts');
        
        // Reset attempt counter after successful reconnection
        this.reconnectAttempts = 0;
      });

    } catch (error) {
      // Catch any errors during socket creation
      console.error('Failed to create WebSocket:', error);
      this.isConnecting = false; // Reset flag
      this.emit('error', error); // Notify listeners
    }
  }

  // Set up listeners for all incoming socket events
  setupEventListeners() {
    // Exit if socket doesn't exist
    if (!this.socket) return;

    // === VIDEO SIGNALING EVENTS ===
    
    // Received a WebRTC offer from another peer (to start video call)
    this.socket.on('webrtc-offer', (data) => {
      console.log('Received WebRTC offer');
      // Forward the offer to components listening for 'video-offer'
      this.emit('video-offer', data);
    });

    // Received a WebRTC answer (response to our offer)
    this.socket.on('webrtc-answer', (data) => {
      console.log('Received WebRTC answer');
      // Forward the answer to components
      this.emit('video-answer', data);
    });

    // Received an ICE candidate (network connection info for WebRTC)
    this.socket.on('webrtc-ice-candidate', (data) => {
      console.log('Received ICE candidate');
      // Forward ICE candidate to components
      this.emit('ice-candidate', data);
    });

    // === CHAT EVENTS ===
    
    // Received a chat message from another user
    this.socket.on('chat-message-received', (data) => {
      // Forward message to components
      this.emit('chat-message', data);
    });

    // Another user started typing
    this.socket.on('typing-start', (data) => {
      // Forward typing indicator to components
      this.emit('typing-start', data);
    });

    // Another user stopped typing
    this.socket.on('typing-stop', (data) => {
      // Forward stop typing indicator to components
      this.emit('typing-stop', data);
    });

    // === ROOM EVENTS ===
    
    // Another user joined the video room
    this.socket.on('user-joined-video', (data) => {
      console.log('User joined video:', data);
      // Notify components so they can add the new user's video
      this.emit('user-joined', data);
    });

    // Another user left the video room
    this.socket.on('user-left-video', (data) => {
      console.log('User left video:', data);
      // Notify components so they can remove the user's video
      this.emit('user-left', data);
    });

    // === MEDIA STATE EVENTS ===
    
    // Another user changed their audio/video state (muted/unmuted)
    this.socket.on('media-state-changed', (data) => {
      // Forward media state change to components
      this.emit('media-state-changed', data);
    });

    // Generic error event from server
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      // Forward error to components
      this.emit('error', error);
    });
  }

  // Join a video chat room
  joinVideoRoom(roomId, userId, userName) {
    // Store room and user info for later use
    this.roomId = roomId;
    this.userId = userId;

    // Check if socket is connected before trying to join
    if (!this.socket?.connected) {
      console.error('Cannot join room: socket not connected');
      return false; // Return false to indicate failure
    }

    console.log('Joining video room:', { roomId, userId, userName });
    
    // Send 'join-video-room' event to server with user details
    this.socket.emit('join-video-room', {
      roomId,
      userId,
      userName
    });
    
    return true; // Return true to indicate success
  }

  // Leave a video chat room
  leaveVideoRoom(roomId, userId) {
    // Check if socket is connected
    if (!this.socket?.connected) return false;

    console.log('Leaving video room:', { roomId, userId });
    
    // Send 'leave-video-room' event to server
    this.socket.emit('leave-video-room', {
      roomId,
      userId
    });
    
    return true;
  }

  // Disconnect from the WebSocket server
  disconnect() {
    // If socket exists, close the connection
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null; // Clear the socket reference
    }
    
    // Clear all event listeners to prevent memory leaks
    this.listeners.clear();
    
    // Reset connecting flag
    this.isConnecting = false;
  }

  // Generic method to send events to the server
  send(event, data) {
    // Check if socket is connected before sending
    if (this.socket?.connected) {
      this.socket.emit(event, data); // Send the event with data
      return true; // Indicate success
    }
    
    // Log warning if message couldn't be sent
    console.warn('Socket not connected, message not sent:', { event, data });
    return false; // Indicate failure
  }

  // === EVENT LISTENER MANAGEMENT ===
  
  // Register a callback function to listen for a specific event
  on(event, callback) {
    // If no listeners exist for this event yet, create an empty array
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    // Add the callback to the array of listeners for this event
    this.listeners.get(event).push(callback);
  }

  // Remove a specific callback from an event
  off(event, callback) {
    // Get all callbacks for this event
    const callbacks = this.listeners.get(event);
    
    if (callbacks) {
      // Find the index of the callback
      const index = callbacks.indexOf(callback);
      
      // If found, remove it from the array
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Trigger all callbacks registered for a specific event
  emit(event, data) {
    // Get all callbacks for this event
    const callbacks = this.listeners.get(event);
    
    if (callbacks) {
      // Call each callback function with the data
      callbacks.forEach(callback => {
        try {
          callback(data); // Execute the callback
        } catch (error) {
          // Catch errors to prevent one bad callback from breaking others
          console.error('Error in callback:', error);
        }
      });
    }
  }

  // === WEBRTC SIGNALING METHODS ===
  
  // Send a WebRTC offer to initiate a video connection
  sendWebRTCOffer(roomId, offer) {
    return this.send('webrtc-offer', {
      offer,      // The WebRTC offer object
      roomId,     // Which room this offer is for
      userId: this.userId  // Who is sending the offer
    });
  }

  // Send a WebRTC answer (response to an offer)
  sendWebRTCAnswer(roomId, answer) {
    return this.send('webrtc-answer', {
      answer,     // The WebRTC answer object
      roomId,     // Which room this answer is for
      userId: this.userId  // Who is sending the answer
    });
  }

  // Send an ICE candidate (network connection information)
  sendWebRTCIceCandidate(roomId, candidate) {
    return this.send('webrtc-ice-candidate', {
      candidate,  // The ICE candidate object
      roomId,     // Which room this is for
      userId: this.userId  // Who is sending the candidate
    });
  }

  // Notify others when we change our audio/video state
  sendMediaStateChange(roomId, audio, video) {
    return this.send('media-state-change', {
      audio,      // true if audio is enabled, false if muted
      video,      // true if video is enabled, false if camera off
      roomId,     // Which room this applies to
      userId: this.userId  // Who changed their state
    });
  }

  // === SCREEN SHARING METHODS ===
  
  // Start sharing your screen with others
  startScreenShare(roomId) {
    return this.send('screen-share-start', {
      roomId,     // Which room to share screen in
      userId: this.userId  // Who is sharing
    });
  }

  // Stop sharing your screen
  stopScreenShare(roomId) {
    return this.send('screen-share-stop', {
      roomId,     // Which room to stop sharing in
      userId: this.userId  // Who stopped sharing
    });
  }

  // === CHAT METHODS ===
  
  // Send a chat message to the room
  sendChatMessage(message, roomId) {
    return this.send('chat-message', {
      message,    // The text message content
      roomId,     // Which room to send message to
      userId: this.userId,  // Who sent the message
      timestamp: new Date().toISOString()  // When the message was sent
    });
  }

  // Indicate that the user started typing
  sendTyping(roomId) {
    return this.send('typing-start', {
      roomId,     // Which room the user is typing in
      userId: this.userId  // Who is typing
    });
  }

  // Indicate that the user stopped typing
  sendStopTyping(roomId) {
    return this.send('typing-stop', {
      roomId,     // Which room the user stopped typing in
      userId: this.userId  // Who stopped typing
    });
  }

  // === UTILITY METHODS ===
  
  // Check if the socket is currently connected
  isConnected() {
    // Use optional chaining (?.) to safely check connection status
    return this.socket?.connected || false;
  }

  // Get the current connection state as a string
  getConnectionState() {
    // If socket doesn't exist, we're disconnected
    if (!this.socket) return 'disconnected';
    
    // Otherwise return 'connected' or 'disconnected' based on state
    return this.socket.connected ? 'connected' : 'disconnected';
  }

  // Get direct access to the socket instance (use with caution)
  getSocket() {
    return this.socket;
  }
}

// Create a single instance (Singleton pattern)
// This ensures only one WebSocket connection exists throughout the app
const socketService = new WebSocketService();

// Export the single instance, not the class
export default socketService;