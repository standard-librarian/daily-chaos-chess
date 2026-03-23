import { CurrentUser } from "@/application/ports";
import { Prompt, Turn } from "@/domain/model/types";
import { formatDateTime } from "@/presentation/lib";
import { submitPromptAction, voteOnPromptAction } from "@/app/actions";

export function PromptFeed({
  prompts,
  turn,
  user
}: {
  prompts: Prompt[];
  turn: Turn;
  user?: CurrentUser;
}) {
  return (
    <div className="panel">
      <div className="split">
        <div>
          <div className="eyebrow">Daily prompts</div>
          <h2 data-testid="prompt-feed-title">Day {turn.turnNumber} voting feed</h2>
        </div>
        <div className="status" data-testid="prompt-feed-status">{turn.status.replace("_", " ")}</div>
      </div>
      <p className="muted">
        Submit what should happen next, then push the wildest idea to the top before the hourglass flips.
      </p>

      <form action={submitPromptAction} className="stack" data-testid="prompt-form" style={{ marginBottom: 24 }}>
        <input name="returnTo" type="hidden" value="/" />
        <textarea
          className="textarea"
          data-testid="prompt-textarea"
          name="text"
          placeholder={user ? "Summon a side board through a portal behind the black queen." : "Sign in first to submit a prompt."}
          disabled={!user || turn.status !== "open"}
        />
        <div>
          <button className="button" data-testid="prompt-submit" type="submit" disabled={!user || turn.status !== "open"}>
            Submit prompt
          </button>
        </div>
      </form>

      <div className="prompt-list">
        {prompts.length === 0 ? (
          <div className="prompt-card">
            <h3>No prompts yet</h3>
            <p className="muted">The canon is still waiting for its next instruction.</p>
          </div>
        ) : (
          prompts.map((prompt, index) => (
            <div className="prompt-card" data-testid="prompt-card" key={prompt.id}>
              <div className="split">
                <h3>{prompt.text}</h3>
                <div className="pill" data-testid={`prompt-votes-${index}`}>{prompt.votes} votes</div>
              </div>
              <div className="meta" data-testid={`prompt-meta-${index}`}>
                by <strong>{prompt.authorId}</strong> · submitted {formatDateTime(prompt.submittedAt)} · {prompt.status}
              </div>
              {prompt.moderationNotes ? <p className="muted small">{prompt.moderationNotes}</p> : null}
              <div className="prompt-actions" style={{ marginTop: 12 }}>
                <form action={voteOnPromptAction}>
                  <input name="promptId" type="hidden" value={prompt.id} />
                  <input name="returnTo" type="hidden" value="/" />
                  <button
                    className="button secondary"
                    data-testid={`vote-button-${index}`}
                    disabled={!user || turn.status !== "open" || prompt.status !== "active"}
                    type="submit"
                  >
                    Vote
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
