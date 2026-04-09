import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Session from '../models/Session.js';
import Vote from '../models/Vote.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const questions = JSON.parse(
  readFileSync(join(__dirname, '../../data/questions.json'), 'utf-8')
);

export function initSocket(io) {
  io.on('connection', (socket) => {
    console.log(`socket connected: ${socket.id}`);

    // client → server: join_session(code)
    // server → client: session_joined(question) | error(message)
    socket.on('join_session', async (code) => {
      try {
        const session = await Session.findOne({ code });

        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        if (session.status === 'closed') {
          socket.emit('error', { message: 'Session is closed' });
          return;
        }

        // Rooms: socket.join() registers this socket under the room named by `code`.
        // Any future io.to(code).emit() will reach every socket in this room.
        socket.join(code);

        const question = questions.find((q) => q.id === session.questionId);
        socket.emit('session_joined', { question });
      } catch (err) {
        console.error('join_session error:', err);
        socket.emit('error', { message: 'Internal server error' });
      }
    });

    // client → server: submit_vote(code, answerId)
    // server → room:   vote_update(results)
    socket.on('submit_vote', async ({ code, answerId }) => {
      try {
        const session = await Session.findOne({ code });

        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        if (session.status === 'closed') {
          socket.emit('error', { message: 'Session is closed' });
          return;
        }

        // Upsert: one vote per socket per session.
        // If the socket already voted, this updates answerId (change answer).
        await Vote.findOneAndUpdate(
          { sessionCode: code, socketId: socket.id },
          { answerId },
          { upsert: true, new: true }
        );

        const votes = await Vote.find({ sessionCode: code });

        // Reduce votes into [{ answerId, count }] sorted by answerId
        const tally = votes.reduce((acc, vote) => {
          acc[vote.answerId] = (acc[vote.answerId] ?? 0) + 1;
          return acc;
        }, {});

        const results = Object.entries(tally).map(([answerId, count]) => ({
          answerId,
          count,
        }));

        // io.to(room): broadcasts to every socket in the room, including the sender.
        // We want the voter to also receive updated results immediately.
        io.to(code).emit('vote_update', { results });
      } catch (err) {
        console.error('submit_vote error:', err);
        socket.emit('error', { message: 'Internal server error' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`socket disconnected: ${socket.id}`);
    });
  });
}
