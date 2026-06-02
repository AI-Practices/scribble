import { useState } from "react";
import { api } from "../services/api";

interface GuessFormProps {
  roomCode: string;
  participantId: string;
  guessedCorrectly?: boolean;
  disabled?: boolean;
}

export function GuessForm({ roomCode, participantId, guessedCorrectly = false, disabled = false }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [feedback, setFeedback] = useState<{ type: "error" | "correct" | "incorrect"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isDisabled = disabled || guessedCorrectly || submitting;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const trimmed = guessText.trim();
    if (!trimmed) {
      setFeedback({ type: "error", message: "Guess cannot be empty" });
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.submitGuess(roomCode, participantId, trimmed);
      if (result.result === "correct") {
        setFeedback({ type: "correct", message: `Correct! You earned ${result.scoreAwarded} points (Total: ${result.totalScore})` });
        setGuessText("");
      } else {
        setFeedback({ type: "incorrect", message: "Incorrect, try again!" });
        setGuessText("");
      }
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to submit guess" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => setGuessText(event.target.value)}
          placeholder="Type your guess here..."
          disabled={isDisabled}
        />
      </label>
      {feedback && (
        <p className={`guess-feedback guess-feedback--${feedback.type}`}>
          {feedback.message}
        </p>
      )}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={isDisabled}>
          {guessedCorrectly ? "Already Guessed Correctly" : submitting ? "Submitting..." : "Submit Guess"}
        </button>
      </div>
    </form>
  );
}
