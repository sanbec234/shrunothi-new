import { GoogleLogin } from "@react-oauth/google";
import { api } from "../api/client"; // adjust path if needed

type Props = {
  onSuccess?: () => void;
  onClose?: () => void;
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2000
};

const popupStyle: React.CSSProperties = {
  background: "#fff",
  padding: "28px 24px",
  borderRadius: 12,
  width: 360,
  maxWidth: "90vw",
  textAlign: "center",
  position: "relative",
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)"
};

const closeStyle: React.CSSProperties = {
  position: "absolute",
  top: 10,
  right: 12,
  background: "transparent",
  border: "none",
  fontSize: 22,
  fontWeight: 600,
  color: "#111",           // 🔑 makes it visible
  cursor: "pointer",
  zIndex: 10,              // 🔑 above Google iframe
  lineHeight: 1
};

export default function GoogleAuthPopup({ onSuccess, onClose }: Props) {
  return (
    <div style={overlayStyle}>
      <div style={popupStyle}>
        <button style={closeStyle} onClick={onClose}>✕</button>

        <h3 style={{ marginBottom: 16 }}>Sign in with Google</h3>

        <GoogleLogin
          onSuccess={async (res) => {
            try {
              const response = await api.post("/auth/google", {
                token: res.credential
              });

              const user = response.data;

              localStorage.setItem("authUser", JSON.stringify(user));

              onSuccess?.();
            } catch (err) {
              console.error("Login error", err);
            }
          }}
          onError={() => {
            console.log("Login failed");
          }}
        />
      </div>
    </div>
  );
}