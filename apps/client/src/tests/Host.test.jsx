import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import socket from '../socket.js';
import Host from '../pages/Host.jsx';
import { getSocketHandler, mockQuestion } from './helpers.js';

// vi.mock must live in this file — Vitest hoists it at parse time.
vi.mock('../socket.js', () => ({
  default: { on: vi.fn(), off: vi.fn(), emit: vi.fn(), connect: vi.fn() },
}));

vi.spyOn(globalThis, 'fetch').mockResolvedValue({
  ok: true,
  json: async () => ({}),
});

describe('Host', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading state before session_joined fires', () => {
    render(<Host code="XK92PL" onClose={vi.fn()} />);
    expect(screen.getByText('Loading question…')).toBeTruthy();
  });

  it('displays the question text after session_joined', () => {
    render(<Host code="XK92PL" onClose={vi.fn()} />);

    act(() => getSocketHandler('session_joined')({ question: mockQuestion }));

    expect(screen.getByText(mockQuestion.text)).toBeTruthy();
  });

  it('renders a result bar for each answer', () => {
    render(<Host code="XK92PL" onClose={vi.fn()} />);

    act(() => getSocketHandler('session_joined')({ question: mockQuestion }));

    mockQuestion.answers.forEach(({ text }) => {
      expect(screen.getByText(text)).toBeTruthy();
    });
  });

  it('updates percentages when vote_update fires', () => {
    render(<Host code="XK92PL" onClose={vi.fn()} />);

    act(() => getSocketHandler('session_joined')({ question: mockQuestion }));
    act(() =>
      getSocketHandler('vote_update')({
        results: [
          { answerId: 'a1', count: 3 },
          { answerId: 'a2', count: 1 },
        ],
      })
    );

    expect(screen.getByText('75%')).toBeTruthy();
    expect(screen.getByText('25%')).toBeTruthy();
  });

  it('opens the confirm modal when Close session is clicked', () => {
    render(<Host code="XK92PL" onClose={vi.fn()} />);

    act(() => getSocketHandler('session_joined')({ question: mockQuestion }));

    fireEvent.click(
      screen.getAllByRole('button', { name: /close session/i })[0]
    );

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Close this session?')).toBeTruthy();
  });

  it('dismisses the modal when Cancel is clicked', () => {
    render(<Host code="XK92PL" onClose={vi.fn()} />);

    act(() => getSocketHandler('session_joined')({ question: mockQuestion }));

    fireEvent.click(
      screen.getAllByRole('button', { name: /close session/i })[0]
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('calls onClose when session_closed fires', () => {
    const onClose = vi.fn();
    render(<Host code="XK92PL" onClose={onClose} />);

    act(() => getSocketHandler('session_closed')());

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('emits join_session with the code on mount', () => {
    render(<Host code="XK92PL" onClose={vi.fn()} />);
    expect(socket.emit).toHaveBeenCalledWith('join_session', 'XK92PL');
  });
});
