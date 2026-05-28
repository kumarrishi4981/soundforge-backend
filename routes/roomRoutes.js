const express = require('express');

/**
 * Factory function — receives the in-memory rooms Map so the REST
 * layer can query live room state without a DB round-trip.
 */
module.exports = function createRoomRouter(rooms) {
  const router = express.Router();

  // GET /:code — Check if a room exists and return basic info
  router.get('/:code', (req, res) => {
    const code = (req.params.code || '').toUpperCase().trim();
    const room = rooms.get(code);

    if (!room) {
      return res.status(404).json({ exists: false, error: 'Room not found' });
    }

    res.json({
      exists: true,
      code,
      name: room.name,
      userCount: room.users.length,
      users: room.users.map(({ socketId, ...rest }) => rest),
      bpm: room.bpm,
      waveform: room.waveform,
      createdAt: room.createdAt,
    });
  });

  return router;
};
