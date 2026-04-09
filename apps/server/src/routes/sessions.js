import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Session from '../models/Session.js';

const router = Router();

const __dirname = dirname(fileURLToPath(import.meta.url));
const questions = JSON.parse(
  readFileSync(join(__dirname, '../../data/questions.json'), 'utf-8')
);

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

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

export default router;
