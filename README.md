# StreamKit 🎮

> A full-stack web application that empowers streamers to create and manage custom overlays, scenes, and alerts for their live streams — powered by the Twitch API.

---

## 🖼️ Screenshots

| Login | Dashboard |
|-------|-----------|
| ![Login](./streamkit/login.png) | ![Dashboard](./streamkit/dashboard.png) |

---

## ✨ Features

- 🔐 **User Authentication** — Secure login and sign up with email/password, Google OAuth, or Twitch OAuth
- 🖼️ **Overlay Manager** — Create and manage stream overlays from a clean dashboard
- 🎬 **Scene Builder** — Organize and switch between different stream scenes
- 🔔 **Custom Alerts** — Set up personalized alerts for follows, subs, donations, and more
- ⚙️ **Settings** — Manage your account and stream preferences
- 📡 **Twitch API Integration** — Connect directly to your Twitch channel

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React |
| Backend | Node.js, Express |
| Auth | JWT + Google OAuth + Twitch OAuth |
| External API | Twitch API |
| Hosting | Coming soon |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm or yarn
- A [Twitch Developer account](https://dev.twitch.tv/) with a registered app
- A [Google Cloud](https://console.cloud.google.com/) project with OAuth credentials

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/streamkit.git
cd streamkit

# 2. Install dependencies
cd client && npm install
cd ../server && npm install

# 3. Set up environment variables
cp .env.example .env

# 4. Start the development servers

# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm start
```

---

## 🔑 Environment Variables

Create a `.env` file in the `/server` directory based on `.env.example`:

```env
PORT=5000

# Twitch OAuth
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Auth
JWT_SECRET=your_jwt_secret
```

> ⚠️ Never commit your `.env` file. It is already included in `.gitignore`.

---

## 📁 Project Structure

```
streamkit/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route-level pages (Login, Dashboard, etc.)
│   │   ├── hooks/           # Custom React hooks
│   │   └── App.jsx
│   └── package.json
├── server/                  # Node/Express backend
│   ├── routes/              # API route definitions
│   ├── controllers/         # Route handler logic
│   ├── middleware/          # Auth and error middleware
│   └── index.js
├── screenshots/             # App screenshots for README
├── .env.example
├── .gitignore
└── README.md
```

---

## 🔮 Roadmap

- [ ] Deploy to Render / Railway
- [ ] Live preview of overlays before going live
- [ ] Export overlay as a browser source URL (OBS-ready)
- [ ] YouTube API support
- [ ] Community theme marketplace

---

## 🙋 Author

**Catarina Calabrese**
- GitHub: [@ccalabrese00](https://github.com/your-username)
- LinkedIn: [linkedin.com/in/Catarina-Calabrese](https://linkedin.com/in/your-profile)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
