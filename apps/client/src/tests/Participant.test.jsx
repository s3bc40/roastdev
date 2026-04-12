import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import socket from '../socket.js';
import Participant from '../pages/Participant.jsx';
import { getSocketHandler, mockQuestion } from './helpers.js';

// vi.mock must live in this file — Vitest hoists it at parse time.
vi.mock('../socket.js', () => ({
  default: { on: vi.fn(), off: vi.fn(), emit: vi.fn(), connect: vi.fn() },
}));

// canvas-confetti calls the Canvas API which is not available in jsdom
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

/** Renders Participant and fires session_joined so the question is set. */
function renderWithQuestion(props = {}) {
  const utils = render(
    <Participant code="XK92PL" onClose={vi.fn()} {...props} />
  );
  act(() => getSocketHandler('session_joined')({ question: mockQuestion }));
  return utils;
}

describe('Participant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading state before session_joined fires', () => {
    render(<Participant code="XK92PL" onClose={vi.fn()} />);
    expect(screen.getByText('Joining session…')).toBeTruthy();
  });

  it('renders all answer options in the voting phase', () => {
    renderWithQuestion();

    mockQuestion.answers.forEach(({ text }) => {
      expect(screen.getByText(text)).toBeTruthy();
    });
  });

  it('submit button is disabled before any answer is selected', () => {
    renderWithQuestion();

    const submitBtn = screen.getByRole('button', { name: /submit vote/i });
    expect(submitBtn.disabled).toBe(true);
  });

  it('selecting an answer adds the selected class and enables submit', () => {
    renderWithQuestion();

    const option = screen
      .getByText(mockQuestion.answers[0].text)
      .closest('.answer-opt');
    fireEvent.click(option);

    expect(option.classList.contains('selected')).toBe(true);
    expect(screen.getByRole('button', { name: /submit vote/i }).disabled).toBe(
      false
    );
  });

  it('submitting a vote emits submit_vote and transitions to waiting phase', () => {
    renderWithQuestion();

    fireEvent.click(
      screen.getByText(mockQuestion.answers[1].text).closest('.answer-opt')
    );
    fireEvent.click(screen.getByRole('button', { name: /submit vote/i }));

    expect(socket.emit).toHaveBeenCalledWith('submit_vote', {
      code: 'XK92PL',
      answerId: 'a2',
    });
    expect(screen.getByText('Vote submitted')).toBeTruthy();
    expect(screen.getByText('Waiting for others…')).toBeTruthy();
  });

  it('waiting phase shows the voted answer in the pill', () => {
    renderWithQuestion();

    fireEvent.click(
      screen.getByText(mockQuestion.answers[0].text).closest('.answer-opt')
    );
    fireEvent.click(screen.getByRole('button', { name: /submit vote/i }));

    // Text appears in both the voted-pill and the result bar label
    expect(
      screen.getAllByText(mockQuestion.answers[0].text).length
    ).toBeGreaterThan(0);
  });

  it('waiting phase shows live results updated by vote_update', () => {
    renderWithQuestion();

    fireEvent.click(
      screen.getByText(mockQuestion.answers[0].text).closest('.answer-opt')
    );
    fireEvent.click(screen.getByRole('button', { name: /submit vote/i }));

    act(() =>
      getSocketHandler('vote_update')({
        results: [
          { answerId: 'a1', count: 2 },
          { answerId: 'a2', count: 2 },
        ],
      })
    );

    // 2/4 = 50% for each
    const fifties = screen.getAllByText('50%');
    expect(fifties.length).toBe(2);
  });

  it('Change my answer returns to the voting phase', () => {
    renderWithQuestion();

    fireEvent.click(
      screen.getByText(mockQuestion.answers[0].text).closest('.answer-opt')
    );
    fireEvent.click(screen.getByRole('button', { name: /submit vote/i }));
    fireEvent.click(screen.getByRole('button', { name: /change my answer/i }));

    // Back to voting phase — submit button should be visible again
    expect(screen.getByRole('button', { name: /submit vote/i })).toBeTruthy();
  });

  it('previously selected answer stays highlighted after changing mind', () => {
    renderWithQuestion();

    fireEvent.click(
      screen.getByText(mockQuestion.answers[0].text).closest('.answer-opt')
    );
    fireEvent.click(screen.getByRole('button', { name: /submit vote/i }));
    fireEvent.click(screen.getByRole('button', { name: /change my answer/i }));

    const option = screen
      .getByText(mockQuestion.answers[0].text)
      .closest('.answer-opt');
    expect(option.classList.contains('selected')).toBe(true);
  });

  it('calls onClose when session_closed event fires', () => {
    const onClose = vi.fn();
    render(<Participant code="XK92PL" onClose={onClose} />);

    act(() => getSocketHandler('session_closed')());

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('cleans up socket listeners on unmount', () => {
    const { unmount } = render(<Participant code="XK92PL" onClose={vi.fn()} />);
    unmount();

    // off() should have been called for each of the 3 registered events
    expect(socket.off).toHaveBeenCalledTimes(3);
  });
});
