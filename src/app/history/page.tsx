import Link from "next/link";

import { ActionStatusBanner } from "@/components/action-status-banner";
import { HistoryList } from "@/components/history-list";
import { getChaosChessService } from "@/infrastructure/container";
import { readActionStatus } from "@/presentation/action-status";

export default async function HistoryPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const history = await getChaosChessService().browseHistory();
  const status = await readActionStatus(searchParams);

  return (
    <main className="shell stack">
      <div className="nav-row">
        <Link className="nav-link" href="/">
          Board
        </Link>
        <Link className="nav-link active" href="/history">
          History
        </Link>
        <Link className="nav-link" href="/admin">
          Admin
        </Link>
      </div>

      <div className="panel">
        <ActionStatusBanner status={status} />
        <div className="eyebrow">Canon archive</div>
        <h1>Every day the board survived so far</h1>
        <p className="muted">Snapshots stay reproducible because each turn stores the winner, the action script, and the world state that followed.</p>
      </div>

      <HistoryList history={history} />
    </main>
  );
}
