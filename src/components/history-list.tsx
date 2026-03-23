import { HistoryEntry } from "@/domain/model/types";
import { formatDateTime } from "@/presentation/lib";

export function HistoryList({ history }: { history: HistoryEntry[] }) {
  return (
    <div className="history-list">
      {history.map((entry) => (
        <div className="history-card" data-testid="history-card" key={entry.turn.id}>
          <div className="split">
            <h3>Day {entry.turn.turnNumber}</h3>
            <div className="pill">{entry.turn.status}</div>
          </div>
          <p>{entry.loreEntry?.summary ?? entry.turn.summary ?? "No lore summary yet."}</p>
          <div className="stats">
            <div className="stat">
              <div className="meta">Boards</div>
              <div className="stat-value">{entry.snapshot.boards.length}</div>
            </div>
            <div className="stat">
              <div className="meta">Entities</div>
              <div className="stat-value">{entry.snapshot.entities.length}</div>
            </div>
            <div className="stat">
              <div className="meta">Artifacts</div>
              <div className="stat-value">{entry.snapshot.artifacts.length}</div>
            </div>
          </div>
          <p className="meta" style={{ marginTop: 12 }}>
            Closed {entry.turn.closedAt ? formatDateTime(entry.turn.closedAt) : "not yet"} · Executed{" "}
            {entry.turn.executedAt ? formatDateTime(entry.turn.executedAt) : "not yet"}
          </p>
          {entry.actionScript ? (
            <details>
              <summary className="small muted">Replay action script</summary>
              <pre className="mono small">{JSON.stringify(entry.actionScript.operations, null, 2)}</pre>
            </details>
          ) : null}
        </div>
      ))}
    </div>
  );
}
