import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock Session before any module that imports it is loaded.
// Static methods (findOne, findOneAndUpdate) are set on the constructor
// function itself so they survive the import cycle.
vi.mock('../models/Session.js', () => {
  const Session = vi.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this.status = 'open';
  });
  Session.prototype.save = vi.fn().mockResolvedValue(undefined);
  Session.findOne = vi.fn();
  Session.findOneAndUpdate = vi.fn();
  return { default: Session };
});

vi.mock('../models/Vote.js', () => ({
  default: { find: vi.fn() },
}));

const { default: Session } = await import('../models/Session.js');
const { default: Vote } = await import('../models/Vote.js');
const { createSessionsRouter } = await import('../routes/sessions.js');

// Mock io: io.to(code).emit(event) — two chained calls.
// We capture both so tests can assert the broadcast happened.
const mockEmit = vi.fn();
const mockIo = { to: vi.fn().mockReturnValue({ emit: mockEmit }) };

const app = express();
app.use(express.json());
app.use('/sessions', createSessionsRouter(mockIo));

describe('POST /sessions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 201 with code, questionId, and status', async () => {
    const res = await request(app).post('/sessions');

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      code: expect.stringMatching(/^[A-Z0-9]{6}$/),
      questionId: expect.stringMatching(/^q\d+$/),
      status: 'open',
    });
  });
});

describe('GET /sessions/:code', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with session and vote tally', async () => {
    Session.findOne.mockResolvedValue({
      code: 'ABC123',
      questionId: 'q1',
      status: 'open',
    });
    Vote.find.mockResolvedValue([
      { answerId: 'a1' },
      { answerId: 'a2' },
      { answerId: 'a1' },
    ]);

    const res = await request(app).get('/sessions/ABC123');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      code: 'ABC123',
      questionId: 'q1',
      status: 'open',
      results: expect.arrayContaining([
        { answerId: 'a1', count: 2 },
        { answerId: 'a2', count: 1 },
      ]),
    });
  });

  it('returns 404 when session is not found', async () => {
    Session.findOne.mockResolvedValue(null);

    const res = await request(app).get('/sessions/NOPE99');

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ message: 'Session not found' });
  });
});

describe('PATCH /sessions/:code/close', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with closed session and emits session_closed', async () => {
    Session.findOneAndUpdate.mockResolvedValue({
      code: 'ABC123',
      questionId: 'q1',
      status: 'closed',
    });

    const res = await request(app).patch('/sessions/ABC123/close');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ code: 'ABC123', status: 'closed' });
    expect(mockIo.to).toHaveBeenCalledWith('ABC123');
    expect(mockEmit).toHaveBeenCalledWith('session_closed');
  });

  it('returns 404 when session is not found', async () => {
    Session.findOneAndUpdate.mockResolvedValue(null);

    const res = await request(app).patch('/sessions/NOPE99/close');

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ message: 'Session not found' });
  });
});
