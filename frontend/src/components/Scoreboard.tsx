import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";
import type { PlayerScore } from "../services/api";

interface ScoreboardProps {
  scores: PlayerScore[];
}

export function Scoreboard({ scores }: ScoreboardProps) {
  const { room } = useRoomState();
  const participants = room?.participants ?? [];

  const allScores = participants.map((p) => {
    const existing = scores.find((s) => s.participantId === p.id);
    return {
      participantId: p.id,
      participantName: p.name,
      score: existing?.score ?? 0
    };
  });

  allScores.sort((a, b) => b.score - a.score);

  return (
    <Card title="Scoreboard">
      <ul className="scoreboard">
        {allScores.map((s) => (
          <li key={s.participantId} className="scoreboard__row">
            <span className="scoreboard__name">{s.participantName}</span>
            <strong className="scoreboard__score">{s.score}</strong>
          </li>
        ))}
      </ul>
    </Card>
  );
}
