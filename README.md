Digital Screen Sharing  Management System
Overview
This project is a full-stack digital Screen Sharing management system that enables organizations to manage TV displays, content, and broadcasting operations through a modern web dashboard. It features user authentication, role-based access control, and real-time management of digital signage content across multiple TV displays.
Features
User Authentication & Roles: Secure login, registration, email verification, and role-based access (editor, manager, admin).
TV Management: Register, monitor, and manage TV devices by MAC address, with real-time status updates (online, offline, broadcasting, maintenance).
Content Management: Upload and schedule content (images/videos), assign to TVs, manage content lifecycle (draft, active, scheduled, archived).
Broadcasting: Start/stop broadcasts, link content to TVs, track broadcast status in real time.
User Management: Admin interface for managing users, roles, and statuses.
Dashboard: Real-time statistics and activity feed for TVs, content, broadcasts, and users.
Notifications: In-app notifications for system events and activities.
Tech Stack
Frontend
Framework: React 18 + TypeScript
Routing: Wouter
State Management: TanStack Query (React Query)
UI: Shadcn/ui (Radix UI), Tailwind CSS
Forms: React Hook Form + Zod
Build Tool: Vite
Backend
Runtime: Node.js + Express.js (TypeScript)
API: RESTful, JSON responses
Authentication: Password-based, bcrypt hashing, JWT-like sessions
Database: MongoDB (Mongoose ORM)
Session Management: Express sessions with PostgreSQL store
WebSockets: Real-time updates via Socket.IO
Database
MongoDB: Main data store for users, TVs, content, broadcasts, notifications
PostgreSQL: Session storage (via connect-pg-simple)
Project Structure
Apply to ci-cd.yml
Getting Started
Prerequisites
Node.js (v18+)
npm
MongoDB & PostgreSQL instances (local or cloud)
Installation
Clone the repository:
Apply to ci-cd.yml
Run
Install dependencies:
Apply to ci-cd.yml
Run
Configure environment variables:
Create .env files in the root, client/, and server/ as needed for DB connections, secrets, etc.
Run the app in development:
Apply to ci-cd.yml
Run
This starts both frontend and backend with hot reloading.
Build for production:
Apply to ci-cd.yml
Run
Usage
Access the dashboard at http://localhost:3000
Register/login as a user
Manage TVs, content, users, and broadcasts from the dashboard
Deployment
The project is ready for deployment on platforms like Replit, Vercel, or your own server.
See .github/workflows/ci-cd.yml for CI/CD pipeline example.
Production build outputs to dist/public (frontend) and dist/index.js (backend).
Contributing
Fork the repo
Create your feature branch (git checkout -b feature/YourFeature)
Commit your changes (git commit -am 'Add some feature')
Push to the branch (git push origin feature/YourFeature)
Open a pull request
License
MIT
Acknowledgements
React
Express
MongoDB
Radix UI
Tailwind CSS
Socket.IO
Vite
