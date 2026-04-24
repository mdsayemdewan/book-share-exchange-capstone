# 📚 Book Share & Exchange Platform

> A full-stack community platform where users can **share books for borrowing** and **exchange books with others** — powered by React, Express, and MongoDB.

---

## 🌟 Features

### 👤 User
- **Register & Login** — Secure JWT-based authentication with profile photo upload and location selection on a map
- **Admin Approval Flow** — New accounts require admin approval before access is granted
- **Share a Book** — List books available for lending with condition, category, duration, and images
- **Borrow a Book** — Browse available listings, request to borrow, and track due dates
- **Approve / Reject Borrow Requests** — Book owners manage incoming borrow requests
- **Return Confirmation** — Either party can mark a book as returned
- **Report Issues** — Flag problems with any borrow transaction
- **Exchange a Book** — Post an exchange offer and propose/accept book-for-book swaps
- **Chat** — Private messaging between exchange participants after a deal is accepted
- **Notifications** — Real-time alerts for borrow updates, exchange decisions, and new messages
- **Points & Leaderboard** — Earn points for sharing (+1) and completing exchanges (+1 each), visible on a public ranking page
- **Interactive Map** — View book locations using Leaflet.js maps

### 🛡️ Admin
- **User Management** — View, approve, or reject pending registrations
- **Content Moderation** — Delete any share listing or exchange offer
- **Reset Points** — Reset all user points to zero
- **Dashboard Overview** — See platform statistics at a glance

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6 |
| **Backend** | Node.js, Express.js (ESM) |
| **Database** | MongoDB with Mongoose ODM |
| **Authentication** | JSON Web Tokens (JWT), bcryptjs |
| **Image Upload** | ImgBB API |
| **Maps** | Leaflet.js |
| **Deployment** | Vercel (Frontend & Backend) |

---

## ⚙️ Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **ImgBB API Key** — free at [imgbb.com](https://api.imgbb.com/)

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/book-share-exchange-capstone.git
cd book-share-exchange-capstone
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file based on the example:

```bash
cp .env.example .env
```

Fill in your `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/book_distribution
JWT_SECRET=your_long_random_secret_here
IMGBB_API_KEY=your_imgbb_api_key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password
```

Seed the admin user:

```bash
npm run seed:admin
```

Start the backend:

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

The backend runs on **http://localhost:5000**

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

The frontend runs on **http://localhost:5173**

---

## 🔐 User Roles

| Role | Access |
|---|---|
| **Guest** | View home page, book listings, leaderboard |
| **User** (approved) | Share books, borrow, exchange, chat, view dashboard |
| **Admin** | All user features + approve users, moderate content, reset points |

> ⚠️ New user accounts start with **Pending** status and must be approved by an admin before they can log in.


---

## 📦 Deployment

This project is deployed on **Vercel**.

- Backend: configured via `backend/vercel.json`
- Frontend: configured via `frontend/vercel.json`

Set all environment variables in your Vercel project dashboard before deploying.

---

## 📄 License

This project is for academic/educational purposes as part of a capstone submission.
