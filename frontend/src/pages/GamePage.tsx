import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { GuessHistory } from "../components/GuessHistory";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

function formatCountdown(endsAt: string): string {
  const remaining = Date.parse(endsAt) - Date.now();
  if (remaining <= 0) return "0s";
  const seconds = Math.ceil(remaining / 1000);
  return `${seconds}s`;
}

export function GamePage() {
  const navigate = useNavigate();
  const { room, participantId, round } = useRoomState();
  const roomStore = useRoomStore();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    roomStore.startRoundPolling(2000);
    return () => {
      roomStore.stopRoundPolling();
    };
  }, [roomStore]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const amDrawer = round?.amDrawer ?? (participantId === room.drawerId);
  const drawerName = round?.drawerName ?? room.drawerName ?? "Unknown";
  const isRoundEnd = round?.status === "round_end";
  const countdown = round?.endsAt ? formatCountdown(round.endsAt) : null;
  const secretWord = round?.secretWord;

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round {round?.number ?? 1}</span>
          <h1 className="game-page__title">Guess the Word!</h1>
        </div>
        <div className="game-page__header-right">
          {countdown && (
            <div className={`countdown-timer ${isRoundEnd ? "countdown-timer--ended" : "countdown-timer--active"}`}>
              {isRoundEnd ? "Time's up!" : countdown}
            </div>
          )}
          <RoomCodeBadge code={room.code} />
        </div>
      </div>

      <div className="drawer-banner">
        {amDrawer ? (
          <span className="drawer-banner__badge drawer-banner__badge--active">
            You are the drawer!
          </span>
        ) : (
          <span className="drawer-banner__badge drawer-banner__badge--waiting">
            {drawerName} is drawing...
          </span>
        )}
      </div>

      {amDrawer && secretWord && !isRoundEnd && (
        <div className="word-card">
          <span className="word-card__label">Your word</span>
          <span className="word-card__word">{secretWord}</span>
        </div>
      )}

      {isRoundEnd && secretWord && (
        <div className="word-card word-card--reveal">
          <span className="word-card__label">The word was</span>
          <span className="word-card__word">{secretWord}</span>
        </div>
      )}

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard scores={round?.scores ?? []} />
          <Card title="Guesses">
            <GuessHistory guesses={round?.guesses ?? []} />
          </Card>
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <DrawingCanvas
              amDrawer={amDrawer}
              roomCode={room.code}
              participantId={participantId ?? ""}
              canvasState={round?.canvas ?? null}
            />
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd className={amDrawer ? "role-drawer" : "role-guesser"}>
                  {amDrawer ? "Drawer" : "Guesser"}
                </dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{isRoundEnd ? "Round Ended" : "Playing"}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Your Guess">
            {amDrawer ? (
              <p className="guess-feedback guess-feedback--info">You are drawing — no guessing for you!</p>
            ) : (
              <GuessForm
                roomCode={room.code}
                participantId={participantId ?? ""}
                guessedCorrectly={round?.guessedCorrectly ?? false}
              />
            )}
          </Card>
        </aside>
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
