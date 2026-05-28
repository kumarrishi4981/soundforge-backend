const crypto = require('crypto');

// ── In-memory state ──────────────────────────────────────────────────
const rooms = new Map();

const USER_COLORS = [
  '#ff2d95', // hot pink
  '#00f0ff', // cyan
  '#b44dff', // purple
  '#39ff14', // neon green
  '#ff6b2b', // orange
  '#ffdd00', // yellow
  '#ff4757', // red
  '#2ed573', // emerald
];

// ── Helpers ──────────────────────────────────────────────────────────

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

function createEmptyGrid() {
  return Array.from({ length: 16 }, () =>
    Array.from({ length: 16 }, () => false),
  );
}

function pickColor(users) {
  const usedColors = new Set(users.map((u) => u.color));
  return USER_COLORS.find((c) => !usedColors.has(c)) || USER_COLORS[users.length % USER_COLORS.length];
}

function findRoomBySocketId(socketId) {
  for (const [code, room] of rooms) {
    if (room.users.some((u) => u.socketId === socketId)) {
      return { code, room };
    }
  }
  return null;
}

// ── Socket handler ───────────────────────────────────────────────────

function initSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`⚡ Socket connected: ${socket.id}`);

    // ── room:create ────────────────────────────────────────────────
    socket.on('room:create', (data = {}) => {
      const username = (data.username || 'Anonymous').slice(0, 30);

      let code;
      do {
        code = generateRoomCode();
      } while (rooms.has(code));

      const color = USER_COLORS[0];
      const user = { socketId: socket.id, username, color };

      const room = {
        code,
        name: `${username}'s Room`,
        grid: data.grid || createEmptyGrid(),
        bpm: data.bpm || 120,
        waveform: data.waveform || 'triangle',
        synthConfig: data.synthConfig || {
          attack: 0.05,
          decay: 0.2,
          sustain: 0.3,
          release: 0.5,
          filterType: 'lowpass',
          filterFreq: 2000,
          filterQ: 1,
        },
        effects: data.effects || {
          reverb:     { enabled: false, roomSize: 0.7, wet: 0.3 },
          delay:      { enabled: false, time: 0.25, feedback: 0.3, wet: 0.3 },
          distortion: { enabled: false, amount: 0.5 },
          chorus:     { enabled: false, rate: 1.5, depth: 0.7 },
        },
        users: [user],
        createdAt: Date.now(),
      };

      rooms.set(code, room);
      socket.join(code);

      socket.emit('room:created', {
        code,
        grid: room.grid,
        bpm: room.bpm,
        waveform: room.waveform,
        synthConfig: room.synthConfig,
        effects: room.effects,
        users: room.users.map(({ socketId, ...rest }) => rest),
      });

      console.log(`🎹 Room ${code} created by ${username}`);
    });

    // ── room:join ──────────────────────────────────────────────────
    socket.on('room:join', (data = {}) => {
      const code = (data.code || '').toUpperCase().trim();
      const username = (data.username || 'Anonymous').slice(0, 30);

      const room = rooms.get(code);
      if (!room) {
        socket.emit('room:error', { message: 'Room not found' });
        return;
      }

      // Prevent duplicate join
      if (room.users.some((u) => u.socketId === socket.id)) {
        socket.emit('room:error', { message: 'Already in this room' });
        return;
      }

      const color = pickColor(room.users);
      const user = { socketId: socket.id, username, color };
      room.users.push(user);
      socket.join(code);

      // Send full state to the joiner
      socket.emit('room:joined', {
        code,
        grid: room.grid,
        bpm: room.bpm,
        waveform: room.waveform,
        synthConfig: room.synthConfig,
        effects: room.effects,
        users: room.users.map(({ socketId, ...rest }) => rest),
      });

      // Notify everyone else
      socket.to(code).emit('room:user-joined', {
        username,
        color,
        users: room.users.map(({ socketId, ...rest }) => rest),
      });

      console.log(`👤 ${username} joined room ${code}`);
    });

    // ── grid:toggle ────────────────────────────────────────────────
    socket.on('grid:toggle', (data = {}) => {
      const found = findRoomBySocketId(socket.id);
      if (!found) return;

      const { code, room } = found;
      const { row, col } = data;

      if (
        typeof row !== 'number' || typeof col !== 'number' ||
        row < 0 || row >= 16 || col < 0 || col >= 16
      ) return;

      room.grid[row][col] = !room.grid[row][col];

      socket.to(code).emit('grid:update', {
        row,
        col,
        active: room.grid[row][col],
      });
    });

    // ── grid:clear ─────────────────────────────────────────────────
    socket.on('grid:clear', () => {
      const found = findRoomBySocketId(socket.id);
      if (!found) return;

      const { code, room } = found;
      room.grid = createEmptyGrid();

      socket.to(code).emit('grid:cleared');
    });

    // ── transport:play ─────────────────────────────────────────────
    socket.on('transport:play', () => {
      const found = findRoomBySocketId(socket.id);
      if (!found) return;

      socket.to(found.code).emit('transport:play');
    });

    // ── transport:stop ─────────────────────────────────────────────
    socket.on('transport:stop', () => {
      const found = findRoomBySocketId(socket.id);
      if (!found) return;

      socket.to(found.code).emit('transport:stop');
    });

    // ── transport:bpm ──────────────────────────────────────────────
    socket.on('transport:bpm', (data = {}) => {
      const found = findRoomBySocketId(socket.id);
      if (!found) return;

      const bpm = Number(data.bpm);
      if (!bpm || bpm < 20 || bpm > 300) return;

      found.room.bpm = bpm;
      socket.to(found.code).emit('transport:bpm', { bpm });
    });

    // ── synth:waveform ─────────────────────────────────────────────
    socket.on('synth:waveform', (data = {}) => {
      const found = findRoomBySocketId(socket.id);
      if (!found) return;

      const valid = ['sine', 'square', 'sawtooth', 'triangle'];
      if (!valid.includes(data.waveform)) return;

      found.room.waveform = data.waveform;
      socket.to(found.code).emit('synth:waveform', { waveform: data.waveform });
    });

    // ── synth:config ───────────────────────────────────────────────
    socket.on('synth:config', (data = {}) => {
      const found = findRoomBySocketId(socket.id);
      if (!found) return;

      found.room.synthConfig = { ...found.room.synthConfig, ...data };
      socket.to(found.code).emit('synth:config', found.room.synthConfig);
    });

    // ── cursor:move ────────────────────────────────────────────────
    socket.on('cursor:move', (data = {}) => {
      const found = findRoomBySocketId(socket.id);
      if (!found) return;

      const user = found.room.users.find((u) => u.socketId === socket.id);
      if (!user) return;

      socket.to(found.code).emit('cursor:move', {
        username: user.username,
        color: user.color,
        x: data.x,
        y: data.y,
      });
    });

    // ── room:load-pattern ──────────────────────────────────────────
    socket.on('room:load-pattern', (data = {}) => {
      const found = findRoomBySocketId(socket.id);
      if (!found) return;

      const { code, room } = found;

      room.grid = data.grid || createEmptyGrid();
      room.bpm = data.bpm || 120;
      room.waveform = data.waveform || 'triangle';
      room.synthConfig = data.synthConfig || room.synthConfig;
      room.effects = data.effects || room.effects;

      // Broadcast full state to everyone in the room
      io.to(code).emit('room:pattern-loaded', {
        grid: room.grid,
        bpm: room.bpm,
        waveform: room.waveform,
        synthConfig: room.synthConfig,
        effects: room.effects,
      });

      console.log(`🎹 Preset pattern loaded in Room ${code}`);
    });

    // ── disconnect ─────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`💔 Socket disconnected: ${socket.id}`);

      const found = findRoomBySocketId(socket.id);
      if (!found) return;

      const { code, room } = found;
      const leavingUser = room.users.find((u) => u.socketId === socket.id);

      room.users = room.users.filter((u) => u.socketId !== socket.id);

      if (room.users.length === 0) {
        rooms.delete(code);
        console.log(`🗑️  Room ${code} deleted (empty)`);
      } else {
        socket.to(code).emit('room:user-left', {
          username: leavingUser ? leavingUser.username : 'Unknown',
          users: room.users.map(({ socketId, ...rest }) => rest),
        });
      }
    });
  });
}

// Export both the handler and the rooms Map (for REST route access)
module.exports = { initSocketHandlers, rooms };
