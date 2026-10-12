# 🔊 SoundForge Backend — Collaborative Music & Room Synchronization API

> The real-time multiplayer coordination and pattern persistence engine powering SoundForge. Manages live collaborative audio rooms, WebSocket session synchronization, and cloud preset storage.

[![Live API](https://img.shields.io/badge/API-Live_Deployment-success?style=for-the-badge&logo=render&logoColor=white)](https://soundforge-api.onrender.com)
[![Frontend Client](https://img.shields.io/badge/Frontend-soundforge--frontend-purple?style=for-the-badge&logo=vercel)](https://soundforge-frontend.vercel.app/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8+-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

---

### 🌐 Live Deployments
- **REST & WebSocket API Base URL**: [https://soundforge-api.onrender.com/](https://soundforge-api.onrender.com/)
- **Web Client Application**: [https://soundforge-frontend.vercel.app/](https://soundforge-frontend.vercel.app/)

---

![SoundForge Studio Preview](soundforge_preview.png)

---

## 📌 Overview

**SoundForge Backend** is the event-driven coordination server for collaborative musical sessions. When multiple musicians join a SoundForge studio room, this service acts as the central orchestrator:
- Broadcasting note triggers, matrix toggles, synth knob twists, and transport controls across all connected peers with low latency.
- Persisting and retrieving custom 16×16 step sequences, audio patches, and arrangement presets to MongoDB.

---

## ✨ Core Features

- **⚡ Real-Time Studio Room Management**:
  - Isolated multi-tenant rooms powered by **Socket.io**.
  - Dynamic room creation, instant peer discovery, and active user presence tracking.
- **🔄 Low-Latency State Synchronization**:
  - **Grid Events**: Instant synchronization when any collaborator activates or deactivates a beat step.
  - **Synthesizer Telemetry**: Broadcasts real-time knob adjustments (cutoff frequency, resonance, ADSR envelope, delay/reverb wetness).
  - **Transport Clock**: Global playback sync for Play, Pause, Reset, and BPM tempo alterations.
- **💾 Pattern Library Persistence**:
  - RESTful endpoints to save, search, and load step sequences and sound designs stored in MongoDB with Mongoose.
- **🛡️ Security & Performance**:
  - CORS security policies configured for verified frontend origins.
  - Helmet middleware for HTTP header hardening.

---

## 🛠️ Architecture & System Design

```text
┌─────────────────────────────────┐         Socket.io (Room Events)       ┌─────────────────────────────────┐
│     Client A (Browser)          │ <===================================> │                                 │
└─────────────────────────────────┘                                       │    SoundForge Express Server    │
                                                                          │       (Socket.io Engine)        │
┌─────────────────────────────────┐         Socket.io (Room Events)       │                                 │
│     Client B (Browser)          │ <===================================> │                                 │
└─────────────────────────────────┘                                       └────────────────┬────────────────┘
                                                                                           │
                                                                                           ▼
                                                                                  ┌──────────────────┐
                                                                                  │  MongoDB Atlas   │
                                                                                  │ (Patterns & Presets)
                                                                                  └──────────────────┘
```

---

## 📡 WebSocket Event Reference

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join-room` | Client $\rightarrow$ Server | `{ roomId, userName }` | Joins a collaborative studio session |
| `user-joined` | Server $\rightarrow$ Room | `{ userId, userName, users }` | Notifies peers of a new collaborator |
| `toggle-step` | Client $\rightarrow$ Server | `{ trackIndex, stepIndex, state }` | Broadcasts grid cell toggles |
| `update-bpm` | Client $\rightarrow$ Server | `{ bpm }` | Syncs tempo changes to all connected peers |
| `update-synth`| Client $\rightarrow$ Server | `{ param, value }` | Broadcasts slider and knob tweaks |
| `transport-control` | Client $\rightarrow$ Server | `{ action: 'play' \| 'stop' }` | Synchronizes audio playback state |

---

## 📂 Project Structure

```text
soundforge-backend/
├── routes/                      # Express REST API routes
│   ├── patternRoutes.js         # Save, fetch & list music patterns
│   └── roomRoutes.js            # Room query & validation endpoints
├── models/                      # Mongoose schemas
│   ├── Pattern.js               # Matrix grid, BPM, synth settings & metadata
│   └── Room.js                  # Temporary & persistent room states
├── sockets/                     # Socket.io event controllers
│   └── roomHandler.js           # Room join, leave, and audio state broadcast logic
├── server.js                    # Express application & HTTP server initialization
├── package.json
└── README.md                    # Documentation
```

---

## 🚀 Local Setup & Installation

### Prerequisites
- **Node.js** (v18+) and **npm**
- **MongoDB** instance (local MongoDB or free MongoDB Atlas URI)

### 1. Clone the Repository
```bash
git clone https://github.com/kumarrishi4981/soundforge-backend.git
cd soundforge-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
```

### 4. Start Server
```bash
# Production mode:
npm start

# Development mode (with live reload):
npm run dev
```
The server will start on `http://localhost:5000`.

---

## ☁️ Deployment (Render)

This backend is pre-configured for one-click deployment on **Render**:
1. Create a **New Web Service** connected to this repository.
2. Build Command: `npm install`
3. Start Command: `node server.js`
4. Environment Variables:
   - `MONGO_URI` = `<your_mongo_connection_uri>`
   - `CLIENT_URL` = `https://soundforge-frontend.vercel.app`
5. Render automatically binds the port via `process.env.PORT`.

---

## 🤝 Contributing
Contributions, audio DSP optimizations, and bug reports are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/MidiSyncSocket`)
3. Commit your Changes (`git commit -m 'feat: Add MIDI clock sync event'`)
4. Push to the Branch (`git push origin feature/MidiSyncSocket`)
5. Open a Pull Request

---

## 📄 License
This project is open-source under the **MIT License**.

---

## 👤 Author
- **Rishi Kumar**
- GitHub: [@kumarrishi4981](https://github.com/kumarrishi4981)
- Live API: [SoundForge on Render](https://soundforge-api.onrender.com/)
