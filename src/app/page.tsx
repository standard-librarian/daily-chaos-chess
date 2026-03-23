import Link from "next/link";

import { ActionStatusBanner } from "@/components/action-status-banner";
import { AuthPanel } from "@/components/auth-panel";
import { BoardScene } from "@/components/board-scene";
import { Countdown } from "@/components/countdown";
import { PromptFeed } from "@/components/prompt-feed";
import { getViewerContext } from "@/infrastructure/auth/demo-auth";
import { getChaosChessService } from "@/infrastructure/container";
import { readActionStatus } from "@/presentation/action-status";
import { formatDateTime } from "@/presentation/lib";

export default async function HomePage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const service = getChaosChessService();
  const view = await service.viewCurrentWorld();
  const { user } = await getViewerContext();
  const status = await readActionStatus(searchParams);

  return (
    <main className="page">
      <header className="site-header">
        <div className="container">
          <div className="nav-shell">
            <Link className="logo" href="/">
              Daily Chaos Chess
            </Link>
            <nav className="nav-links">
              <Link href="/">Board</Link>
              <Link href="/history">History</Link>
              <Link href="/admin">Admin</Link>
            </nav>
          </div>
        </div>
      </header>

      <section className="hero-stage">
        <div className="hero-board">
          <BoardScene worldState={view.worldState} />
        </div>

        <div className="hero-overlay">
          <div className="hero-copy reveal">
            <div className="hero-copy-surface">
              <ActionStatusBanner status={status} />
              <div className="eyebrow">Daily Chaos Chess</div>
              <h1 className="hero-title">The crowd writes the next move. The board learns to regret it.</h1>
              <p className="hero-lead">
                One winning prompt becomes canon each day. Sometimes it nudges a pawn. Sometimes it opens a hole in reality and calls that fair play.
              </p>
              <div className="hero-meta-row">
                <div className="hero-badge">Turn {view.currentTurn.turnNumber}</div>
                <div className="hero-badge">Mode {view.automationMode}</div>
                <div className="hero-badge">Closes {formatDateTime(view.currentTurn.closesAt)}</div>
              </div>
            </div>
          </div>

          <div className="hero-side reveal delay-1">
            <div className="hero-note">
              <div className="eyebrow">Current lore</div>
              <h2 className="hero-note-title">{view.latestLore?.title ?? "The board is listening."}</h2>
              <p className="hero-note-copy">{view.latestLore?.summary ?? "The first move has not yet become canon."}</p>
              <p className="hero-note-copy muted">
                {view.latestLore?.details ?? "Vote on the next prompt to decide what the board becomes tomorrow."}
              </p>
            </div>

            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-label">Boards</span>
                <span className="hero-stat-value">{view.worldState.boards.length}</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-label">Entities</span>
                <span className="hero-stat-value">{view.worldState.entities.length}</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-label">Artifacts</span>
                <span className="hero-stat-value">{view.worldState.artifacts.length}</span>
              </div>
            </div>
          </div>
        </div>

        <a className="scroll-tease reveal delay-2" href="#prompt-feed">
          <div className="scroll-tease-copy">
            <span className="scroll-tease-label">Next move council</span>
            <span className="scroll-tease-title" data-testid="prompt-feed-teaser">
              {view.promptFeed.length > 0 ? `${view.promptFeed.length} prompts waiting below` : "Scroll to cast the first command"}
            </span>
          </div>
          <div className="scroll-tease-side">
            <Countdown closesAt={view.currentTurn.closesAt} />
            <span className="scroll-tease-arrow">Scroll</span>
          </div>
        </a>
      </section>

      <section className="section" id="prompt-feed">
        <div className="container stack section-stack">
          <div className="section-heading reveal">
            <div>
              <div className="eyebrow">Prompt feed</div>
              <h2 className="section-title">Tell the board what tomorrow should look like.</h2>
            </div>
            <p className="section-copy">
              The 3D board is just the stage. The real source of truth is the canon below: prompts, votes, lore, and the action script that survives the cutoff.
            </p>
          </div>

          <div className="home-grid reveal delay-1">
            <div>
              <PromptFeed prompts={view.promptFeed} turn={view.currentTurn} user={user} />
            </div>
            <div className="stack sidebar-stack">
              <AuthPanel user={user} />
              <div className="panel">
                <div className="eyebrow">Asset direction</div>
                <h3 className="panel-title">Generic chaos props</h3>
                <p className="muted">
                  For later visual upgrades, start with CC0 packs from Poly Pizza, Kenney, or Quaternius for portals, ruins, crystals, and ritual props.
                </p>
                <p className="meta">Keep the board canonical. Treat props as atmosphere layered around the canon, not as the source of game state.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
