// src/components/Chat/ChatComponent.jsx - Complete, fixed version

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { 
  Send, 
  Paperclip, 
  MoreVertical, 
  Trash2, 
  Edit3,
  Reply,
  Smile,
  Users,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../Common/Button';
import webSocketService from '../../services/webSocketService';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${({ theme }) => theme.colors.white || '#ffffff'};
  border-radius: ${({ theme }) => theme.borderRadius?.lg || '0.5rem'};
  border: 1px solid ${({ theme }) => theme.colors.gray?.[200] || '#e5e7eb'};
  overflow: hidden;
`;

const ChatHeader = styled.div`
  padding: 1rem;
  background: ${({ theme }) => theme.colors.gray?.[50] || '#f9fafb'};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray?.[200] || '#e5e7eb'};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ChatTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray?.[900] || '#111827'};
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
    color: ${({ theme }) => theme.colors.primary?.[600] || '#2563eb'};
  }
`;

const ParticipantCount = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray?.[500] || '#6b7280'};
  
  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.gray?.[100] || '#f3f4f6'};
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.gray?.[300] || '#d1d5db'};
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.gray?.[400] || '#9ca3af'};
  }
`;

const MessageGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
  
  ${({ isOwn }) => isOwn && `
    align-items: flex-end;
  `}
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  
  ${({ isOwn }) => isOwn && `
    flex-direction: row-reverse;
  `}
`;

const UserAvatar = styled.div`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: ${({ color }) => color || '#3b82f6'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
`;

const UserName = styled.div`
  font-weight: 600;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray?.[900] || '#111827'};
`;

const MessageTime = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray?.[500] || '#6b7280'};
`;

const MessageBubble = styled.div`
  position: relative;
  max-width: 75%;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  word-wrap: break-word;
  
  ${({ isOwn, theme }) => isOwn ? `
    background: ${theme.colors.primary?.[600] || '#2563eb'};
    color: white;
    border-bottom-right-radius: 0.25rem;
  ` : `
    background: ${theme.colors.gray?.[100] || '#f3f4f6'};
    color: ${theme.colors.gray?.[900] || '#111827'};
    border-bottom-left-radius: 0.25rem;
  `}
  
  &:hover .message-actions {
    opacity: 1;
  }
`;

const MessageActions = styled.div`
  position: absolute;
  top: -0.5rem;
  ${({ isOwn }) => isOwn ? 'left: -2rem;' : 'right: -2rem;'}
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray?.[200] || '#e5e7eb'};
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  display: flex;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 0.375rem;
  color: ${({ theme }) => theme.colors.gray?.[600] || '#4b5563'};
  
  &:hover {
    background: ${({ theme }) => theme.colors.gray?.[100] || '#f3f4f6'};
    color: ${({ theme }) => theme.colors.gray?.[900] || '#111827'};
  }
  
  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const MessageStatus = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray?.[400] || '#9ca3af'};
  margin-top: 0.25rem;
  
  ${({ isOwn }) => isOwn ? 'text-align: right;' : 'text-align: left;'}
`;

const InputContainer = styled.div`
  padding: 1rem;
  background: ${({ theme }) => theme.colors.gray?.[50] || '#f9fafb'};
  border-top: 1px solid ${({ theme }) => theme.colors.gray?.[200] || '#e5e7eb'};
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray?.[300] || '#d1d5db'};
  border-radius: 1.5rem;
  padding: 0.5rem;
  
  &:focus-within {
    border-color: ${({ theme }) => theme.colors.primary?.[500] || '#3b82f6'};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary?.[100] || '#dbeafe'};
  }
`;

const MessageInput = styled.textarea`
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  max-height: 120px;
  min-height: 20px;
  background: transparent;
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.gray?.[400] || '#9ca3af'};
  }
`;

const InputActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const InputButton = styled.button`
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 0.375rem;
  color: ${({ theme }) => theme.colors.gray?.[400] || '#9ca3af'};
  transition: all 0.2s;
  
  &:hover {
    background: ${({ theme }) => theme.colors.gray?.[100] || '#f3f4f6'};
    color: ${({ theme }) => theme.colors.gray?.[600] || '#4b5563'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const SendButton = styled(Button)`
  padding: 0.5rem;
  border-radius: 50%;
  min-width: auto;
  width: 2.5rem;
  height: 2.5rem;
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const TypingIndicator = styled.div`
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray?.[500] || '#6b7280'};
  font-style: italic;
  min-height: 1.5rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  color: ${({ theme }) => theme.colors.gray?.[500] || '#6b7280'};
  
  svg {
    width: 3rem;
    height: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
`;

const ChatComponent = ({ 
  roomId, 
  onMessageCount,
  height = '500px'
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // Socket.IO connection and event handling
  useEffect(() => {
    if (!webSocketService.isConnected()) {
      console.log('Connecting to chat via Socket.IO...');
      webSocketService.connect(roomId, user.id, user.name);
    }
    
    // Set up Socket.IO event listeners
    const handleConnected = () => {
      console.log('Chat Socket.IO connected');
      setIsConnected(true);
      loadMessageHistory();
    };
    
    const handleDisconnected = (reason) => {
      console.log('Chat Socket.IO disconnected:', reason);
      setIsConnected(false);
    };
    
    const handleError = (error) => {
      console.error('Chat Socket.IO error:', error);
      setIsConnected(false);
    };
    
    const handleAuthError = (error) => {
      console.error('Chat authentication failed:', error);
      setIsConnected(false);
    };
    
    const handleChatMessage = (data) => {
      console.log('Received chat message:', data);
      setMessages(prev => [...prev, data]);
      if (onMessageCount) {
        onMessageCount(prevCount => prevCount + 1);
      }
    };
    
    const handleUserTyping = (data) => {
      if (data.userId !== user.id) {
        setTyping(prev => {
          const filtered = prev.filter(u => u.id !== data.userId);
          return [...filtered, { id: data.userId, name: data.userName }];
        });
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
          setTyping(prev => prev.filter(u => u.id !== data.userId));
        }, 3000);
      }
    };
    
    const handleUserStoppedTyping = (data) => {
      setTyping(prev => prev.filter(u => u.id !== data.userId));
    };
    
    const handleParticipantsUpdated = (data) => {
      setParticipants(data.participants || []);
    };
    
    // Register event listeners
    webSocketService.on('connected', handleConnected);
    webSocketService.on('disconnected', handleDisconnected);
    webSocketService.on('error', handleError);
    webSocketService.on('auth_error', handleAuthError);
    webSocketService.on('chat-message', handleChatMessage);
    webSocketService.on('typing-start', handleUserTyping);
    webSocketService.on('typing-stop', handleUserStoppedTyping);
    webSocketService.on('participants-updated', handleParticipantsUpdated);
    
    // Cleanup function
    return () => {
      webSocketService.off('connected', handleConnected);
      webSocketService.off('disconnected', handleDisconnected);
      webSocketService.off('error', handleError);
      webSocketService.off('auth_error', handleAuthError);
      webSocketService.off('chat-message', handleChatMessage);
      webSocketService.off('typing-start', handleUserTyping);
      webSocketService.off('typing-stop', handleUserStoppedTyping);
      webSocketService.off('participants-updated', handleParticipantsUpdated);
    };
  }, [roomId, user.id, user.name, onMessageCount]);
  
  const loadMessageHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${apiBaseUrl}/api/chat/rooms/${roomId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Handle both response formats
        const messages = data.success ? data.data?.messages : data.messages || [];
        setMessages(messages);
        if (onMessageCount) {
          onMessageCount(messages.length);
        }
      } else {
        console.error('Failed to load message history:', response.status);
      }
    } catch (error) {
      console.error('Error loading message history:', error);
    }
  };
  
  const sendMessage = async () => {
    if (!newMessage.trim() || !isConnected) return;
    
    const messageData = {
      content: newMessage.trim(),
      type: 'text',
      roomId,
      timestamp: new Date().toISOString()
    };
    
    try {
      // Send via Socket.IO for real-time delivery
      const success = webSocketService.sendChatMessage(messageData);
      
      if (success) {
        // Also persist to backend API
        const token = localStorage.getItem('token');
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        
        await fetch(`${apiBaseUrl}/api/chat/rooms/${roomId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(messageData)
        });
        
        setNewMessage('');
        stopTyping();
      } else {
        throw new Error('Failed to send message via WebSocket');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Handle typing indicator
    if (e.target.value.trim()) {
      if (!typingTimeoutRef.current) {
        // Send typing start via Socket.IO
        if (webSocketService.isConnected()) {
          webSocketService.send('typing-start', {
            roomId,
            userId: user.id,
            userName: user.name
          });
        }
      }
      
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(stopTyping, 2000);
    } else {
      stopTyping();
    }
  };
  
  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
      
      // Send stop typing via Socket.IO
      if (webSocketService.isConnected()) {
        webSocketService.send('typing-stop', {
          roomId,
          userId: user.id
        });
      }
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const deleteMessage = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      await fetch(`${apiBaseUrl}/api/chat/rooms/${roomId}/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Send delete notification via Socket.IO
      if (webSocketService.isConnected()) {
        webSocketService.send('delete-message', {
          messageId,
          roomId
        });
      }
      
      // Remove from local state immediately
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };
  
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
  const getUserColor = (userId) => {
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
      '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'
    ];
    const index = userId?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };
  
  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };
  
  const groupMessages = (messages) => {
    const groups = [];
    let currentGroup = null;
    
    messages.forEach((message) => {
      if (
        !currentGroup ||
        currentGroup.userId !== message.userId ||
        new Date(message.timestamp) - new Date(currentGroup.lastTimestamp) > 300000 // 5 minutes
      ) {
        currentGroup = {
          userId: message.userId,
          userName: message.userName,
          userAvatar: message.userAvatar,
          messages: [message],
          lastTimestamp: message.timestamp
        };
        groups.push(currentGroup);
      } else {
        currentGroup.messages.push(message);
        currentGroup.lastTimestamp = message.timestamp;
      }
    });
    
    return groups;
  };
  
  const messageGroups = groupMessages(messages);
  
  return (
    <ChatContainer style={{ height }}>
      <ChatHeader>
        <ChatTitle>
          <MessageCircle />
          Chat
        </ChatTitle>
        <ParticipantCount>
          <Users />
          {participants.length}
        </ParticipantCount>
      </ChatHeader>
      
      <MessagesContainer>
        {messageGroups.length === 0 ? (
          <EmptyState>
            <MessageCircle />
            <div>No messages yet</div>
            <div>Start the conversation!</div>
          </EmptyState>
        ) : (
          messageGroups.map((group, groupIndex) => (
            <MessageGroup 
              key={groupIndex} 
              isOwn={group.userId === user.id}
            >
              <MessageHeader isOwn={group.userId === user.id}>
                <UserAvatar color={getUserColor(group.userId)}>
                  {group.userAvatar ? (
                    <img src={group.userAvatar} alt={group.userName} />
                  ) : (
                    getInitials(group.userName)
                  )}
                </UserAvatar>
                <UserName>{group.userName}</UserName>
                <MessageTime>
                  {new Date(group.messages[0].timestamp).toLocaleTimeString()}
                </MessageTime>
              </MessageHeader>
              
              {group.messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  isOwn={group.userId === user.id}
                >
                  {message.content}
                  
                  <MessageActions 
                    className="message-actions"
                    isOwn={group.userId === user.id}
                  >
                    <ActionButton title="Reply">
                      <Reply />
                    </ActionButton>
                    <ActionButton title="React">
                      <Smile />
                    </ActionButton>
                    {group.userId === user.id && (
                      <>
                        <ActionButton title="Edit">
                          <Edit3 />
                        </ActionButton>
                        <ActionButton 
                          title="Delete"
                          onClick={() => deleteMessage(message.id)}
                        >
                          <Trash2 />
                        </ActionButton>
                      </>
                    )}
                    <ActionButton title="More">
                      <MoreVertical />
                    </ActionButton>
                  </MessageActions>
                  
                  {message.edited && (
                    <MessageStatus isOwn={group.userId === user.id}>
                      edited
                    </MessageStatus>
                  )}
                </MessageBubble>
              ))}
            </MessageGroup>
          ))
        )}
        
        {typing.length > 0 && (
          <TypingIndicator>
            {typing.map(u => u.name).join(', ')} {typing.length === 1 ? 'is' : 'are'} typing...
          </TypingIndicator>
        )}
        
        <div ref={messagesEndRef} />
      </MessagesContainer>
      
      <InputContainer>
        <InputWrapper>
          <MessageInput
            ref={inputRef}
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            rows={1}
            disabled={!isConnected}
          />
          
          <InputActions>
            <InputButton title="Attach file" disabled={!isConnected}>
              <Paperclip />
            </InputButton>
            <InputButton title="Emoji" disabled={!isConnected}>
              <Smile />
            </InputButton>
            <SendButton
              variant="primary"
              onClick={sendMessage}
              disabled={!newMessage.trim() || !isConnected}
              title="Send message"
            >
              <Send />
            </SendButton>
          </InputActions>
        </InputWrapper>
        
        {!isConnected && (
          <div style={{
            fontSize: '0.75rem',
            color: '#ef4444',
            marginTop: '0.5rem',
            textAlign: 'center'
          }}>
            Chat disconnected - trying to reconnect...
          </div>
        )}
      </InputContainer>
    </ChatContainer>
  );
};

export default ChatComponent;