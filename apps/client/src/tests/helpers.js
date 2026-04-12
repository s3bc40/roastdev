/**
 * Shared test helpers.
 *
 * NOTE — vi.mock() calls cannot be extracted here.
 * Vitest hoists vi.mock() to the top of each file at parse time, so the
 * factory must be declared in the test file itself. Import this module
 * after your vi.mock() declarations.
 */
import socket from '../socket.js';

/**
 * Returns the handler function registered for a socket event.
 *
 * useSession calls socket.on(event, fn) inside useEffect. After a render,
 * this helper finds the exact fn so tests can trigger events manually:
 *
 *   act(() => getSocketHandler('session_joined')({ question: mockQuestion }));
 */
export function getSocketHandler(event) {
  return socket.on.mock.calls.find(([e]) => e === event)?.[1];
}

/**
 * Shared question fixture — used by Host and Participant tests.
 * Matches the shape emitted by the server in session_joined.
 */
export const mockQuestion = {
  id: 'q1',
  text: 'Deploy en prod le vendredi 17h ?',
  answers: [
    { id: 'a1', text: 'Jamais de la vie' },
    { id: 'a2', text: "Yolo c'est vendredi" },
    { id: 'a3', text: 'Uniquement hotfix' },
    { id: 'a4', text: 'Je suis le seul dev' },
  ],
};
