import { GoogleLogin } from "@react-oauth/google";
import { api } from "../api/client";

type Props = {
  onSuccess?: () => void;
  onClose?: () => void;
};

export default function GoogleAuthPopup({ onSuccess, onClose }: Props) {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.72)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
    }}>
      <div style={{
        background: "#1d1d1d",
        border: "1px solid rgba(255,255,255,0.1)",
        padding: "36px 28px",
        borderRadius: 16,
        width: 360,
        maxWidth: "90vw",
        textAlign: "center",
        position: "relative",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 16,
            background: "transparent",
            border: "none",
            fontSize: 22,
            cursor: "pointer",
            color: "#fff",
            lineHeight: 1,
          }}
          aria-label="Close"
        >
          ✕
        </button>

        <h3 style={{
          marginBottom: 8,
          fontSize: 22,
          fontWeight: 600,
          color: "#ffffff",
          fontFamily: "var(--font-heading)",
        }}>
          Sign in to continue
        </h3>
        <p style={{
          marginBottom: 24,
          fontSize: 14,
          color: "#939393",
          fontFamily: "var(--font-body)",
        }}>
          Access exclusive coaching materials
        </p>

        <GoogleLogin
          onSuccess={async (res) => {
            try {
              const response = await api.post("/auth/google", {
                token: res.credential,
              });
              const user = response.data;
              localStorage.setItem("authUser", JSON.stringify(user));
              localStorage.setItem("googleToken", res.credential!);
              onSuccess?.();
            } catch (err) {
              console.error("Login error", err);
            }
          }}
          onError={() => console.log("Login failed")}
        />
      </div>
    </div>
  );
}
