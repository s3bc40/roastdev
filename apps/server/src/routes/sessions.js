import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Session from '../models/Session.js';
import Vote from '../models/Vote.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const questions = JSON.parse(
  readFileSync(join(__dirname, '../../data/questions.json'), 'utf-8')
);

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function createSessionsRouter(io) {
  const router = Router();

  // POST /sessions — host creates a new polling session
  router.post('/', async (req, res) => {
    const question = questions[Math.floor(Math.random() * questions.length)];

    const session = new Session({
      code: generateCode(),
      questionId: question.id,
    });

    await session.save();

    res.status(201).json({
      code: session.code,
      questionId: session.questionId,
      status: session.status,
    });
  });

  // GET /sessions/:code — return session + live vote tally
  router.get('/:code', async (req, res) => {
    const session = await Session.findOne({ code: req.params.code });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const votes = await Vote.find({ sessionCode: req.params.code });

    // Same tally logic as submit_vote in socket/index.js
    const tally = votes.reduce((acc, vote) => {
      acc[vote.answerId] = (acc[vote.answerId] ?? 0) + 1;
      return acc;
    }, {});

    const results = Object.entries(tally).map(([answerId, count]) => ({
      answerId,
      count,
    }));

    res.json({
      code: session.code,
      questionId: session.questionId,
      status: session.status,
      results,
    });
  });

  // PATCH /sessions/:code/close — set status to closed, broadcast to room
  router.patch('/:code/close', async (req, res) => {
    // findOneAndUpdate with { new: true } returns the updated doc atomically —
    // one DB round trip instead of findOne + save. No { upsert: true } here:
    // unlike submit_vote where we create-or-update a vote, closing a session
    // that does not exist makes no sense — null means 404.
    const session = await Session.findOneAndUpdate(
      { code: req.params.code },
      { status: 'closed' },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    io.to(req.params.code).emit('session_closed');

    res.json({
      code: session.code,
      questionId: session.questionId,
      status: session.status,
    });
  });

  return router;
}
