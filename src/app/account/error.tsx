"use client";

export default function AccountError({ reset }: { reset: () => void }) {
  return (
    <div className="account-message" role="alert">
      <p>Account services are temporarily unavailable.</p>
      <button className="account-button" type="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
