import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import sessionsRouter from './routes/sessions.js';
import { initSocket } from './socket/index.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

app.use(express.json());
app.use('/sessions', sessionsRouter);

initSocket(io);

export { app, server, io };
