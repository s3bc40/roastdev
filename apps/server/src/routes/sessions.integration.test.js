import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { io as ioc } from 'socket.io-client';
import { server, io, app } from '../app.js';

const PORT = 3098;
const URL = `http://localhost:${PORT}`;

function waitFor(socket, event) {
  return new Promise((resolve) => socket.once(event, resolve));
}

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await new Promise((resolve) => server.listen(PORT, resolve));
});

afterAll(async () => {
  await mongoose.connection.db.dropCollection('sessions');
  await mongoose.connection.db.dropCollection('votes');
  await mongoose.disconnect();
  await new Promise((resolve) => {
    io.close();
    server.close(resolve);
  });
});

describe('Full session flow', () => {
  it('create → join → vote → get results → close', async () => {
    // 1. Create session
    const createRes = await request(app).post('/sessions');
    expect(createRes.status).toBe(201);
    const { code } = createRes.body;

    // 2. Join via socket
    const client = ioc(URL, { forceNew: true, transports: ['websocket'] });
    client.emit('join_session', code);
    const { question } = await waitFor(client, 'session_joined');
    expect(question).toMatchObject({
      id: expect.any(String),
      text: expect.any(String),
    });

    // 3. Vote — pick the first answer from the question
    const answerId = question.answers[0].id;
    client.emit('submit_vote', { code, answerId });
    const { results: voteResults } = await waitFor(client, 'vote_update');
    expect(voteResults).toContainEqual({ answerId, count: 1 });

    // 4. GET results via REST — confirms DB write from submit_vote
    const getRes = await request(app).get(`/sessions/${code}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.results).toContainEqual({ answerId, count: 1 });

    // 5. Close — assert REST response and that socket receives session_closed
    const closedPromise = waitFor(client, 'session_closed');
    const closeRes = await request(app).patch(`/sessions/${code}/close`);
    expect(closeRes.status).toBe(200);
    expect(closeRes.body.status).toBe('closed');
    await closedPromise;

    client.disconnect();
  });
});
