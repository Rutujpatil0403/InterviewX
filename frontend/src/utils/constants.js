// src/utils/constants.js
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const USER_ROLES = {
  ADMIN: 'Admin',
  RECRUITER: 'Recruiter',
  CANDIDATE: 'Candidate'
};

export const INTERVIEW_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const QUESTION_TYPES = {
  TECHNICAL: 'technical',
  BEHAVIORAL: 'behavioral',
  SITUATIONAL: 'situational',
  CODING: 'coding'
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  INTERVIEWS: '/interviews',
  TEMPLATES: '/templates',
  ANALYTICS: '/analytics',
  PROFILE: '/profile',
  INTERVIEW_ROOM: '/interview',
  FEEDBACK: '/feedback'
};

export const SOCKET_EVENTS = {
  JOIN_INTERVIEW: 'join_interview',
  LEAVE_INTERVIEW: 'leave_interview',
  SEND_MESSAGE: 'send_message',
  RECEIVE_MESSAGE: 'receive_message',
  INTERVIEW_STARTED: 'interview_started',
  INTERVIEW_ENDED: 'interview_ended',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left'
};
