import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Home from '../pages/Home.jsx';

// Prevent a real WebSocket from opening — socket is only called on submit
vi.mock('../socket.js', () => ({
  default: { on: vi.fn(), off: vi.fn(), emit: vi.fn(), connect: vi.fn() },
}));

const mockSession = { code: 'XK92PL', status: 'open' };

describe('Home', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockSession,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the code input and both action buttons', () => {
    render(<Home onJoin={vi.fn()} onHost={vi.fn()} />);

    expect(screen.getByPlaceholderText('_ _ _ _ _ _')).toBeTruthy();
    expect(screen.getByRole('button', { name: /join roast/i })).toBeTruthy();
    expect(
      screen.getByRole('button', { name: /host a session/i })
    ).toBeTruthy();
  });

  it('coerces typed input to uppercase', () => {
    render(<Home onJoin={vi.fn()} onHost={vi.fn()} />);

    const input = screen.getByPlaceholderText('_ _ _ _ _ _');
    fireEvent.change(input, { target: { value: 'abc123' } });

    expect(input.value).toBe('ABC123');
  });

  it('error slot is always rendered (no layout jump)', () => {
    render(<Home onJoin={vi.fn()} onHost={vi.fn()} />);

    // The <p> must exist in the DOM even with no error so layout is stable
    const errorSlot = screen.getByText('', { selector: 'p' });
    expect(errorSlot).toBeTruthy();
    expect(errorSlot.style.visibility).toBe('hidden');
  });

  it('shows an error when the session is closed', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'XK92PL', status: 'closed' }),
    });

    render(<Home onJoin={vi.fn()} onHost={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('_ _ _ _ _ _'), {
      target: { value: 'XK92PL' },
    });
    fireEvent.click(screen.getByRole('button', { name: /join roast/i }));

    await waitFor(() => {
      const errorSlot = screen.getByText(/closed/i);
      expect(errorSlot.style.visibility).toBe('visible');
    });
  });

  it('shows an error when the session is not found (404)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Session not found' }),
    });

    render(<Home onJoin={vi.fn()} onHost={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('_ _ _ _ _ _'), {
      target: { value: 'ZZZZZZ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /join roast/i }));

    await waitFor(() => {
      expect(screen.getByText(/session not found/i)).toBeTruthy();
    });
  });

  it('calls onJoin with the code when join succeeds', async () => {
    const onJoin = vi.fn();
    render(<Home onJoin={onJoin} onHost={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('_ _ _ _ _ _'), {
      target: { value: 'XK92PL' },
    });
    fireEvent.click(screen.getByRole('button', { name: /join roast/i }));

    await waitFor(() => {
      expect(onJoin).toHaveBeenCalledWith({ code: 'XK92PL' });
    });
  });

  it('calls onHost when host a session succeeds', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'NEWCOD', status: 'open' }),
    });

    const onHost = vi.fn();
    render(<Home onJoin={vi.fn()} onHost={onHost} />);

    fireEvent.click(screen.getByRole('button', { name: /host a session/i }));

    await waitFor(() => {
      expect(onHost).toHaveBeenCalledWith({ code: 'NEWCOD' });
    });
  });
});
