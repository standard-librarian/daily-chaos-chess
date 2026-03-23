import { CurrentUser } from "@/application/ports";
import { signInAction, signOutAction } from "@/app/actions";

export function AuthPanel({ user }: { user?: CurrentUser }) {
  if (user) {
    return (
      <div className="panel" data-testid="auth-panel">
        <div className="split">
          <div>
            <div className="eyebrow">Presence</div>
            <h2 data-testid="viewer-name">{user.displayName}</h2>
            <p className="muted">
              {user.isAdmin ? "Admin mode is active for adjudication and automation controls." : "Signed in to submit prompts and vote."}
            </p>
          </div>
          <form action={signOutAction}>
            <input name="returnTo" type="hidden" value="/" />
            <button className="button secondary" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="panel" data-testid="auth-panel">
      <div className="eyebrow">Join the canon</div>
      <h2>Pick a display name</h2>
      <p className="muted">This demo uses lightweight cookie auth so you can post and vote immediately.</p>
      <form action={signInAction} className="stack" data-testid="auth-form">
        <input className="field" data-testid="auth-name-input" name="name" placeholder="The Crowd Whispers..." required />
        <input name="returnTo" type="hidden" value="/" />
        <label className="meta">
          <input data-testid="auth-admin-checkbox" name="isAdmin" type="checkbox" /> Sign in as admin for local adjudication
        </label>
        <div>
          <button className="button" data-testid="auth-submit" type="submit">
            Enter the board
          </button>
        </div>
      </form>
    </div>
  );
}
