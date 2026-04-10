import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
} from 'vitest';
import { io as ioc } from 'socket.io-client';

// --- DB mocks (must be hoisted before app import) ---

vi.mock('../models/Session.js', () => ({
  default: { findOne: vi.fn() },
}));

vi.mock('../models/Vote.js', () => ({
  default: {
    findOneAndUpdate: vi.fn().mockResolvedValue({}),
    find: vi.fn(),
  },
}));

const { default: Session } = await import('../models/Session.js');
const { default: Vote } = await import('../models/Vote.js');
const { server, io } = await import('../app.js');

// --- Helpers ---

const PORT = 3099;
const URL = `http://localhost:${PORT}`;

function connect() {
  return ioc(URL, { forceNew: true, transports: ['websocket'] });
}

function waitFor(socket, event) {
  return new Promise((resolve) => socket.once(event, resolve));
}

// --- Lifecycle ---

beforeAll(() => new Promise((resolve) => server.listen(PORT, resolve)));
afterAll(
  () =>
    new Promise((resolve) => {
      io.close();
      server.close(resolve);
    })
);
beforeEach(() => vi.clearAllMocks());

// --- Tests ---

describe('join_session', () => {
  it('emits session_joined with the question when session is open', async () => {
    Session.findOne.mockResolvedValue({
      code: 'AAA111',
      questionId: 'q1',
      status: 'open',
    });

    const client = connect();
    client.emit('join_session', 'AAA111');

    const result = await waitFor(client, 'session_joined');
    expect(result.question).toMatchObject({
      id: 'q1',
      text: expect.any(String),
    });
    client.disconnect();
  });

  it('emits error when session is not found', async () => {
    Session.findOne.mockResolvedValue(null);

    const client = connect();
    client.emit('join_session', 'NOPE99');

    const result = await waitFor(client, 'error');
    expect(result.message).toBe('Session not found');
    client.disconnect();
  });

  it('emits error when session is closed', async () => {
    Session.findOne.mockResolvedValue({
      code: 'ZZZ000',
      questionId: 'q1',
      status: 'closed',
    });

    const client = connect();
    client.emit('join_session', 'ZZZ000');

    const result = await waitFor(client, 'error');
    expect(result.message).toBe('Session is closed');
    client.disconnect();
  });
});

describe('submit_vote', () => {
  it('broadcasts vote_update with results to the room', async () => {
    Session.findOne.mockResolvedValue({
      code: 'BBB222',
      questionId: 'q2',
      status: 'open',
    });
    Vote.find.mockResolvedValue([
      { answerId: 'a1' },
      { answerId: 'a2' },
      { answerId: 'a1' },
    ]);

    const client = connect();
    // Must join the session first — socket.join(code) puts the client in the room.
    // io.to(code).emit() only reaches sockets in that room.
    client.emit('join_session', 'BBB222');
    await waitFor(client, 'session_joined');

    client.emit('submit_vote', { code: 'BBB222', answerId: 'a1' });
    const result = await waitFor(client, 'vote_update');
    expect(result.results).toEqual(
      expect.arrayContaining([
        { answerId: 'a1', count: 2 },
        { answerId: 'a2', count: 1 },
      ])
    );
    client.disconnect();
  });

  it('emits error when session is closed', async () => {
    Session.findOne.mockResolvedValue({
      code: 'CCC333',
      questionId: 'q1',
      status: 'closed',
    });

    const client = connect();
    client.emit('submit_vote', { code: 'CCC333', answerId: 'a1' });

    const result = await waitFor(client, 'error');
    expect(result.message).toBe('Session is closed');
    client.disconnect();
  });
});
