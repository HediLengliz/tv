# Digital Signage Management System

## Overview

This is a full-stack digital signage management system built with React, Express, and MongoDB. The application allows users to manage TV displays, content, and broadcasting operations through a web-based dashboard. It features user authentication, role-based access control, and real-time management of digital signage content across multiple TV displays.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API with JSON responses
- **Session Management**: Express sessions with PostgreSQL session store
- **Authentication**: Password-based authentication with bcrypt hashing
- **Development**: Hot reloading with Vite integration in development mode

### Database Architecture
- **Database**: MongoDB with Drizzle ORM
- **Schema**: Relational database with four main tables:
  - `users`: User management with role-based access (editor, manager, admin)
  - `tvs`: TV display management with MAC address tracking and status
  - `content`: Content management with image URLs and scheduling
  - `broadcasts`: Active broadcast tracking linking content to TVs
- **Migrations**: Drizzle Kit for schema migrations
- **Connection**: Neon Database serverless MOngoDB

## Key Components

### Authentication System
- Email/password authentication with secure password hashing
- Role-based access control (editor, manager, admin)
- Client-side authentication state management with localStorage
- Protected routes with authentication guards

### TV Management
- TV registration and status tracking (online, offline, broadcasting, maintenance)
- MAC address-based device identification
- Real-time status monitoring and updates
- Search and filtering capabilities

### Content Management
- Content creation with image upload support
- Status management (draft, active, scheduled, archived)
- TV selection for targeted content distribution
- Content scheduling and lifecycle management

### User Management
- User registration and profile management
- Role assignment and status control (pending, active, inactive)
- Administrative user management interface

### Broadcasting System
- Real-time broadcast management linking content to specific TVs
- Broadcast status tracking (active, stopped, error)
- Start/stop broadcast controls with timestamp tracking

## Data Flow

1. **Authentication Flow**: User logs in → credentials validated → JWT-like session created → user redirected to dashboard
2. **Content Creation Flow**: User creates content → uploads images → selects target TVs → content saved with draft status
3. **Broadcasting Flow**: User activates content → broadcast records created for selected TVs → TV status updated to broadcasting
4. **Management Flow**: Dashboard displays real-time statistics → users can manage TVs, content, and broadcasts through dedicated interfaces

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database operations with automatic migrations

### UI/UX
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography

### Development Tools
- **Vite**: Fast build tool with hot module replacement
- **TypeScript**: Type safety across the entire stack
- **ESLint**: Code linting and formatting

## Deployment Strategy

### Production Build
- Frontend: Vite builds static assets to `dist/public`
- Backend: esbuild bundles server code to `dist/index.js`
- Single deployment artifact with both frontend and backend

### Environment Configuration
- Development: `npm run dev` starts both frontend and backend with hot reloading
- Production: `npm run start` serves the bundled application
- Database: Automatic provisioning on Replit with PostgreSQL module

### Replit Integration
- Configured for Replit's autoscale deployment target
- Port 5000 mapped to external port 80
- Integrated with Replit's development tools and error overlay

## Changelog

- June 18, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.
