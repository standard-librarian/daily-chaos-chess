import Link from "next/link";

import { ActionStatusBanner } from "@/components/action-status-banner";
import {
  closeTurnAction,
  executeResolvedTurnAction,
  moderatePromptAction,
  resolveWinningPromptAction,
  toggleAutomationModeAction
} from "@/app/actions";
import { getViewerContext } from "@/infrastructure/auth/demo-auth";
import { getChaosChessService } from "@/infrastructure/container";
import { readActionStatus } from "@/presentation/action-status";
import { buildSuggestedActionScript } from "@/presentation/lib";

export default async function AdminPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const service = getChaosChessService();
  const view = await service.viewCurrentWorld();
  const { user } = await getViewerContext();
  const status = await readActionStatus(searchParams);
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
        <ActionStatusBanner status={status} />
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
            <div className="pill" data-testid="admin-turn-status">{view.currentTurn.status}</div>
            <div className="pill" data-testid="admin-automation-mode">mode: {view.automationMode}</div>
          </div>
          <div className="form-row">
            <form action={closeTurnAction}>
              <input name="returnTo" type="hidden" value="/admin" />
              <button className="button" data-testid="admin-close-turn" type="submit">
                Force close current turn
              </button>
            </form>
            <form action={executeResolvedTurnAction}>
              <input name="returnTo" type="hidden" value="/admin" />
              <button className="button secondary" data-testid="admin-execute-turn" type="submit">
                Execute resolved turn
              </button>
            </form>
          </div>
          <form action={toggleAutomationModeAction} className="stack" style={{ marginTop: 20 }}>
            <input name="mode" type="hidden" value={view.automationMode === "manual_assisted" ? "auto_execute" : "manual_assisted"} />
            <input name="returnTo" type="hidden" value="/admin" />
            <button className="button secondary" data-testid="admin-toggle-automation" type="submit">
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
                    <input name="returnTo" type="hidden" value="/admin" />
                    <button className="button secondary" data-testid={`admin-approve-${prompt.id}`} type="submit">
                      Approve
                    </button>
                  </form>
                  <form action={moderatePromptAction}>
                    <input name="promptId" type="hidden" value={prompt.id} />
                    <input name="accepted" type="hidden" value="false" />
                    <input name="notes" type="hidden" value="Rejected by admin." />
                    <input name="returnTo" type="hidden" value="/admin" />
                    <button className="button danger" data-testid={`admin-reject-${prompt.id}`} type="submit">
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
        <h2 data-testid="admin-winning-prompt">{winningPrompt ? `Winning prompt: ${winningPrompt.text}` : "No winner yet"}</h2>
        <p className="muted">
          Use the bounded action script below. This can be generated automatically later, but the persistence and execution path stays the same.
        </p>
        <form action={resolveWinningPromptAction} className="stack">
          <textarea
            className="textarea mono small"
            data-testid="admin-action-script"
            name="actionScriptJson"
            defaultValue={JSON.stringify(suggestedScript ?? {}, null, 2)}
          />
          <input name="returnTo" type="hidden" value="/admin" />
          <div>
            <button className="button" data-testid="admin-approve-script" disabled={!winningPrompt} type="submit">
              Approve action script
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
