import type { Guess } from "../services/api";

interface GuessHistoryProps {
  guesses: Guess[];
}

export function GuessHistory({ guesses }: GuessHistoryProps) {
  if (guesses.length === 0) {
    return <p className="guess-history__empty">No guesses yet</p>;
  }

  return (
    <ul className="guess-history">
      {guesses.map((guess) => (
        <li key={guess.id} className={`guess-history__item ${guess.isCorrect ? "guess-history__item--correct" : ""}`}>
          <span className="guess-history__name">{guess.participantName}:</span>{" "}
          <span className="guess-history__content">{guess.content}</span>
          {guess.isCorrect && <span className="guess-history__badge">✓</span>}
        </li>
      ))}
    </ul>
  );
}
