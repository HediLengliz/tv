# 📺✨ Digital Screen Sharing Management System

> **Full-stack digital screen sharing  & broadcast platform**  
> Manage TVs, content & real-time broadcasts via a sleek web dashboard.

![License](https://img.shields.io/badge/license-MIT-blue)
![Build](https://img.shields.io/github/actions/workflow/status/yourusername/yourrepo/ci-cd.yml?branch=main)
![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

---

## 🚀 Overview

A modern platform that helps organizations **manage TV displays, upload & schedule content,** and handle **broadcasting operations** – all in real-time from a beautiful web dashboard.

✅ User authentication & roles  
✅ Register/manage TVs by MAC address  
✅ Upload & schedule images/videos  
✅ Real-time broadcasting control  
✅ Admin panel for users & content  
✅ In-app notifications & activity feed  

---

## 🛠️ Features

- **🔒 User Authentication & Roles**  
  Secure login, registration, email verification & role-based access (editor, manager, admin)

- **📺 TV Management**  
  Register, monitor, & control TVs by MAC address with real-time status (online, offline, maintenance)

- **🎞️ Content Management**  
  Upload, schedule & manage lifecycle: draft → active → scheduled → archived

- **📡 Broadcasting**  
  Start/stop broadcasts, assign content to TVs, monitor live status

- **👥 User Management**  
  Admin interface to manage users, roles, and activity

- **📊 Dashboard**  
  Real-time statistics and system activity feed

- **🔔 Notifications**  
  In-app alerts for system events and activities

---

## 🧩 Tech Stack

| Layer     | Tech                                                             |
| --------- | ---------------------------------------------------------------- |
| Frontend  | React 18 + TypeScript, Vite, TanStack Query, Shadcn/ui, Tailwind, React Hook Form + Zod |
| Backend   | Node.js + Express (TypeScript), REST API, bcrypt, JWT, Socket.IO |
| Database  | MongoDB (main data store), PostgreSQL (session storage)          |
| CI/CD     | GitHub Actions, see [`ci-cd.yml`](.github/workflows/ci-cd.yml)   |

---

## 📂 Project Structure

```plaintext
client/     → React frontend (dashboard UI)
server/     → Express backend (REST API + WebSockets)
.github/    → Workflows, CI/CD configs
dist/       → Production build outputs
.env        → Environment configs
