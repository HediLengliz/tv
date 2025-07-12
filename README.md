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


🏗️ Getting Started
✅ Prerequisites
Node.js v18+

npm

MongoDB & PostgreSQL (local or cloud)

⚙️ Installation
bash
Copy
Edit
# Clone the repo
git clone https://github.com/yourusername/yourrepo.git
cd yourrepo

# Install dependencies
npm install
🧪 Development
bash
Copy
Edit
# Create .env files in root, client/, and server/ folders
# Add DB connection strings, secrets, etc.

# Start frontend & backend with hot reloading
npm run dev
Access the dashboard: http://localhost:3000

📦 Production Build
bash
Copy
Edit
npm run build
Outputs:

Frontend: dist/public

Backend: dist/index.js

🚀 Deployment
Supports Replit, Vercel, or your own server

See .github/workflows/ci-cd.yml for deployment pipeline example

🤝 Contributing
bash
Copy
Edit
# Fork the repo
# Create your feature branch
git checkout -b feature/YourFeature

# Commit changes
git commit -am 'Add some feature'

# Push & open a pull request
git push origin feature/YourFeature
All contributions are welcome! 🎉

📜 License
This project is licensed under the MIT License.
<img width="1783" height="787" alt="fafa" src="https://github.com/user-attachments/assets/b6fd7895-4d91-4334-ad3f-56a16f2b95f2" />
<img width="1893" height="805" alt="dfaezgf" src="https://github.com/user-attachments/assets/45c3a644-d704-4ac0-9a01-7043671e3068" />
<img width="1849" height="804" alt="fezfze" src="https://github.com/user-attachments/assets/c9769f36-dc09-4dec-9bda-d8ed3cb7c527" />

❤️ Acknowledgements
React

Express

MongoDB

Socket.IO
<img width="1913" height="854" alt="image" src="https://github.com/user-attachments/assets/f1b94f4e-099a-4a7c-af3b-a9012f450001" />

Radix UI

Tailwind CSS





Vite
https://github.com/user-attachments/assets/abdf685e-ec62-404e-9bb7-747a3051c2d5
<img width="1709" height="805" alt="image" src="https://github.com/user-attachments/assets/22aed320-4d44-42a8-8625-7d21217da9de" />
<img width="1902" height="908" alt="image (1)" src="https://github.com/user-attachments/assets/6e641c23-e3ab-494a-b2e4-1f2b733f1291" />


