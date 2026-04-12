import { io } from 'socket.io-client';

/**
 * Singleton Socket.io client.
 *
 * autoConnect: false — the socket does NOT connect on import.
 * We call socket.connect() explicitly after the user enters a valid code,
 * so we never open a WebSocket against a session that doesn't exist yet.
 *
 * One module-level instance is shared across all components: if io() were
 * called inside a component, every re-render would create a new connection.
 */
const socket = io(import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001', {
  autoConnect: false,
});

export default socket;
