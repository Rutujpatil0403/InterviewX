# InterviewX

## Overview
InterviewX is a modern, full-stack platform designed to streamline and enhance the interview process for organizations. It integrates real-time communication, scheduling, analytics, and AI-powered features to deliver a seamless experience for both interviewers and candidates.

## Features
- Real-time chat and messaging
- Interview scheduling and calendar integration
- Role-based user authentication
- File uploads (resumes, documents, media)
- Analytics and reporting on interview outcomes
- AI-powered interview evaluation and feedback
- Notification system for reminders and updates
- Modular frontend with React and Vite
- RESTful backend API with Node.js and Express

## Technology Stack
- **Frontend:** React, Vite, JavaScript, CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Authentication:** JWT, custom middleware
- **Real-time Communication:** Socket.IO
- **Other:** PowerShell (for automation), ESLint (linting), custom hooks and context

## Project Structure
```
InterviewX/
├── package.json
├── PROJECT_DOCUMENTATION.md
├── PROJECT_PLAN.md
├── Backend/
│   ├── package.json
│   ├── server.js
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── img/
│   ├── scripts/
│   ├── Socket.IO/
│   ├── uploads/
├── Documentation/
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── src/
│   ├── public/
│   ├── README.md
│   ├── ...
├── images/
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher recommended)
- npm (comes with Node.js)
- MongoDB (local or cloud instance)

### Backend Setup
1. Navigate to the `Backend` directory:
   ```powershell
   cd Backend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Configure environment variables:
   - Create a `.env` file in `Backend/` with the following:
     ```env
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     PORT=5000
     ```
4. Start the backend server:
   ```powershell
   npm start
   ```
   The backend will run on `http://localhost:5000` by default.

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```powershell
   cd frontend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the frontend development server:
   ```powershell
   npm run dev
   ```
   The frontend will run on `http://localhost:3000` by default.

### Additional Setup
- Ensure MongoDB is running and accessible.
- Update API endpoints in frontend config if backend runs on a different port.
- For production, build the frontend using `npm run build` and serve with a static server or integrate with backend.

## Usage
- Register or log in as a user (admin/interviewer/candidate).
- Schedule interviews, send/receive messages, and upload documents.
- Access analytics and feedback after interviews.

## Screenshots

- Home Page
![alt text](<Screenshot 2025-10-14 at 13-08-33 InterviewX Automate Your Interviews.png>)
- Dashboard
![alt text](<Screenshot 2025-10-14 at 13-11-02 InterviewX Automate Your Interviews.png>)
- Interview
![alt text](<Screenshot 2025-10-14 at 13-11-49 InterviewX Automate Your Interviews.png>)

## Contributing
1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Create a Pull Request

## License
This project is licensed under the MIT License.

## Contact
For questions or support, open an issue or contact the maintainer at [GitHub](https://github.com/1510darshan).
