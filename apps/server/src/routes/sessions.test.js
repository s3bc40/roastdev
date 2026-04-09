import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock Mongoose save before importing the app so the model never touches a DB
vi.mock('../models/Session.js', () => {
  const Session = vi.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this.status = 'open';
  });
  Session.prototype.save = vi.fn().mockResolvedValue(undefined);
  return { default: Session };
});

const { app } = await import('../app.js');

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
