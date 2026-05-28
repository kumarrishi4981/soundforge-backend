require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const patternRoutes = require('./routes/patternRoutes');
const createRoomRouter = require('./routes/roomRoutes');
const { initSocketHandlers, rooms } = require('./socket/roomHandler');

// ── Config ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/soundforge';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const allowedOrigins = [
  'http://localhost:5173',
  CLIENT_URL,
].filter(Boolean);

// ── Express ──────────────────────────────────────────────────────────
const app = express();

app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// ── HTTP + Socket.io ─────────────────────────────────────────────────
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket'],
});

// ── Routes ───────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.send('🎵 SoundForge API is running!');
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/patterns', patternRoutes);
app.use('/api/rooms', createRoomRouter(rooms));

// ── Global error handler ─────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('❌ Unhandled error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ── Socket handlers ──────────────────────────────────────────────────
initSocketHandlers(io);

// ── MongoDB + Server start ───────────────────────────────────────────
async function start() {
  try {
    // Attempt connection with a shorter timeout so it doesn't block server startup
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 4000,
    });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('⚠️  Failed to connect to MongoDB:', err.message);
    console.log('⚡ Running in in-memory offline mode (saving patterns to database will be disabled).');
  }

  server.listen(PORT, () => {
    console.log(`🚀 SoundForge API listening on port ${PORT}`);
  });
}

start();

// ── Graceful shutdown ────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received — shutting down gracefully');

  io.close();

  server.close(async () => {
    try {
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
    } catch (err) {
      console.error('⚠️  Error closing MongoDB:', err.message);
    }
    process.exit(0);
  });

  // Force exit after 10 s if connections hang
  setTimeout(() => {
    console.error('⚠️  Forcing shutdown after timeout');
    process.exit(1);
  }, 10_000);
});
