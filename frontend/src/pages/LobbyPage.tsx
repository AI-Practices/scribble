import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, isHost, error, isLoading, connectionIssue } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    roomStore.startPolling(2000);
    return () => {
      roomStore.stopPolling();
    };
  }, [roomStore]);

  async function handleRefresh() {
    try {
      await roomStore.fetchRoom();
    } catch {
      // error is tracked via connectionIssue in the store
    }
  }

  if (!room) {
    return null;
  }

  return (
    <section className="panel placeholder-page">
      {connectionIssue && (
        <p className="connection-warning">Connection issue — updates may be delayed</p>
      )}

      <div className="lobby-header">
        <PageHeader
          kicker="Waiting for players"
          title="Lobby"
          description="Share the room code with friends so they can join your game."
        />
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="summary-grid">
        <Card title="Participants">
          {room.participants.length === 0 ? (
            <p>No participants are connected to this room yet.</p>
          ) : (
            <ul className="player-list">
              {room.participants.map((participant) => (
                <li key={participant.id}>
                  <span>{participant.name}</span>
                  {participant.id === room.hostId && <span className="player-list__badge">Host</span>}
                  <span className="player-list__meta">joined</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p className="status-line" style={{ backgroundColor: isLoading ? '#fef3c7' : '#e0e7ff', color: isLoading ? '#b45309' : '#3730a3' }}>
            {isLoading ? "Refreshing players..." : "Ready to play"}
          </p>
          <p style={{ marginTop: '8px' }}>{error ?? "Waiting for the host to start the game."}</p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--text" onClick={handleRefresh}>
          Refresh
        </button>
        {isHost ? (
          <button
            className="button button--primary"
            disabled={room.participants.length < 2}
            onClick={() => navigate("/game")}
          >
            {room.participants.length < 2 ? "Waiting for players..." : "Start Game"}
          </button>
        ) : (
          <p className="host-message">Waiting for the host to start the game.</p>
        )}
      </div>
    </section>
  );
}
