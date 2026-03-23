import Link from "next/link";

import {
  closeTurnAction,
  executeResolvedTurnAction,
  moderatePromptAction,
  resolveWinningPromptAction,
  toggleAutomationModeAction
} from "@/app/actions";
import { getViewerContext } from "@/infrastructure/auth/demo-auth";
import { getChaosChessService } from "@/infrastructure/container";
import { buildSuggestedActionScript } from "@/presentation/lib";

export default async function AdminPage() {
  const service = getChaosChessService();
  const view = await service.viewCurrentWorld();
  const { user } = await getViewerContext();
  const winningPrompt = view.currentTurn.winningPromptId
    ? view.promptFeed.find((prompt) => prompt.id === view.currentTurn.winningPromptId)
    : undefined;
  const suggestedScript = winningPrompt ? buildSuggestedActionScript(winningPrompt, view.worldState) : undefined;

  return (
    <main className="shell stack">
      <div className="nav-row">
        <Link className="nav-link" href="/">
          Board
        </Link>
        <Link className="nav-link" href="/history">
          History
        </Link>
        <Link className="nav-link active" href="/admin">
          Admin
        </Link>
      </div>

      <div className="panel">
        <div className="eyebrow">Adjudication deck</div>
        <h1>Run the canon pipeline</h1>
        <p className="muted">
          Admin-assisted resolution is the default. Flip to full auto later without changing the execution pipeline.
        </p>
        <p className="meta">
          Signed in as: {user ? `${user.displayName}${user.isAdmin ? " (admin)" : ""}` : "anonymous visitor"}
        </p>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="eyebrow">Turn controls</div>
          <h2>Current turn: Day {view.currentTurn.turnNumber}</h2>
          <div className="pill-row" style={{ marginBottom: 18 }}>
            <div className="pill">{view.currentTurn.status}</div>
            <div className="pill">mode: {view.automationMode}</div>
          </div>
          <div className="form-row">
            <form action={closeTurnAction}>
              <button className="button" type="submit">
                Force close current turn
              </button>
            </form>
            <form action={executeResolvedTurnAction}>
              <button className="button secondary" type="submit">
                Execute resolved turn
              </button>
            </form>
          </div>
          <form action={toggleAutomationModeAction} className="stack" style={{ marginTop: 20 }}>
            <input name="mode" type="hidden" value={view.automationMode === "manual_assisted" ? "auto_execute" : "manual_assisted"} />
            <button className="button secondary" type="submit">
              Switch to {view.automationMode === "manual_assisted" ? "auto execute" : "manual assisted"}
            </button>
          </form>
        </div>

        <div className="panel">
          <div className="eyebrow">Moderation queue</div>
          <h2>Prompt feed review</h2>
          <div className="prompt-list">
            {view.promptFeed.map((prompt) => (
              <div className="prompt-card" key={prompt.id}>
                <div className="split">
                  <h3>{prompt.text}</h3>
                  <div className="pill">{prompt.status}</div>
                </div>
                <div className="form-row" style={{ marginTop: 12 }}>
                  <form action={moderatePromptAction}>
                    <input name="promptId" type="hidden" value={prompt.id} />
                    <input name="accepted" type="hidden" value="true" />
                    <input name="notes" type="hidden" value="Approved by admin." />
                    <button className="button secondary" type="submit">
                      Approve
                    </button>
                  </form>
                  <form action={moderatePromptAction}>
                    <input name="promptId" type="hidden" value={prompt.id} />
                    <input name="accepted" type="hidden" value="false" />
                    <input name="notes" type="hidden" value="Rejected by admin." />
                    <button className="button danger" type="submit">
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="eyebrow">Resolve winner</div>
        <h2>{winningPrompt ? `Winning prompt: ${winningPrompt.text}` : "No winner yet"}</h2>
        <p className="muted">
          Use the bounded action script below. This can be generated automatically later, but the persistence and execution path stays the same.
        </p>
        <form action={resolveWinningPromptAction} className="stack">
          <textarea
            className="textarea mono small"
            name="actionScriptJson"
            defaultValue={JSON.stringify(suggestedScript ?? {}, null, 2)}
          />
          <div>
            <button className="button" disabled={!winningPrompt} type="submit">
              Approve action script
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
