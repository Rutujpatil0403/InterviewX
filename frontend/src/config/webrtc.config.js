// WebRTC and Socket.IO configuration
export const CONFIG = {
  // Socket.IO server URL
  SOCKET_URL: window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://your-production-socket-url.com',
  
  // WebRTC configuration
  WEBRTC_CONFIG: {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      // Add TURN servers for production
      // { 
      //   urls: "turn:your-turn-server.com:3478",
      //   username: "username",
      //   credential: "password"
      // }
    ],
    iceCandidatePoolSize: 10,
  },

  // Media constraints for different quality levels
  MEDIA_CONSTRAINTS: {
    HIGH_QUALITY: {
      video: { 
        width: { ideal: 1280 }, 
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      },
      audio: { 
        echoCancellation: true, 
        noiseSuppression: true,
        autoGainControl: true
      }
    },
    MEDIUM_QUALITY: {
      video: { 
        width: { ideal: 640 }, 
        height: { ideal: 480 },
        frameRate: { ideal: 24 }
      },
      audio: { 
        echoCancellation: true, 
        noiseSuppression: true,
        autoGainControl: true
      }
    },
    LOW_QUALITY: {
      video: { 
        width: { ideal: 320 }, 
        height: { ideal: 240 },
        frameRate: { ideal: 15 }
      },
      audio: { 
        echoCancellation: true, 
        noiseSuppression: true,
        autoGainControl: true
      }
    }
  },

  // Screen sharing constraints
  SCREEN_SHARE_CONSTRAINTS: {
    video: {
      mediaSource: 'screen',
      width: { max: 1920 },
      height: { max: 1080 },
      frameRate: { max: 30 }
    },
    audio: {
      suppressLocalAudioPlayback: false
    }
  },

  // Recording configuration
  RECORDING_CONFIG: {
    mimeType: 'video/webm;codecs=vp8,opus',
    videoBitsPerSecond: 2500000, // 2.5 Mbps
    audioBitsPerSecond: 128000   // 128 kbps
  },

  // Connection timeouts and retry settings
  CONNECTION_CONFIG: {
    RECONNECT_ATTEMPTS: 3,
    RECONNECT_DELAY: 3000,
    CONNECTION_TIMEOUT: 10000,
    ICE_GATHERING_TIMEOUT: 10000
  }
};

export default CONFIG;