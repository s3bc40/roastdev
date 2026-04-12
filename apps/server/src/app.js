import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createSessionsRouter } from './routes/sessions.js';
import { initSocket } from './socket/index.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

// cors() adds Access-Control-Allow-Origin headers to every Express response.
// Without this, browser fetch() calls from localhost:5173 are blocked by the
// same-origin policy even though the Socket.io WS upgrade is already allowed.
// The Socket.io cors option only covers the WebSocket handshake, not REST.
app.use(cors());
app.use(express.json());
app.use('/sessions', createSessionsRouter(io));

initSocket(io);

export { app, server, io };
