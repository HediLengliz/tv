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


client/     → React frontend (dashboard UI)
server/     → Express backend (REST API + WebSockets)
.github/    → Workflows, CI/CD configs
dist/       → Production build outputs
.env        → Environment configs

## 🏗️ Getting Started
✅ Prerequisites
Node.js v18+

npm

MongoDB & PostgreSQL (local or cloud)

## ⚙️ Installation
bash
Copy
Edit
# Clone the repo
git clone https://github.com/hedilengliz/tv.git
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

## 📦 Production Build
bash
Copy
Edit
npm run build
Outputs:

Frontend: dist/public

Backend: dist/index.js

## 🚀 Deployment
Supports  Vercel, or your own server

See .github/workflows/ci-cd.yml for deployment pipeline example

## 🤝 Contributing
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

## 📜 License
This project is licensed under the MIT License.


## ❤️ Acknowledgements
React

Express

MongoDB

Socket.IO

Radix UI

Tailwind CSS

Vite

## Project Showcase 

<img width="1889" height="806" alt="aaaa" src="https://github.com/user-attachments/assets/312d525f-521a-44a7-9996-3a64e26ba32c" />
<img width="1893" height="805" alt="dfaezgf" src="https://github.com/user-attachments/assets/31731336-c9e9-4526-911f-aeaad92fa491" />
<img width="1849" height="804" alt="fezfze" src="https://github.com/user-attachments/assets/e6e39097-631b-4976-8350-ae2d654d041c" />
<img width="1783" height="787" alt="fafa" src="https://github.com/user-attachments/assets/1eced5f0-aa9e-4c02-a5e1-04cb5b3a5569" />
<img width="1858" height="878" alt="dash" src="https://github.com/user-attachments/assets/bb19d9ed-d8dd-4773-8bab-8c998d822530" />
<img width="1906" height="798" alt="meca" src="https://github.com/user-attachments/assets/04921818-1077-4d9d-9eda-0ef5fb7fa9cf" />
<img width="1835" height="815" alt="aaaave" src="https://github.com/user-attachments/assets/df7e0cb8-03f8-4839-82cf-59527de7cf77" />

<p align="center">
  <img src="https://i.imgflip.com/a02pfn.gif" alt="Demo of the app">
</p>

