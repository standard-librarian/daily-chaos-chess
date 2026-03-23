import { ActionStatus } from "@/presentation/action-status";

export function ActionStatusBanner({ status }: { status?: ActionStatus }) {
  if (!status) {
    return null;
  }

  return (
    <div
      className={`status-banner ${status.kind}`}
      data-testid="status-banner"
      role={status.kind === "error" ? "alert" : "status"}
    >
      {status.message}
    </div>
  );
}
