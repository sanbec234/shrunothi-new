import { useEffect, useRef } from "react";
import "./welcomegate.css";

export default function WelcomeGate({
  onClose,
  onSuccess
}: {
  onClose: () => void;
  onSuccess: (user: any) => void;
}) {
  const googleBtnRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!googleBtnRef.current) return;

    /* global google */
    google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: (response: any) => {
        // decode token or send to backend
        localStorage.setItem("authUser", response.credential);
        sessionStorage.setItem("welcome_seen", "true");
        onSuccess(response);
      }
    });

    google.accounts.id.renderButton(googleBtnRef.current, {
      theme: "outline",
      size: "large",
      width: 260
    });
  }, []);

  return (
    <div className="welcome-gate-overlay">
      <div className="welcome-gate-card">
        <img
          src="/logo.png"
          alt="Shrunothi"
          className="welcome-gate-logo"
        />

        <h2 className="welcome-gate-title">
          Welcome to Shrunothi!
        </h2>

        <p className="welcome-gate-subtitle">
          Curated podcasts, materials, and self-help —
          organized by purpose, not noise. Sign in to access for materials for free.
        </p>

        {/* ✅ REAL Google button */}
        <div
          ref={googleBtnRef}
          className="welcome-gate-google-btn"
        />

        <button
          className="welcome-gate-skip"
          onClick={() => {
            sessionStorage.setItem("welcome_seen", "true");
            onClose();
          }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}