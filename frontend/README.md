# AI Interview Platform - Frontend

A modern, responsive React application for conducting AI-powered interviews with real-time evaluation and analytics.

## 🚀 Features

### Core Functionality
- **User Authentication** - Secure login/register with JWT tokens
- **Role-based Access Control** - Admin, Recruiter, and Candidate roles
- **Real-time Interviews** - Video/audio chat with Socket.IO integration
- **AI-powered Evaluation** - Intelligent candidate assessment
- **Interview Templates** - Reusable question sets and evaluation criteria
- **Analytics Dashboard** - Comprehensive performance insights
- **Profile Management** - User settings and preferences

### User Interface
- **Modern Design** - Clean, professional interface with Tailwind CSS
- **Responsive Layout** - Optimized for desktop, tablet, and mobile
- **Dark/Light Mode** - User preference support
- **Accessibility** - WCAG compliant components
- **Interactive Charts** - Data visualization with Recharts
- **Real-time Notifications** - Toast notifications and updates

### Technical Features
- **State Management** - Context API with useReducer
- **API Integration** - Axios with interceptors and error handling
- **Form Validation** - React Hook Form with validation rules
- **Route Protection** - Private routes with authentication guards
- **Code Splitting** - Lazy loading for optimal performance
- **Error Boundaries** - Graceful error handling

## 🛠 Tech Stack

- **React 19** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Hook Form** - Form state management
- **Tanstack Query** - Server state management
- **Axios** - HTTP client
- **Socket.IO** - Real-time communication
- **Framer Motion** - Smooth animations
- **Lucide React** - Beautiful icons
- **React Hot Toast** - Elegant notifications
- **Date-fns** - Date manipulation
- **Recharts** - Data visualization

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on http://localhost:5000

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at http://localhost:5173

### 4. Build for Production

```bash
npm run build
```

### 5. Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Common/          # Generic components (Button, Input, etc.)
│   └── Layout/          # Layout components (Header, Sidebar, etc.)
├── context/             # React Context providers
├── hooks/               # Custom React hooks
├── pages/               # Page components
│   ├── Auth/           # Authentication pages
│   ├── Dashboard/      # Dashboard page
│   ├── Interviews/     # Interview management
│   ├── Templates/      # Template management
│   ├── Analytics/      # Analytics and reports
│   └── Profile/        # User profile
├── utils/               # Utility functions
│   ├── api.js          # API client configuration
│   ├── constants.js    # Application constants
│   └── helpers.js      # Helper functions
├── App.jsx             # Main application component
├── main.jsx            # Application entry point
└── index.css           # Global styles
```

## 🎨 Design System

### Colors
- **Primary**: Blue tones for main actions and branding
- **Secondary**: Gray tones for text and backgrounds
- **Success**: Green for positive states
- **Warning**: Yellow for caution states
- **Danger**: Red for errors and destructive actions

### Typography
- **Font Family**: Inter (primary), system fonts fallback
- **Responsive Scaling**: Mobile-first approach with Tailwind utilities

### Components
- **Buttons**: Multiple variants (primary, secondary, success, danger)
- **Forms**: Consistent input styling with validation states
- **Cards**: Flexible container components
- **Badges**: Status and category indicators
- **Modals**: Accessible overlay components

## 🔐 Authentication

The application uses JWT-based authentication with the following flow:

1. User logs in with email/password
2. Server returns JWT token and user data
3. Token stored in cookies and localStorage
4. Token sent with all API requests
5. Automatic logout on token expiration

## 🛡 Security Features

- **HTTPS Only** cookies in production
- **XSS Protection** through React's built-in escaping
- **CSRF Protection** via SameSite cookies
- **Input Validation** on all forms
- **Route Protection** for authenticated pages
- **Role-based Access** control throughout the app

## 📱 Responsive Design

The application is fully responsive with breakpoints:

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

Key responsive features:
- Collapsible sidebar on mobile
- Stack navigation on small screens
- Optimized touch targets
- Readable typography scaling

## 🚀 Deployment

### Development
The app is currently running on http://localhost:5173

### Production
1. Build the project: `npm run build`
2. Deploy the `dist/` folder to your hosting provider
3. Configure environment variables for production API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is part of the AI Interview Platform system.

---

Built with ❤️ using React + Vite+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
